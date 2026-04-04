import { Router, type IRouter } from "express";
import { createClerkClient, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { pageViewsTable } from "@workspace/db/schema";
import { gte, sql, count, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any): string | null {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return null;
  }
  return auth.userId;
}

function clerk() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

// GET /api/admin/overview — combined user + traffic summary
router.get("/admin/overview", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const start7  = new Date(now.getTime() - 7  * 86400000);
    const start30 = new Date(now.getTime() - 30 * 86400000);

    const [usersRes, todayViews, week7Views, month30Views, totalViews] = await Promise.all([
      clerk().users.getUserList({ limit: 500, orderBy: "-created_at" }),
      db.select({ count: count() }).from(pageViewsTable).where(gte(pageViewsTable.createdAt, startOfToday)),
      db.select({ count: count() }).from(pageViewsTable).where(gte(pageViewsTable.createdAt, start7)),
      db.select({ count: count() }).from(pageViewsTable).where(gte(pageViewsTable.createdAt, start30)),
      db.select({ count: count() }).from(pageViewsTable),
    ]);

    const users = usersRes.data;
    const newLast7  = users.filter(u => u.createdAt > start7.getTime()).length;
    const newLast30 = users.filter(u => u.createdAt > start30.getTime()).length;

    res.json({
      totalUsers:    users.length,
      newLast7Days:  newLast7,
      newLast30Days: newLast30,
      viewsToday:    todayViews[0]?.count ?? 0,
      viewsLast7:    week7Views[0]?.count ?? 0,
      viewsLast30:   month30Views[0]?.count ?? 0,
      viewsTotal:    totalViews[0]?.count ?? 0,
    });
  } catch (e) {
    console.error("admin/overview error", e);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// GET /api/admin/users — paginated user list from Clerk
router.get("/admin/users", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const limit  = Math.min(Number(req.query.limit  ?? 50), 200);
    const offset = Number(req.query.offset ?? 0);

    const result = await clerk().users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });

    const users = result.data.map(u => ({
      id:          u.id,
      email:       u.emailAddresses?.[0]?.emailAddress ?? null,
      firstName:   u.firstName,
      lastName:    u.lastName,
      imageUrl:    u.imageUrl,
      username:    u.username,
      createdAt:   u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));

    res.json({ users, total: result.totalCount });
  } catch (e) {
    console.error("admin/users error", e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/admin/pages — top pages all time + last 7d
router.get("/admin/pages", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const start7 = new Date(Date.now() - 7 * 86400000);

    const [allTime, last7, daily] = await Promise.all([
      db.select({ path: pageViewsTable.path, views: count() })
        .from(pageViewsTable)
        .groupBy(pageViewsTable.path)
        .orderBy(desc(count()))
        .limit(15),

      db.select({ path: pageViewsTable.path, views: count() })
        .from(pageViewsTable)
        .where(gte(pageViewsTable.createdAt, start7))
        .groupBy(pageViewsTable.path)
        .orderBy(desc(count()))
        .limit(15),

      db.execute(sql`
        SELECT DATE(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
        FROM page_views
        WHERE created_at >= ${new Date(Date.now() - 30 * 86400000)}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),
    ]);

    res.json({ allTime, last7, daily: daily.rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

export default router;
