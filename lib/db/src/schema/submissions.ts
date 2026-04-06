import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'person' | 'source' | 'community'
  name: text("name").notNull(),
  url: text("url"),
  description: text("description"),
  submitterEmail: text("submitter_email"),
  status: text("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Submission = typeof submissionsTable.$inferSelect;
export type InsertSubmission = typeof submissionsTable.$inferInsert;
