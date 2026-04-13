import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { peopleTable } from "./people";

export const interviewsTable = pgTable("interviews", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => peopleTable.id),

  // YouTube identifiers
  videoId: text("video_id").notNull().unique(),   // YouTube video ID (e.g. "dQw4w9WgXcQ")
  channelId: text("channel_id").notNull(),         // Original uploader's YouTube channel ID
  channelName: text("channel_name").notNull(),     // Display name of the uploading channel

  // Content
  title: text("title").notNull(),
  url: text("url").notNull(),                      // Full https://youtube.com/watch?v=... URL
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),               // Raw YouTube description (first 2000 chars)
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  durationSeconds: integer("duration_seconds"),
  viewCount: integer("view_count"),

  // AI-generated intelligence (populated by background job)
  aiSummary: text("ai_summary"),                  // 2-3 sentence summary
  keyTakeaways: text("key_takeaways"),             // JSON array of strings: up to 5 bullet points
  topics: text("topics"),                          // JSON array: e.g. ["AGI timeline", "new model", "safety"]
  summaryGeneratedAt: timestamp("summary_generated_at"),

  // Transcript
  transcriptText: text("transcript_text"),         // Full transcript if available
  transcriptFetchedAt: timestamp("transcript_fetched_at"),

  // Quality flags
  isOriginalSource: boolean("is_original_source").default(true),
  isVerified: boolean("is_verified").default(false), // Admin manually confirmed
});

export const insertInterviewSchema = createInsertSchema(interviewsTable).omit({ id: true });
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviewsTable.$inferSelect;
