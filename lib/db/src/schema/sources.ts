import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sourcesTable = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  audience: text("audience"),
  frequency: text("frequency"),
  url: text("url"),
  subscriberCount: text("subscriber_count"),
  host: text("host"),
  bestFor: text("best_for"),
  isHighSignal: boolean("is_high_signal").default(false),
  youtubeChannelId: text("youtube_channel_id"),
  isInterviewChannel: boolean("is_interview_channel").default(false),
  featuredPeopleIds: text("featured_people_ids"),
});

export const insertSourceSchema = createInsertSchema(sourcesTable).omit({ id: true });
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sourcesTable.$inferSelect;
