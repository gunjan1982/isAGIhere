import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pageViewsTable } from "@workspace/db/schema";
import { desc, gte, sql, count } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

// POST /api/analytics/pageview — record a page view (public, no auth needed)
router.post("/analytics/pageview", async (req, res) => {
  try {
    const { path, referrer, sessionId } = req.body;
    if (!path || typeof path !== "string") {
      res.status(400).json({ error: "path required" });
      return;
    }
    await db.insert(pageViewsTable).values({
      path: path.substring(0, 255),
      referrer: referrer ? String(referrer).substring(0, 500) : null,
      sessionId: sessionId ? String(sessionId).substring(0, 64) : null,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to record" });
  }
});

// GET /api/analytics/stats — summary stats (auth required)
router.get("/analytics/stats", async (req, res) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOf7Days = new Date(now.getTime() - 7 * 86400000);
    const startOf30Days = new Date(now.getTime() - 30 * 86400000);

    const [totalRows, todayRows, week7Rows, month30Rows, topPagesRows, dailyRows] = await Promise.all([
      // All time total
      db.select({ count: count() }).from(pageViewsTable),

      // Today
      db.select({ count: count() }).from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, startOfToday)),

      // Last 7 days
      db.select({ count: count() }).from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, startOf7Days)),

      // Last 30 days
      db.select({ count: count() }).from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, startOf30Days)),

      // Top pages (last 30 days)
      db.select({
        path: pageViewsTable.path,
        views: count(),
      })
        .from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, startOf30Days))
        .groupBy(pageViewsTable.path)
        .orderBy(desc(count()))
        .limit(10),

      // Daily views (last 30 days) — one row per day
      db.execute(sql`
        SELECT
          DATE(created_at) AS day,
          COUNT(*) AS views,
          COUNT(DISTINCT session_id) AS sessions
        FROM page_views
        WHERE created_at >= ${startOf30Days}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),
    ]);

    res.json({
      total: totalRows[0]?.count ?? 0,
      today: todayRows[0]?.count ?? 0,
      last7Days: week7Rows[0]?.count ?? 0,
      last30Days: month30Rows[0]?.count ?? 0,
      topPages: topPagesRows,
      daily: dailyRows.rows,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/analytics/heatmap — public, daily counts for the last 30 days
router.get("/analytics/heatmap", async (_req, res) => {
  try {
    const start = new Date(Date.now() - 30 * 86400000);
    const result = await db.execute(sql`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS views
      FROM page_views
      WHERE created_at >= ${start}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
    res.json({ days: result.rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch heatmap" });
  }
});

export default router;
