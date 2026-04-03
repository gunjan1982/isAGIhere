import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userFollowsTable = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    entityType: text("entity_type").notNull(), // 'person' | 'source' | 'community'
    entityId: integer("entity_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.entityType, t.entityId)]
);

export const customSourcesTable = pgTable("custom_sources", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  platform: text("platform").notNull().default("website"), // 'website' | 'youtube' | 'reddit' | 'x' | 'other'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFollowSchema = createInsertSchema(userFollowsTable).omit({ id: true, createdAt: true });
export const insertCustomSourceSchema = createInsertSchema(customSourcesTable).omit({ id: true, createdAt: true });
export type UserFollow = typeof userFollowsTable.$inferSelect;
export type CustomSource = typeof customSourcesTable.$inferSelect;
export type InsertCustomSource = z.infer<typeof insertCustomSourceSchema>;
