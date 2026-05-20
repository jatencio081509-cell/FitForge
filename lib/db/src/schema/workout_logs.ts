import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workoutsTable } from "./workouts";
import { exercisesTable } from "./exercises";

export const workoutLogsTable = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workoutsTable.id, { onDelete: "set null" }),
  workoutName: text("workout_name").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  totalVolume: real("total_volume"),
  notes: text("notes"),
  rating: integer("rating"),
});

export const workoutLogSetsTable = pgTable("workout_log_sets", {
  id: serial("id").primaryKey(),
  logId: integer("log_id").notNull().references(() => workoutLogsTable.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id),
  setNumber: integer("set_number").notNull().default(1),
  reps: integer("reps").notNull().default(0),
  weight: real("weight"),
  notes: text("notes"),
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogsTable).omit({ id: true });
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogsTable.$inferSelect;

export const insertWorkoutLogSetSchema = createInsertSchema(workoutLogSetsTable).omit({ id: true });
export type InsertWorkoutLogSet = z.infer<typeof insertWorkoutLogSetSchema>;
export type WorkoutLogSet = typeof workoutLogSetsTable.$inferSelect;
