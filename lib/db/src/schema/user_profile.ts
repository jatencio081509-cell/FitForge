import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfileTable = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Athlete"),
  age: integer("age"),
  weight: real("weight"),
  height: real("height"),
  weightGoal: real("weight_goal"),
  weightUnit: text("weight_unit").notNull().default("kg"),
  fitnessGoal: text("fitness_goal").notNull().default("general_fitness"),
  fitnessLevel: text("fitness_level").notNull().default("beginner"),
  weeklyWorkoutTarget: integer("weekly_workout_target").notNull().default(3),
  preferredEquipment: text("preferred_equipment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({ id: true, createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
