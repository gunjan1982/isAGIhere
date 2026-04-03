import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    country: text("country"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_page_views_path").on(t.path),
    index("idx_page_views_created_at").on(t.createdAt),
    index("idx_page_views_session").on(t.sessionId),
  ]
);

export type PageView = typeof pageViewsTable.$inferSelect;
