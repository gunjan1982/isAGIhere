import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const peopleTable = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  organization: text("organization"),
  category: text("category").notNull(),
  bio: text("bio"),
  stance: text("stance"),
  twitterHandle: text("twitter_handle"),
  twitterFollowers: text("twitter_followers"),
  primaryPlatform: text("primary_platform"),
  bestFor: text("best_for"),
  imageUrl: text("image_url"),
  isSpotlight: boolean("is_spotlight").default(false),
});

export const insertPersonSchema = createInsertSchema(peopleTable).omit({ id: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof peopleTable.$inferSelect;
