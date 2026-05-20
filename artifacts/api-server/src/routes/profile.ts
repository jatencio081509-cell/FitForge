import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfileTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateProfile() {
  const profiles = await db.select().from(userProfileTable).limit(1);
  if (profiles.length > 0) return profiles[0];

  const [profile] = await db
    .insert(userProfileTable)
    .values({
      name: "Athlete",
      fitnessGoal: "general_fitness",
      fitnessLevel: "beginner",
      weeklyWorkoutTarget: 3,
    })
    .returning();
  return profile;
}

router.get("/profile", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await getOrCreateProfile();

  const [updated] = await db
    .update(userProfileTable)
    .set(parsed.data)
    .where(eq(userProfileTable.id, profile.id))
    .returning();

  res.json(UpdateProfileResponse.parse(updated));
});

export default router;
