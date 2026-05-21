import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const runLogsTable = pgTable("run_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  distanceKm: real("distance_km").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  avgPaceSecPerKm: integer("avg_pace_sec_per_km"),
  avgSpeedKmh: real("avg_speed_kmh"),
  calories: integer("calories"),
  notes: text("notes"),
  routePoints: jsonb("route_points").$type<{ lat: number; lng: number; ts: number }[]>(),
});

export type RunLog = typeof runLogsTable.$inferSelect;
export type InsertRunLog = typeof runLogsTable.$inferInsert;
