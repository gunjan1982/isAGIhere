import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { submissionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const ADMIN_EMAIL = "gunjan1982@gmail.com";

const router: IRouter = Router();

// POST /api/submissions — public, no auth required
router.post("/submissions", async (req, res) => {
  const { type, name, url, description, submitterEmail } = req.body;

  if (!type || !name) {
    res.status(400).json({ error: "type and name required" });
    return;
  }
  if (!["person", "source", "community"].includes(type)) {
    res.status(400).json({ error: "type must be person, source, or community" });
    return;
  }
  if (name.trim().length < 2) {
    res.status(400).json({ error: "Name too short" });
    return;
  }

  try {
    const [submission] = await db
      .insert(submissionsTable)
      .values({
        type,
        name: name.trim(),
        url: url?.trim() || null,
        description: description?.trim() || null,
        submitterEmail: submitterEmail?.trim().toLowerCase() || null,
        status: "pending",
      })
      .returning();

    res.status(201).json({ ...submission, createdAt: submission.createdAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Failed to submit" });
  }
});

// GET /api/submissions — admin only
router.get("/submissions", async (req, res) => {
  const { createClerkClient } = await import("@clerk/express");
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (email !== ADMIN_EMAIL) { res.status(403).json({ error: "ACCESS_DENIED" }); return; }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const submissions = await db
      .select()
      .from(submissionsTable)
      .orderBy(desc(submissionsTable.createdAt));
    res.json(submissions.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// PATCH /api/submissions/:id — admin: approve or reject
router.patch("/submissions/:id", async (req, res) => {
  const { createClerkClient } = await import("@clerk/express");
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (email !== ADMIN_EMAIL) { res.status(403).json({ error: "ACCESS_DENIED" }); return; }
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status must be approved or rejected" });
    return;
  }

  try {
    const [updated] = await db
      .update(submissionsTable)
      .set({ status })
      .where(eq(submissionsTable.id, Number(req.params.id)))
      .returning();
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Failed to update submission" });
  }
});

export default router;
