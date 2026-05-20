import { Router, type IRouter } from "express";
import { desc, sql, eq, gte } from "drizzle-orm";
import { db, workoutLogsTable, workoutLogSetsTable, exercisesTable } from "@workspace/db";
import {
  GetProgressSummaryResponse,
  GetWeeklyProgressResponse,
  GetPersonalRecordsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/progress/summary", async (_req, res): Promise<void> => {
  const logs = await db.select().from(workoutLogsTable).orderBy(workoutLogsTable.completedAt);

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const totalVolume = logs.reduce((sum, l) => sum + (l.totalVolume ?? 0), 0);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const workoutsThisWeek = logs.filter(l => new Date(l.completedAt) >= weekAgo).length;
  const workoutsThisMonth = logs.filter(l => new Date(l.completedAt) >= monthAgo).length;

  // Calculate streak (consecutive days)
  let currentStreak = 0;
  let longestStreak = 0;
  if (logs.length > 0) {
    const dates = [...new Set(logs.map(l => new Date(l.completedAt).toDateString()))].sort();
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    currentStreak = daysSinceLast <= 1 ? tempStreak : 0;
  }

  res.json(GetProgressSummaryResponse.parse({
    totalWorkouts,
    totalMinutes,
    currentStreak,
    longestStreak,
    totalVolume,
    workoutsThisWeek,
    workoutsThisMonth,
    favoriteCategory: null,
  }));
});

router.get("/progress/weekly", async (_req, res): Promise<void> => {
  // Last 8 weeks of data
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const logs = await db
    .select()
    .from(workoutLogsTable)
    .where(gte(workoutLogsTable.completedAt, eightWeeksAgo))
    .orderBy(workoutLogsTable.completedAt);

  // Group by ISO week start (Monday)
  const weekMap = new Map<string, { workoutCount: number; totalMinutes: number; totalVolume: number }>();

  for (const log of logs) {
    const d = new Date(log.completedAt);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().split("T")[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { workoutCount: 0, totalMinutes: 0, totalVolume: 0 });
    }
    const entry = weekMap.get(weekKey)!;
    entry.workoutCount++;
    entry.totalMinutes += log.durationMinutes;
    entry.totalVolume += log.totalVolume ?? 0;
  }

  const result = Array.from(weekMap.entries()).map(([week, data]) => ({ week, ...data }));
  res.json(GetWeeklyProgressResponse.parse(result));
});

router.get("/progress/personal-records", async (_req, res): Promise<void> => {
  const sets = await db
    .select({
      exerciseId: workoutLogSetsTable.exerciseId,
      exerciseName: exercisesTable.name,
      muscleGroup: exercisesTable.muscleGroup,
      reps: workoutLogSetsTable.reps,
      weight: workoutLogSetsTable.weight,
      completedAt: workoutLogsTable.completedAt,
    })
    .from(workoutLogSetsTable)
    .innerJoin(exercisesTable, eq(workoutLogSetsTable.exerciseId, exercisesTable.id))
    .innerJoin(workoutLogsTable, eq(workoutLogSetsTable.logId, workoutLogsTable.id))
    .orderBy(desc(workoutLogsTable.completedAt));

  // Find best per exercise
  const prMap = new Map<number, { exerciseName: string; muscleGroup: string; maxWeight: number | null; maxReps: number; achievedAt: Date }>();

  for (const s of sets) {
    const existing = prMap.get(s.exerciseId);
    if (!existing) {
      prMap.set(s.exerciseId, {
        exerciseName: s.exerciseName,
        muscleGroup: s.muscleGroup,
        maxWeight: s.weight,
        maxReps: s.reps,
        achievedAt: s.completedAt,
      });
    } else {
      if ((s.weight ?? 0) > (existing.maxWeight ?? 0)) {
        existing.maxWeight = s.weight;
        existing.achievedAt = s.completedAt;
      }
      if (s.reps > existing.maxReps) {
        existing.maxReps = s.reps;
      }
    }
  }

  const records = Array.from(prMap.entries()).map(([exerciseId, data]) => ({
    exerciseId,
    ...data,
    achievedAt: data.achievedAt.toISOString(),
  }));

  res.json(GetPersonalRecordsResponse.parse(records));
});

export default router;
