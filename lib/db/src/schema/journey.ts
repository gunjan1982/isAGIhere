import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiJourneyProfilesTable = pgTable("ai_journey_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name"),
  currentRole: text("current_role"),
  aiExperienceLevel: text("ai_experience_level"),
  currentlyWorkingOn: text("currently_working_on"),
  primaryUseCase: text("primary_use_case"),
  bio: text("bio"),
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiToolUsageTable = pgTable("ai_tool_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  toolName: text("tool_name").notNull(),
  toolCategory: text("tool_category"),
  useCase: text("use_case"),
  frequency: text("frequency"),
  rating: integer("rating"),
  notes: text("notes"),
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frontierModelReviewsTable = pgTable("frontier_model_reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  modelName: text("model_name").notNull(),
  modelVersion: text("model_version"),
  primaryUseCase: text("primary_use_case"),
  usagePeriodStart: text("usage_period_start"),
  usagePeriodEnd: text("usage_period_end"),
  lastUsedAt: timestamp("last_used_at"),
  overallRating: integer("overall_rating"),
  reasoningRating: integer("reasoning_rating"),
  codingRating: integer("coding_rating"),
  creativeRating: integer("creative_rating"),
  speedRating: integer("speed_rating"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  review: text("review"),
  wouldRecommend: boolean("would_recommend"),
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiJourneyProfileSchema = createInsertSchema(aiJourneyProfilesTable).omit({ id: true });
export type InsertAiJourneyProfile = z.infer<typeof insertAiJourneyProfileSchema>;
export type AiJourneyProfile = typeof aiJourneyProfilesTable.$inferSelect;

export const insertAiToolUsageSchema = createInsertSchema(aiToolUsageTable).omit({ id: true });
export type InsertAiToolUsage = z.infer<typeof insertAiToolUsageSchema>;
export type AiToolUsage = typeof aiToolUsageTable.$inferSelect;

export const insertFrontierModelReviewSchema = createInsertSchema(frontierModelReviewsTable).omit({ id: true });
export type InsertFrontierModelReview = z.infer<typeof insertFrontierModelReviewSchema>;
export type FrontierModelReview = typeof frontierModelReviewsTable.$inferSelect;
