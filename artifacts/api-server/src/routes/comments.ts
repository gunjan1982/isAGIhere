import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/comments?entity_type=person&entity_id=1
router.get("/comments", async (req, res) => {
  const { entity_type, entity_id } = req.query;
  if (!entity_type || !entity_id) {
    res.status(400).json({ error: "entity_type and entity_id required" });
    return;
  }
  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.entityType, entity_type as string),
          eq(commentsTable.entityId, Number(entity_id))
        )
      )
      .orderBy(asc(commentsTable.createdAt));

    res.json(comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments — no auth required
router.post("/comments", async (req, res) => {
  const { entityType, entityId, authorName, authorEmail, content, parentId } = req.body;

  if (!entityType || !entityId || !authorName || !authorEmail || !content) {
    res.status(400).json({ error: "entityType, entityId, authorName, authorEmail, content required" });
    return;
  }
  if (!["person", "feed_item"].includes(entityType)) {
    res.status(400).json({ error: "entityType must be person or feed_item" });
    return;
  }
  if (content.trim().length < 3 || content.length > 2000) {
    res.status(400).json({ error: "Content must be 3–2000 characters" });
    return;
  }
  if (!authorEmail.includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }

  try {
    const [comment] = await db
      .insert(commentsTable)
      .values({
        entityType,
        entityId: Number(entityId),
        authorName: authorName.trim().slice(0, 100),
        authorEmail: authorEmail.trim().toLowerCase(),
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null,
      })
      .returning();

    res.status(201).json({ ...comment, createdAt: comment.createdAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;
