import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, workoutsTable, workoutExercisesTable, exercisesTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import {
  ListWorkoutsResponse,
  ListWorkoutsResponseItem,
  CreateWorkoutBody,
  GetWorkoutParams,
  GetWorkoutResponse,
  UpdateWorkoutParams,
  UpdateWorkoutBody,
  UpdateWorkoutResponse,
  DeleteWorkoutParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workouts", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(workoutsTable)
    .where(sql`(${workoutsTable.userId} IS NULL OR ${workoutsTable.userId} = ${req.userId!})`)
    .orderBy(workoutsTable.createdAt);

  const withCounts = await Promise.all(rows.map(async (w) => {
    const exerciseRows = await db
      .select({ id: workoutExercisesTable.id })
      .from(workoutExercisesTable)
      .where(eq(workoutExercisesTable.workoutId, w.id));
    return { ...w, exerciseCount: exerciseRows.length };
  }));

  res.json(ListWorkoutsResponse.parse(serializeDates(withCounts)));
});

router.post("/workouts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateWorkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { exercises: exerciseInputs, ...workoutData } = parsed.data;

  const [workout] = await db
    .insert(workoutsTable)
    .values({ ...workoutData, userId: req.userId! })
    .returning();

  if (exerciseInputs && exerciseInputs.length > 0) {
    await db.insert(workoutExercisesTable).values(
      exerciseInputs.map((e, i) => ({
        workoutId: workout.id,
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight ?? null,
        restSeconds: e.restSeconds ?? 60,
        notes: e.notes ?? null,
        orderIndex: e.orderIndex ?? i,
      }))
    );
  }

  const exerciseCount = exerciseInputs?.length ?? 0;
  res.status(201).json(ListWorkoutsResponseItem.parse(serializeDates({ ...workout, exerciseCount })));
});

router.get("/workouts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workout] = await db
    .select()
    .from(workoutsTable)
    .where(and(
      eq(workoutsTable.id, params.data.id),
      sql`(${workoutsTable.userId} IS NULL OR ${workoutsTable.userId} = ${req.userId!})`
    ));

  if (!workout) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }

  const exerciseRows = await db
    .select({
      id: workoutExercisesTable.id,
      exerciseId: workoutExercisesTable.exerciseId,
      exerciseName: exercisesTable.name,
      muscleGroup: exercisesTable.muscleGroup,
      equipment: exercisesTable.equipment,
      sets: workoutExercisesTable.sets,
      reps: workoutExercisesTable.reps,
      weight: workoutExercisesTable.weight,
      restSeconds: workoutExercisesTable.restSeconds,
      notes: workoutExercisesTable.notes,
      orderIndex: workoutExercisesTable.orderIndex,
    })
    .from(workoutExercisesTable)
    .innerJoin(exercisesTable, eq(workoutExercisesTable.exerciseId, exercisesTable.id))
    .where(eq(workoutExercisesTable.workoutId, workout.id))
    .orderBy(workoutExercisesTable.orderIndex);

  res.json(GetWorkoutResponse.parse(serializeDates({ ...workout, exercises: exerciseRows })));
});

router.patch("/workouts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workout] = await db
    .update(workoutsTable)
    .set(parsed.data)
    .where(and(eq(workoutsTable.id, params.data.id), eq(workoutsTable.userId, req.userId!)))
    .returning();

  if (!workout) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }

  const exerciseRows = await db
    .select({ id: workoutExercisesTable.id })
    .from(workoutExercisesTable)
    .where(eq(workoutExercisesTable.workoutId, workout.id));

  res.json(UpdateWorkoutResponse.parse(serializeDates({ ...workout, exerciseCount: exerciseRows.length })));
});

router.delete("/workouts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workout] = await db
    .delete(workoutsTable)
    .where(and(eq(workoutsTable.id, params.data.id), eq(workoutsTable.userId, req.userId!)))
    .returning();

  if (!workout) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
