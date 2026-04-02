import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { peopleTable } from "./people";

export const feedItemsTable = pgTable("feed_items", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => peopleTable.id),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  type: text("type").default("news"),
});

export const insertFeedItemSchema = createInsertSchema(feedItemsTable).omit({ id: true });
export type InsertFeedItem = z.infer<typeof insertFeedItemSchema>;
export type FeedItem = typeof feedItemsTable.$inferSelect;
