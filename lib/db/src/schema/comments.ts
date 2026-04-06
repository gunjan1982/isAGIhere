import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'person' | 'feed_item'
  entityId: integer("entity_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"), // null = top-level, number = reply
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
