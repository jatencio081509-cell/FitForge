import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, userProfileTable, weightLogsTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  ListWeightLogsResponse,
  ListWeightLogsResponseItem,
  CreateWeightLogBody,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

async function getOrCreateProfile(userId: number) {
  const profiles = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.userId, userId))
    .limit(1);

  if (profiles.length > 0) return profiles[0];

  const [profile] = await db
    .insert(userProfileTable)
    .values({
      userId,
      name: "Athlete",
      fitnessGoal: "general_fitness",
      fitnessLevel: "beginner",
      weeklyWorkoutTarget: 3,
    })
    .returning();
  return profile;
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(req.userId!);
  res.json(GetProfileResponse.parse(serializeDates(profile)));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await getOrCreateProfile(req.userId!);

  const [updated] = await db
    .update(userProfileTable)
    .set(parsed.data)
    .where(eq(userProfileTable.id, profile.id))
    .returning();

  res.json(UpdateProfileResponse.parse(serializeDates(updated)));
});

router.get("/profile/weight-log", requireAuth, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(weightLogsTable)
    .where(eq(weightLogsTable.userId, req.userId!))
    .orderBy(desc(weightLogsTable.loggedAt))
    .limit(60);
  res.json(ListWeightLogsResponse.parse(serializeDates(logs)));
});

router.post("/profile/weight-log", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateWeightLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [log] = await db
    .insert(weightLogsTable)
    .values({
      userId: req.userId!,
      weight: parsed.data.weight,
      unit: parsed.data.unit ?? "kg",
      notes: parsed.data.notes,
    })
    .returning();

  res.status(201).json(ListWeightLogsResponseItem.parse(serializeDates(log)));
});

export default router;
