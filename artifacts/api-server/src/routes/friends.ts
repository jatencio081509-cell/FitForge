import { Router, type IRouter } from "express";
import { eq, and, or, ne, ilike } from "drizzle-orm";
import { db, friendshipsTable, usersTable, workoutLogsTable, runLogsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) { res.json([]); return; }
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(and(
      or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.email, `%${q}%`)),
      ne(usersTable.id, req.userId!)
    ))
    .limit(10);
  res.json(serializeDates(users));
});

router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(and(
      or(eq(friendshipsTable.userId, req.userId!), eq(friendshipsTable.friendId, req.userId!)),
      eq(friendshipsTable.status, "accepted")
    ));

  const friendIds = rows.map(r => r.userId === req.userId ? r.friendId : r.userId);
  if (friendIds.length === 0) { res.json([]); return; }

  const friends = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(or(...friendIds.map(id => eq(usersTable.id, id))));

  const withMeta = rows.map(r => {
    const fid = r.userId === req.userId ? r.friendId : r.userId;
    const u = friends.find(f => f.id === fid);
    return { friendshipId: r.id, status: r.status, createdAt: r.createdAt, ...u };
  });

  res.json(serializeDates(withMeta));
});

router.get("/friends/requests", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.friendId, req.userId!), eq(friendshipsTable.status, "pending")));

  if (rows.length === 0) { res.json([]); return; }

  const senderIds = rows.map(r => r.userId);
  const senders = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(or(...senderIds.map(id => eq(usersTable.id, id))));

  const result = rows.map(r => ({
    friendshipId: r.id,
    createdAt: r.createdAt,
    ...senders.find(s => s.id === r.userId),
  }));

  res.json(serializeDates(result));
});

router.get("/friends/sent", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(and(eq(friendshipsTable.userId, req.userId!), eq(friendshipsTable.status, "pending")));

  if (rows.length === 0) { res.json([]); return; }

  const recipientIds = rows.map(r => r.friendId);
  const recipients = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(or(...recipientIds.map(id => eq(usersTable.id, id))));

  res.json(serializeDates(rows.map(r => ({
    friendshipId: r.id,
    ...recipients.find(u => u.id === r.friendId),
  }))));
});

router.post("/friends", requireAuth, async (req, res): Promise<void> => {
  const friendId = Number(req.body.friendId);
  if (isNaN(friendId) || friendId === req.userId) {
    res.status(400).json({ error: "Invalid friendId" }); return;
  }
  const existing = await db
    .select()
    .from(friendshipsTable)
    .where(or(
      and(eq(friendshipsTable.userId, req.userId!), eq(friendshipsTable.friendId, friendId)),
      and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, req.userId!))
    ));
  if (existing.length > 0) {
    res.status(409).json({ error: "Already connected or request pending" }); return;
  }
  const [row] = await db.insert(friendshipsTable).values({ userId: req.userId!, friendId, status: "pending" }).returning();
  res.status(201).json(serializeDates(row));
});

router.put("/friends/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [updated] = await db
    .update(friendshipsTable)
    .set({ status: "accepted" })
    .where(and(eq(friendshipsTable.id, id), eq(friendshipsTable.friendId, req.userId!)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Request not found" }); return; }
  res.json(serializeDates(updated));
});

router.delete("/friends/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(friendshipsTable).where(and(
    eq(friendshipsTable.id, id),
    or(eq(friendshipsTable.userId, req.userId!), eq(friendshipsTable.friendId, req.userId!))
  ));
  res.status(204).send();
});

router.get("/friends/:friendId/progress", requireAuth, async (req, res): Promise<void> => {
  const friendId = Number(req.params.friendId);

  const isFriend = await db
    .select()
    .from(friendshipsTable)
    .where(and(
      or(
        and(eq(friendshipsTable.userId, req.userId!), eq(friendshipsTable.friendId, friendId)),
        and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, req.userId!))
      ),
      eq(friendshipsTable.status, "accepted")
    ));

  if (isFriend.length === 0) { res.status(403).json({ error: "Not friends" }); return; }

  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, friendId));

  const workoutLogs = await db
    .select()
    .from(workoutLogsTable)
    .where(eq(workoutLogsTable.userId, friendId))
    .orderBy(workoutLogsTable.completedAt)
    .limit(20);

  const runLogs = await db
    .select()
    .from(runLogsTable)
    .where(eq(runLogsTable.userId, friendId))
    .orderBy(runLogsTable.startedAt)
    .limit(20);

  res.json(serializeDates({
    user,
    totalWorkouts: workoutLogs.length,
    totalRuns: runLogs.length,
    recentWorkouts: workoutLogs.slice(-5),
    recentRuns: runLogs.slice(-5),
    totalDistanceKm: runLogs.reduce((s, r) => s + r.distanceKm, 0),
    totalVolume: workoutLogs.reduce((s, w) => s + (w.totalVolume ?? 0), 0),
  }));
});

export default router;
