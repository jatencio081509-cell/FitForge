import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, runLogsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/run-logs", requireAuth, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(runLogsTable)
    .where(eq(runLogsTable.userId, req.userId!))
    .orderBy(desc(runLogsTable.startedAt))
    .limit(100);
  res.json(serializeDates(logs));
});

router.post("/run-logs", requireAuth, async (req, res): Promise<void> => {
  const { distanceKm, durationSeconds, avgPaceSecPerKm, avgSpeedKmh, calories, notes, routePoints, startedAt, completedAt } = req.body;
  if (distanceKm === undefined || durationSeconds === undefined) {
    res.status(400).json({ error: "distanceKm and durationSeconds are required" });
    return;
  }
  const [log] = await db
    .insert(runLogsTable)
    .values({
      userId: req.userId!,
      distanceKm: Number(distanceKm),
      durationSeconds: Number(durationSeconds),
      avgPaceSecPerKm: avgPaceSecPerKm ? Number(avgPaceSecPerKm) : null,
      avgSpeedKmh: avgSpeedKmh ? Number(avgSpeedKmh) : null,
      calories: calories ? Number(calories) : null,
      notes: notes ?? null,
      routePoints: routePoints ?? null,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    })
    .returning();
  res.status(201).json(serializeDates(log));
});

router.delete("/run-logs/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(runLogsTable).where(and(eq(runLogsTable.id, id), eq(runLogsTable.userId, req.userId!)));
  res.status(204).send();
});

export default router;
