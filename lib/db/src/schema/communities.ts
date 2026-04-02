import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communitiesTable = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  memberCount: text("member_count"),
  description: text("description"),
  url: text("url"),
  bestFor: text("best_for"),
});

export const insertCommunitySchema = createInsertSchema(communitiesTable).omit({ id: true });
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communitiesTable.$inferSelect;
