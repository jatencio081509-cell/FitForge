import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weightLogsTable = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  weight: real("weight").notNull(),
  unit: text("unit").notNull().default("kg"),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWeightLogSchema = createInsertSchema(weightLogsTable).omit({ id: true, loggedAt: true });
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type WeightLog = typeof weightLogsTable.$inferSelect;
