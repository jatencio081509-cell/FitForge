import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workoutLogsTable, workoutLogSetsTable, exercisesTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListWorkoutLogsQueryParams,
  ListWorkoutLogsResponse,
  CreateWorkoutLogBody,
  GetWorkoutLogParams,
  GetWorkoutLogResponse,
  DeleteWorkoutLogParams,
  ListWorkoutLogsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workout-logs", async (req, res): Promise<void> => {
  const query = ListWorkoutLogsQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 20;

  const logs = await db
    .select()
    .from(workoutLogsTable)
    .orderBy(workoutLogsTable.completedAt)
    .limit(limit);

  res.json(ListWorkoutLogsResponse.parse(serializeDates(logs)));
});

router.post("/workout-logs", async (req, res): Promise<void> => {
  const parsed = CreateWorkoutLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sets, ...logData } = parsed.data;

  // Calculate total volume
  let totalVolume = 0;
  if (sets && sets.length > 0) {
    totalVolume = sets.reduce((sum, s) => sum + (s.reps * (s.weight ?? 0)), 0);
  }

  const [log] = await db
    .insert(workoutLogsTable)
    .values({ ...logData, totalVolume })
    .returning();

  if (sets && sets.length > 0) {
    await db.insert(workoutLogSetsTable).values(
      sets.map((s) => ({
        logId: log.id,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight ?? null,
        notes: s.notes ?? null,
      }))
    );
  }

  res.status(201).json(ListWorkoutLogsResponseItem.parse(serializeDates(log)));
});

router.get("/workout-logs/:id", async (req, res): Promise<void> => {
  const params = GetWorkoutLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [log] = await db
    .select()
    .from(workoutLogsTable)
    .where(eq(workoutLogsTable.id, params.data.id));

  if (!log) {
    res.status(404).json({ error: "Workout log not found" });
    return;
  }

  const sets = await db
    .select({
      id: workoutLogSetsTable.id,
      exerciseId: workoutLogSetsTable.exerciseId,
      exerciseName: exercisesTable.name,
      setNumber: workoutLogSetsTable.setNumber,
      reps: workoutLogSetsTable.reps,
      weight: workoutLogSetsTable.weight,
      notes: workoutLogSetsTable.notes,
    })
    .from(workoutLogSetsTable)
    .innerJoin(exercisesTable, eq(workoutLogSetsTable.exerciseId, exercisesTable.id))
    .where(eq(workoutLogSetsTable.logId, log.id))
    .orderBy(workoutLogSetsTable.setNumber);

  res.json(GetWorkoutLogResponse.parse(serializeDates({ ...log, sets })));
});

router.delete("/workout-logs/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkoutLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [log] = await db
    .delete(workoutLogsTable)
    .where(eq(workoutLogsTable.id, params.data.id))
    .returning();

  if (!log) {
    res.status(404).json({ error: "Workout log not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
