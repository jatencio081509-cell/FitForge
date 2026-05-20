import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, exercisesTable } from "@workspace/db";
import {
  ListExercisesQueryParams,
  CreateExerciseBody,
  GetExerciseParams,
  GetExerciseResponse,
  ListExercisesResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/exercises", async (req, res): Promise<void> => {
  const query = ListExercisesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, muscle, search } = query.data;
  const conditions: SQL[] = [];

  if (category) conditions.push(eq(exercisesTable.category, category));
  if (muscle) conditions.push(eq(exercisesTable.muscleGroup, muscle));
  if (search) conditions.push(ilike(exercisesTable.name, `%${search}%`));

  const exercises = conditions.length > 0
    ? await db.select().from(exercisesTable).where(and(...conditions)).orderBy(exercisesTable.name)
    : await db.select().from(exercisesTable).orderBy(exercisesTable.name);

  res.json(ListExercisesResponse.parse(serializeDates(exercises)));
});

router.post("/exercises", async (req, res): Promise<void> => {
  const parsed = CreateExerciseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [exercise] = await db
    .insert(exercisesTable)
    .values({ ...parsed.data, isCustom: true })
    .returning();

  res.status(201).json(GetExerciseResponse.parse(serializeDates(exercise)));
});

router.get("/exercises/:id", async (req, res): Promise<void> => {
  const params = GetExerciseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [exercise] = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.id, params.data.id));

  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  res.json(GetExerciseResponse.parse(serializeDates(exercise)));
});

export default router;
