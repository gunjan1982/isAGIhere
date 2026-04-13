# AGI v2.0 — Feature Implementation Plan
## isagihere.wiki · Copilot Implementation Guide

> **For VS Code Copilot:** This document is the authoritative spec for three new features on the isagihere.wiki platform. Read each section fully before generating code. All file paths are relative to the repo root. The stack is: pnpm monorepo, React 18 + Vite + Tailwind + shadcn/Radix UI (frontend at `artifacts/ai-hub/`), Express 5 + Drizzle ORM + PostgreSQL (backend at `artifacts/api-server/`), shared libs at `lib/db/`, `lib/api-zod/`, `lib/api-spec/`, `lib/api-client-react/`. Auth is Clerk. Always use `pnpm`, never `npm` or `yarn`.

---

## Table of Contents

1. [Feature 1 — YouTube Interview Monitor](#feature-1--youtube-interview-monitor)
2. [Feature 2 — AI YouTube Channels Directory](#feature-2--ai-youtube-channels-directory)
3. [Feature 3 — MY AI Journey](#feature-3--my-ai-journey)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
5. [Implementation Order](#implementation-order)

---

## Feature 1 — YouTube Interview Monitor

### Goal
Track and surface YouTube interviews published by the key AI figures already listed in the People directory (Godfathers, Lab CEOs, Hardware, Builders, Vibe Coders). Show only **original-source uploads** (i.e., the person's own channel or the interviewer's original channel — not reposts). For each interview, store a link, AI-generated key takeaways focused on AI advancement / AGI / new model announcements / new capabilities, and optionally the video transcript.

Surface these interviews on:
- Each **Person detail page** (`/people/:id`) in a new "Interviews" tab
- The **Home page** (`/`) in a new "Latest Interviews" spotlight section
- A new **dedicated page** at `/interviews` with filters by person and topic

---

### 1A. Database Schema

**File to create:** `lib/db/src/schema/interviews.ts`

```typescript
import { pgTable, serial, text, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";
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
```

**File to modify:** `lib/db/src/schema/people.ts`

Add two new columns to `peopleTable`:

```typescript
// Add inside the pgTable("people", { ... }) object:
youtubeChannelId: text("youtube_channel_id"),   // The person's OWN YouTube channel ID (for RSS)
youtubeHandle: text("youtube_handle"),           // e.g. "@SamAltman" (for display)
```

**File to modify:** `lib/db/src/schema/index.ts`

Add the export:
```typescript
export * from "./interviews";
```

**Run migration** after schema changes:
```bash
pnpm --filter @workspace/db run generate   # generates Drizzle migration SQL
pnpm --filter @workspace/db run migrate    # applies to DB
```

---

### 1B. YouTube Feed Fetcher (Backend Service)

**File to create:** `artifacts/api-server/src/lib/youtube-fetcher.ts`

This service uses **YouTube's public RSS feed** (no API key required) to discover new videos from each person's own channel. For channels where we want to pick up interviews posted by interviewers (e.g. Lex Fridman posting a Sam Altman interview), we also subscribe to those interviewer channels — see Feature 2 for that cross-link.

```typescript
import Parser from "rss-parser";
import { db } from "@workspace/db";
import { interviewsTable, peopleTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({ timeout: 10000 });

// YouTube channel RSS URL helper (no API key needed)
const YT_CHANNEL_RSS = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

// Extract videoId from YouTube URL or yt:videoId element
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

// Keywords that indicate an interview/conversation (not a standalone lecture or demo)
const INTERVIEW_KEYWORDS = [
  "interview", "conversation with", "talks with", "speaks with",
  "on ai", "on agi", "podcast", "fireside", "chat with", "sits down",
  "q&a", "discusses", "future of ai", "artificial general intelligence",
  "new model", "capabilities", "safety", "alignment",
];

function isInterviewLike(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  return INTERVIEW_KEYWORDS.some((kw) => text.includes(kw));
}

export async function fetchPersonInterviews(): Promise<number> {
  // Get all people who have a YouTube channel ID set
  const people = await db
    .select({ id: peopleTable.id, name: peopleTable.name, youtubeChannelId: peopleTable.youtubeChannelId })
    .from(peopleTable)
    .where(isNotNull(peopleTable.youtubeChannelId));

  let inserted = 0;

  const results = await Promise.allSettled(
    people.map(async (person) => {
      const rssUrl = YT_CHANNEL_RSS(person.youtubeChannelId!);
      let items: Parser.Item[];
      try {
        const feed = await parser.parseURL(rssUrl);
        items = feed.items ?? [];
      } catch (err) {
        logger.warn({ rssUrl, name: person.name, err }, "Failed to fetch YouTube RSS");
        return;
      }

      for (const item of items.slice(0, 15)) {
        const videoUrl = item.link ?? "";
        const videoId = extractVideoId(videoUrl);
        if (!videoId) continue;

        const title = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? "";
        if (!isInterviewLike(title, description)) continue;

        // Parse thumbnail from <media:group> or construct from videoId
        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        try {
          await db
            .insert(interviewsTable)
            .values({
              personId: person.id,
              videoId,
              channelId: person.youtubeChannelId!,
              channelName: person.name,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl,
              description: description.slice(0, 2000),
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              isOriginalSource: true,
            })
            .onConflictDoNothing({ target: interviewsTable.videoId });
          inserted++;
        } catch (err) {
          logger.error({ videoId, err }, "Failed to insert interview");
        }
      }
    })
  );

  logger.info({ inserted }, "YouTube interview fetch complete");
  return inserted;
}

// State for scheduler
let lastFetchedAt: Date | null = null;
let fetchTimer: ReturnType<typeof setInterval> | null = null;

export function startInterviewScheduler(intervalMs = 60 * 60 * 1000) { // every 1 hour
  if (fetchTimer) return;
  fetchPersonInterviews().then(() => { lastFetchedAt = new Date(); });
  fetchTimer = setInterval(async () => {
    await fetchPersonInterviews();
    lastFetchedAt = new Date();
  }, intervalMs);
}

export function getInterviewLastFetchedAt() { return lastFetchedAt; }
```

**File to modify:** `artifacts/api-server/src/app.ts` (or `index.ts` — wherever `startInterviewScheduler` should be called at startup)

Add:
```typescript
import { startInterviewScheduler } from "./lib/youtube-fetcher";
// ... after existing scheduler starts:
startInterviewScheduler();
```

---

### 1C. AI Summary Generator (Backend Service)

**File to create:** `artifacts/api-server/src/lib/interview-summarizer.ts`

Uses the Anthropic SDK (already a dependency via Replit environment) to generate takeaways for unsummarized interviews. Runs as a low-priority background job after the fetch job.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@workspace/db";
import { interviewsTable } from "@workspace/db/schema";
import { isNull, isNotNull, and } from "drizzle-orm";
import { logger } from "./logger";

const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

const SUMMARY_PROMPT = (title: string, description: string) => `
You are an AI analyst for isagihere.wiki, a platform tracking AI industry progress.

Analyze this YouTube video about AI and generate structured intelligence for our readers.

VIDEO TITLE: ${title}
DESCRIPTION: ${description}

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "2-3 sentence summary focused on what AI-relevant things were discussed.",
  "keyTakeaways": [
    "Takeaway 1 about AGI, new models, safety, or AI capabilities",
    "Takeaway 2",
    "Takeaway 3"
  ],
  "topics": ["AGI timeline", "new model", "safety", "capabilities", "investment", "regulation"]
}

Rules:
- summary: max 280 characters, present tense
- keyTakeaways: 3-5 items, each max 120 characters, start with a verb
- topics: pick ONLY from: ["AGI timeline", "new model", "capabilities", "safety", "alignment", "investment", "regulation", "benchmark", "open source", "reasoning", "agents", "multimodal"]
- If the description is too short to analyze, return null for all fields
`;

export async function generateMissingSummaries(batchSize = 5): Promise<number> {
  const pending = await db
    .select()
    .from(interviewsTable)
    .where(and(isNull(interviewsTable.aiSummary), isNotNull(interviewsTable.description)))
    .limit(batchSize);

  let processed = 0;
  for (const interview of pending) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: SUMMARY_PROMPT(interview.title, interview.description ?? ""),
        }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : null;
      if (!text) continue;

      const parsed = JSON.parse(text);
      if (!parsed?.summary) continue;

      await db
        .update(interviewsTable)
        .set({
          aiSummary: parsed.summary,
          keyTakeaways: JSON.stringify(parsed.keyTakeaways ?? []),
          topics: JSON.stringify(parsed.topics ?? []),
          summaryGeneratedAt: new Date(),
        })
        .where(eq(interviewsTable.id, interview.id));

      processed++;
    } catch (err) {
      logger.warn({ interviewId: interview.id, err }, "Failed to generate summary");
    }
  }

  return processed;
}
```

> **Note on transcripts:** For transcript fetching, install the `youtube-transcript` npm package (`pnpm add youtube-transcript --filter @workspace/api-server`). Create a separate `transcript-fetcher.ts` service that calls `YoutubeTranscript.fetchTranscript(videoId)` and stores the joined text in `interviewsTable.transcriptText`. Run this as an even lower-priority background job (e.g. once per 6 hours, max 10 transcripts per run) to avoid rate limiting.

---

### 1D. API Routes

**File to create:** `artifacts/api-server/src/routes/interviews.ts`

```typescript
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { interviewsTable, peopleTable } from "@workspace/db/schema";
import { eq, desc, count, and, isNotNull, ilike, or, SQL } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/interviews — paginated list, filterable by personId and topic
router.get("/interviews", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const personId = req.query.personId ? Number(req.query.personId) : undefined;
  const topic = req.query.topic as string | undefined;

  let where: SQL | undefined;
  const conditions: SQL[] = [];
  if (personId) conditions.push(eq(interviewsTable.personId, personId));
  if (topic) conditions.push(ilike(interviewsTable.topics, `%${topic}%`));
  if (conditions.length === 1) where = conditions[0];
  else if (conditions.length > 1) where = and(...conditions);

  const [items, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: interviewsTable.id,
        personId: interviewsTable.personId,
        personName: peopleTable.name,
        personCategory: peopleTable.category,
        personImageUrl: peopleTable.imageUrl,
        videoId: interviewsTable.videoId,
        channelName: interviewsTable.channelName,
        title: interviewsTable.title,
        url: interviewsTable.url,
        thumbnailUrl: interviewsTable.thumbnailUrl,
        publishedAt: interviewsTable.publishedAt,
        durationSeconds: interviewsTable.durationSeconds,
        viewCount: interviewsTable.viewCount,
        aiSummary: interviewsTable.aiSummary,
        keyTakeaways: interviewsTable.keyTakeaways,
        topics: interviewsTable.topics,
        hasTranscript: isNotNull(interviewsTable.transcriptText),
      })
      .from(interviewsTable)
      .leftJoin(peopleTable, eq(interviewsTable.personId, peopleTable.id))
      .where(where)
      .orderBy(desc(interviewsTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(interviewsTable).where(where),
  ]);

  res.json({
    items: items.map((i) => ({
      ...i,
      publishedAt: i.publishedAt?.toISOString() ?? null,
      keyTakeaways: i.keyTakeaways ? JSON.parse(i.keyTakeaways) : [],
      topics: i.topics ? JSON.parse(i.topics) : [],
    })),
    total: Number(total),
    hasMore: offset + limit < Number(total),
  });
});

// GET /api/people/:id/interviews — interviews for a specific person
router.get("/people/:id/interviews", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const limit = Math.min(Number(req.query.limit) || 10, 30);

  const items = await db
    .select()
    .from(interviewsTable)
    .where(eq(interviewsTable.personId, id))
    .orderBy(desc(interviewsTable.publishedAt))
    .limit(limit);

  res.json(items.map((i) => ({
    ...i,
    publishedAt: i.publishedAt?.toISOString() ?? null,
    keyTakeaways: i.keyTakeaways ? JSON.parse(i.keyTakeaways) : [],
    topics: i.topics ? JSON.parse(i.topics) : [],
  })));
});

// GET /api/interviews/:id/transcript — returns the transcript if available
router.get("/interviews/:id/transcript", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .select({ transcriptText: interviewsTable.transcriptText, title: interviewsTable.title })
    .from(interviewsTable)
    .where(eq(interviewsTable.id, id))
    .limit(1);

  if (!row[0]) { res.status(404).json({ error: "Not found" }); return; }
  if (!row[0].transcriptText) { res.status(404).json({ error: "Transcript not yet available" }); return; }
  res.json({ title: row[0].title, transcript: row[0].transcriptText });
});

// POST /api/interviews/refresh — admin-only manual trigger
router.post("/interviews/refresh", async (req, res) => {
  const { fetchPersonInterviews } = await import("../lib/youtube-fetcher");
  const { generateMissingSummaries } = await import("../lib/interview-summarizer");
  const fetched = await fetchPersonInterviews();
  const summarized = await generateMissingSummaries(10);
  res.json({ fetched, summarized });
});

export default router;
```

**File to modify:** `artifacts/api-server/src/routes/index.ts`

Register the new router:
```typescript
import interviewsRouter from "./interviews";
// ... add to the app.use() calls:
app.use("/api", interviewsRouter);
```

---

### 1E. Frontend Components

**File to create:** `artifacts/ai-hub/src/components/interview-card.tsx`

```typescript
// Interview card component for use on home page, people detail, and /interviews page
// Props:
//   interview: {
//     id: number, videoId: string, title: string, url: string,
//     thumbnailUrl: string | null, personName: string | null,
//     personImageUrl: string | null, channelName: string,
//     publishedAt: string | null, aiSummary: string | null,
//     keyTakeaways: string[], topics: string[],
//     durationSeconds: number | null, hasTranscript: boolean
//   }
//   compact?: boolean  — smaller card for home page spotlight
//
// Design language: match existing terminal/mono aesthetic (bg-secondary, border-border, font-mono)
// Show: YouTube thumbnail, title, person badge, channel name, date, topics chips,
//       aiSummary (if present, collapsed/expandable), keyTakeaways (if present, as bullet list),
//       "WATCH" button linking to YouTube URL (target="_blank"),
//       "TRANSCRIPT" badge (if hasTranscript, links to /interviews/:id/transcript modal)
```

**File to create:** `artifacts/ai-hub/src/pages/interviews.tsx`

```typescript
// Route: /interviews
// Full interviews listing page
//
// Layout:
//   - Page header: "INTERVIEW_STREAM" with subtitle "Original-source interviews from key AI figures"
//   - Filter bar:
//       * Person filter: dropdown or pill tabs for ALL + each person with interviews
//       * Topic filter: pills for topics from INTERVIEW_TOPICS constant
//         ["All", "AGI Timeline", "New Model", "Capabilities", "Safety", "Reasoning", "Agents", "Open Source"]
//   - Interview grid: 2-column on md+, 1-column on mobile, using <InterviewCard />
//   - Pagination: "Load more" button (append, not page replace)
//   - Empty state: "NO_SIGNAL_FOUND — no interviews match your filters"
//
// Data fetching: useQuery hitting GET /api/interviews with personId and topic query params
// URL state: persist active person and topic filters in URL search params
```

**File to modify:** `artifacts/ai-hub/src/pages/person-detail.tsx`

After the existing feed section, add a new "Interviews" section:
```typescript
// Import useQuery and InterviewCard
// Fetch GET /api/people/:id/interviews
// Show section header: "[ INTERVIEWS ]" with count badge
// Render <InterviewCard compact /> for each interview
// Show "VIEW_ALL_INTERVIEWS" link to /interviews?personId=:id if count > 3
// Add "INTERVIEWS" tab to the existing tab structure (alongside activity feed)
```

**File to modify:** `artifacts/ai-hub/src/pages/home.tsx`

Add a new section between the spotlight and feed sections:
```typescript
// Section: "LATEST_INTERVIEWS"
// Fetch GET /api/interviews?limit=6
// Horizontal scroll row of <InterviewCard compact /> cards
// "VIEW_ALL →" link to /interviews
// Show skeleton loaders while loading
```

**File to modify:** `artifacts/ai-hub/src/App.tsx`

Add new route:
```typescript
import Interviews from "@/pages/interviews";
// Inside <Switch>:
<Route path="/interviews" component={Interviews} />
```

**File to modify:** `artifacts/ai-hub/src/components/layout.tsx`

Add nav link for Interviews (use `Film` or `Youtube` icon from lucide-react):
```typescript
// Add alongside existing nav items:
{ href: "/interviews", label: "INTERVIEWS", icon: <Film className="h-4 w-4" /> }
```

---

### 1F. Admin: People Channel ID Management

**File to modify:** `artifacts/ai-hub/src/pages/admin.tsx`

Add a "YouTube Channels" management panel:
- Table showing all people + their current `youtubeChannelId` and `youtubeHandle`
- Inline edit for admins to add/update these fields
- "FETCH_NOW" button to manually trigger interview refresh

**New API endpoint:** `PATCH /api/admin/people/:id` — update `youtubeChannelId` and `youtubeHandle` fields (admin-only, verify against `gunjan1982@gmail.com`).

---

## Feature 2 — AI YouTube Channels Directory

### Goal
Curate and display a directory of leading AI-focused YouTube channels and interviewers. These are the destination channels where AI interviews and educational content are published. Cross-link with Feature 1 so that when an interviewer channel (e.g. Lex Fridman) publishes a video featuring one of our tracked people, it appears in that person's interview feed.

---

### 2A. Database Schema

**Option:** Extend the existing `sourcesTable` with a new type value `"youtube"`. Add two new columns.

**File to modify:** `lib/db/src/schema/sources.ts`

Add new optional fields:
```typescript
// Add inside the pgTable("sources", { ... }) object:
youtubeChannelId: text("youtube_channel_id"),    // For RSS subscription
isInterviewChannel: boolean("is_interview_channel").default(false), // True if they publish interviews
featuredPeopleIds: text("featured_people_ids"),   // JSON array of people IDs they frequently feature
```

Existing `type` field will use `"youtube"` as the value for YouTube channels.
Existing `host` field = channel name / host's name.
Existing `subscriberCount` field = subscriber count string (e.g. "4.2M").
Existing `url` field = `https://youtube.com/@channelhandle`.
Existing `isHighSignal` field = true for tier-1 channels.

**Initial curated YouTube channels to seed** (add to `scripts/src/seed.ts`):

| Channel | Host | Channel ID | isInterviewChannel | isHighSignal |
|---------|------|------------|-------------------|--------------|
| Lex Fridman Podcast | Lex Fridman | UCnM5iMKiSJVDEFOBYRqf50g | true | true |
| 3Blue1Brown | Grant Sanderson | UCYO_jab_esuFRV4b17AJtAw | false | true |
| Two Minute Papers | Károly Zsolnai-Fehér | UCbfYPyITQ-7l4upoX8nvctg | false | true |
| Yannic Kilcher | Yannic Kilcher | UCZHmQk67mSJgfCCTn7xBfew | false | true |
| AI Explained | Various | UCu7l1M1milyGECCLFAjEblg | false | true |
| The TWIML AI Podcast | Sam Charrington | UC7IcJI8PUf5Z3zKxnZvTBog | true | true |
| Machine Learning Street Talk | Various | UCMLtBahI5DMrt0j0VVZoTIQ | true | false |
| Dwarkesh Podcast | Dwarkesh Patel | UCqr-7GDVTsdNBCeufvERYuw | true | true |
| No Priors Podcast | Sarah Guo & Elad Gil | UCaFEQHU3iMkAi9TbM2Gc-kQ | true | false |
| Eye on AI | Craig Smith | UCBBDvEbNnxMAIJBN4YlAHTw | true | false |
| Hard Fork (NYT) | Kevin Roose & Casey Newton | — | true | false |

---

### 2B. Frontend Changes

**File to modify:** `artifacts/ai-hub/src/pages/sources.tsx`

Add `YOUTUBE` to the category filter pills (alongside `NEWSLETTER`, `PODCAST`, `BLOG`, etc.):
```typescript
// Add "YOUTUBE" to the FILTER_TYPES constant array
// Add a special YouTube channel card variant that shows:
//   - Channel thumbnail (fetch from: https://www.youtube.com/channel/:channelId)
//   - Subscriber count badge
//   - "INTERVIEW_CHANNEL" badge if isInterviewChannel
//   - List of featured AI figures (resolve from featuredPeopleIds)
//   - "SUBSCRIBE" button linking to channel URL
//   - "VIEW_INTERVIEWS →" link to /interviews filtered by this channel (future)
```

**File to modify:** `artifacts/ai-hub/src/pages/home.tsx`

Optionally add a small "Featured Interviewers" strip in the sidebar or below the interview section showing avatar + name of top interview channels.

---

### 2C. Cross-link with Feature 1

**File to modify:** `artifacts/api-server/src/lib/youtube-fetcher.ts`

Add a second fetcher function `fetchInterviewerChannels()` that:
1. Queries all sources with type `"youtube"` and `isInterviewChannel = true` and non-null `youtubeChannelId`
2. For each, fetches the YouTube RSS feed
3. For each video, checks if the title mentions any tracked person's name
4. If a match is found, inserts into `interviewsTable` with `isOriginalSource: true` (these ARE the original source), linked to the matched `personId`
5. De-duplicates by `videoId` (the unique constraint handles this)

```typescript
export async function fetchInterviewerChannels(): Promise<number> {
  // Query sources table where type='youtube' AND youtubeChannelId IS NOT NULL AND isInterviewChannel = true
  // Query people table to get name list for matching
  // For each interviewer channel RSS feed, for each video item:
  //   - Check if any person.name appears in the video title
  //   - If yes, insert into interviewsTable with personId = matched person's id
  //   - channelName = the interviewer channel's name
  //   - isOriginalSource = true (this is where the interview was published)
  // Return count of new insertions
}
```

---

## Feature 3 — MY AI Journey

### Goal
A community space where authenticated users can:
1. **Check in** — share what AI tools they're currently using and for what purpose
2. **Rate frontier models** — submit structured reviews of Claude, ChatGPT, Gemini, Grok, Llama, Mistral, etc. with dates of use
3. **Browse the community** — see aggregated ratings and other users' public check-ins as a feed

This is Phase 1 of a larger "MY AI Journey" vision. Build the data model to be extensible.

---

### 3A. Database Schema

**File to create:** `lib/db/src/schema/journey.ts`

```typescript
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One profile per Clerk user — their public AI Journey identity
export const aiJourneyProfilesTable = pgTable("ai_journey_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),       // Clerk user ID
  displayName: text("display_name"),                 // How they want to appear publicly
  currentRole: text("current_role"),                 // e.g. "Software Engineer", "Designer", "Student"
  aiExperienceLevel: text("ai_experience_level"),    // "beginner" | "intermediate" | "advanced" | "expert"
  currentlyWorkingOn: text("currently_working_on"), // Free text: "what are you building/doing with AI?"
  primaryUseCase: text("primary_use_case"),          // "coding" | "writing" | "research" | "creative" | "business" | "other"
  bio: text("bio"),                                   // Short personal note (max 300 chars)
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual tool usage records — one per (user, tool) pair
export const aiToolUsageTable = pgTable("ai_tool_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  toolName: text("tool_name").notNull(),            // e.g. "Claude", "Cursor", "Midjourney", "Perplexity"
  toolCategory: text("tool_category"),               // "LLM" | "Code" | "Image" | "Audio" | "Video" | "Search" | "Agent" | "Other"
  useCase: text("use_case"),                         // How they use it
  frequency: text("frequency"),                      // "daily" | "weekly" | "monthly" | "occasionally"
  rating: integer("rating"),                         // 1–5
  notes: text("notes"),                              // Optional short note
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Frontier model reviews — structured reviews of the major frontier LLMs
export const frontierModelReviewsTable = pgTable("frontier_model_reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Model identification
  provider: text("provider").notNull(),              // "Anthropic" | "OpenAI" | "Google" | "Meta" | "xAI" | "Mistral" | "Other"
  modelName: text("model_name").notNull(),           // e.g. "Claude 3.7 Sonnet", "GPT-4o", "Gemini 2.0 Flash"
  modelVersion: text("model_version"),               // Optional specific version/date

  // Usage context
  primaryUseCase: text("primary_use_case"),          // "coding" | "writing" | "research" | "creative" | "analysis" | "other"
  usagePeriodStart: text("usage_period_start"),      // e.g. "Jan 2025" — free text month/year
  usagePeriodEnd: text("usage_period_end"),          // e.g. "Apr 2025" or "present"
  lastUsedAt: timestamp("last_used_at"),             // Actual date of last use (user-reported)

  // Ratings (all 1–5 integers, nullable)
  overallRating: integer("overall_rating"),
  reasoningRating: integer("reasoning_rating"),
  codingRating: integer("coding_rating"),
  creativeRating: integer("creative_rating"),
  speedRating: integer("speed_rating"),

  // Qualitative
  strengths: text("strengths"),                      // What it's great at (max 500 chars)
  weaknesses: text("weaknesses"),                    // Where it falls short (max 500 chars)
  review: text("review"),                            // Full free-text review (max 1000 chars)
  wouldRecommend: boolean("would_recommend"),

  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exports and types
export const insertAiJourneyProfileSchema = createInsertSchema(aiJourneyProfilesTable).omit({ id: true });
export type InsertAiJourneyProfile = z.infer<typeof insertAiJourneyProfileSchema>;
export type AiJourneyProfile = typeof aiJourneyProfilesTable.$inferSelect;

export const insertAiToolUsageSchema = createInsertSchema(aiToolUsageTable).omit({ id: true });
export type InsertAiToolUsage = z.infer<typeof insertAiToolUsageSchema>;

export const insertFrontierModelReviewSchema = createInsertSchema(frontierModelReviewsTable).omit({ id: true });
export type InsertFrontierModelReview = z.infer<typeof insertFrontierModelReviewSchema>;
export type FrontierModelReview = typeof frontierModelReviewsTable.$inferSelect;
```

**File to modify:** `lib/db/src/schema/index.ts`

```typescript
export * from "./journey";
```

---

### 3B. Constant Definitions

**File to create:** `artifacts/ai-hub/src/data/journey-constants.ts`

```typescript
// Frontier models to surface in the review UI
// Keep this list updated as new models release
export const FRONTIER_MODELS = [
  { provider: "Anthropic", models: ["Claude 3.7 Sonnet", "Claude 3.5 Haiku", "Claude 3 Opus"] },
  { provider: "OpenAI", models: ["GPT-4o", "GPT-4o mini", "o3", "o4-mini"] },
  { provider: "Google", models: ["Gemini 2.0 Flash", "Gemini 2.0 Pro", "Gemini 1.5 Pro"] },
  { provider: "xAI", models: ["Grok 3", "Grok 2"] },
  { provider: "Meta", models: ["Llama 3.3 70B", "Llama 3.1 405B"] },
  { provider: "Mistral", models: ["Mistral Large", "Mistral Small"] },
  { provider: "DeepSeek", models: ["DeepSeek R2", "DeepSeek V3"] },
];

export const TOOL_CATEGORIES = ["LLM", "Code", "Image", "Audio", "Video", "Search", "Agent", "Productivity", "Other"];

export const USE_CASES = ["Coding", "Writing", "Research", "Creative", "Analysis", "Customer Support", "Education", "Business", "Other"];

export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "BEGINNER — just getting started" },
  { value: "intermediate", label: "INTERMEDIATE — using AI daily" },
  { value: "advanced", label: "ADVANCED — building with AI" },
  { value: "expert", label: "EXPERT — pushing the frontier" },
];

export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Occasionally"];
```

---

### 3C. API Routes

**File to create:** `artifacts/api-server/src/routes/journey.ts`

All routes except community-read endpoints require Clerk auth middleware.

```typescript
import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  aiJourneyProfilesTable,
  aiToolUsageTable,
  frontierModelReviewsTable,
} from "@workspace/db/schema";
import { eq, desc, and, avg, count } from "drizzle-orm";

const router: IRouter = Router();

// ---- PROFILES ----

// GET /api/journey/feed — public community feed (recent check-ins)
router.get("/journey/feed", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const profiles = await db
    .select()
    .from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.isPublic, true))
    .orderBy(desc(aiJourneyProfilesTable.updatedAt))
    .limit(limit)
    .offset(offset);
  res.json(profiles);
});

// GET /api/journey/profile — get my own profile (auth required)
router.get("/journey/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [profile] = await db
    .select().from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.userId, userId)).limit(1);
  res.json(profile ?? null);
});

// POST /api/journey/profile — create or update my profile (upsert)
router.post("/journey/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const data = req.body; // validate with zod in production
  await db
    .insert(aiJourneyProfilesTable)
    .values({ ...data, userId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: aiJourneyProfilesTable.userId,
      set: { ...data, updatedAt: new Date() },
    });
  const [updated] = await db.select().from(aiJourneyProfilesTable)
    .where(eq(aiJourneyProfilesTable.userId, userId)).limit(1);
  res.json(updated);
});

// ---- TOOL USAGE ----

// GET /api/journey/tools/mine — get my tool usage list
router.get("/journey/tools/mine", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const tools = await db.select().from(aiToolUsageTable)
    .where(eq(aiToolUsageTable.userId, userId))
    .orderBy(desc(aiToolUsageTable.updatedAt));
  res.json(tools);
});

// POST /api/journey/tools — add or update a tool
router.post("/journey/tools", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { id, ...data } = req.body;
  if (id) {
    await db.update(aiToolUsageTable).set({ ...data, updatedAt: new Date() })
      .where(and(eq(aiToolUsageTable.id, id), eq(aiToolUsageTable.userId, userId)));
  } else {
    await db.insert(aiToolUsageTable).values({ ...data, userId });
  }
  res.json({ ok: true });
});

// DELETE /api/journey/tools/:id
router.delete("/journey/tools/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(aiToolUsageTable)
    .where(and(eq(aiToolUsageTable.id, Number(req.params.id)), eq(aiToolUsageTable.userId, userId)));
  res.json({ ok: true });
});

// ---- FRONTIER MODEL REVIEWS ----

// GET /api/journey/models — community aggregate ratings per model (public)
router.get("/journey/models", async (req, res) => {
  // Return aggregate: per provider+modelName: avg overallRating, count of reviews
  const rows = await db
    .select({
      provider: frontierModelReviewsTable.provider,
      modelName: frontierModelReviewsTable.modelName,
      avgRating: avg(frontierModelReviewsTable.overallRating),
      reviewCount: count(),
    })
    .from(frontierModelReviewsTable)
    .where(eq(frontierModelReviewsTable.isPublic, true))
    .groupBy(frontierModelReviewsTable.provider, frontierModelReviewsTable.modelName)
    .orderBy(frontierModelReviewsTable.provider, frontierModelReviewsTable.modelName);
  res.json(rows);
});

// GET /api/journey/models/reviews — recent public reviews feed
router.get("/journey/models/reviews", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const modelName = req.query.model as string | undefined;
  const where = modelName
    ? and(eq(frontierModelReviewsTable.isPublic, true), eq(frontierModelReviewsTable.modelName, modelName))
    : eq(frontierModelReviewsTable.isPublic, true);
  const reviews = await db.select().from(frontierModelReviewsTable)
    .where(where).orderBy(desc(frontierModelReviewsTable.updatedAt)).limit(limit);
  res.json(reviews);
});

// GET /api/journey/models/mine — my own reviews
router.get("/journey/models/mine", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const reviews = await db.select().from(frontierModelReviewsTable)
    .where(eq(frontierModelReviewsTable.userId, userId))
    .orderBy(desc(frontierModelReviewsTable.updatedAt));
  res.json(reviews);
});

// POST /api/journey/models — submit or update a model review
router.post("/journey/models", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { id, ...data } = req.body;
  if (id) {
    await db.update(frontierModelReviewsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(frontierModelReviewsTable.id, id), eq(frontierModelReviewsTable.userId, userId)));
  } else {
    await db.insert(frontierModelReviewsTable).values({ ...data, userId });
  }
  res.json({ ok: true });
});

// DELETE /api/journey/models/:id
router.delete("/journey/models/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(frontierModelReviewsTable)
    .where(and(eq(frontierModelReviewsTable.id, Number(req.params.id)), eq(frontierModelReviewsTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
```

**File to modify:** `artifacts/api-server/src/routes/index.ts`

```typescript
import journeyRouter from "./journey";
app.use("/api", journeyRouter);
```

---

### 3D. Frontend Pages and Components

**File to create:** `artifacts/ai-hub/src/pages/my-journey.tsx`

Route: `/my-journey`

This is the primary page for the feature. Structure:

```
/my-journey
├── If unauthenticated:
│     Show hero explaining the feature + SIGN_IN prompt
│
└── If authenticated:
      ┌─────────────────────────────────────────────┐
      │  MY_AI_JOURNEY header                        │
      │  "PHASE_1 · BETA"  badge                     │
      ├─────────────────────────────────────────────┤
      │  [MY PROFILE]  [MY TOOLS]  [MY REVIEWS]      │  ← tab bar
      │  [COMMUNITY]                                  │
      └─────────────────────────────────────────────┘

TAB 1 — MY PROFILE
  - Display name, role, experience level selector
  - "Currently working on:" text area (the check-in)
  - Primary use case selector
  - Short bio
  - Public/private toggle
  - SAVE_PROFILE button

TAB 2 — MY TOOLS
  - "Add Tool" button → modal with toolName, category, frequency, rating (1-5 stars), notes
  - List of added tools as cards: tool name, category badge, frequency, star rating, notes, edit/delete
  - Suggested tools quick-add chips: Claude, ChatGPT, Cursor, Copilot, Gemini, Perplexity, Midjourney, etc.

TAB 3 — MY REVIEWS (Frontier Models)
  - Model cards grid — one card per FRONTIER_MODELS entry
  - Each card shows: provider logo color, model name, "REVIEWED" badge (if user has reviewed it)
  - Clicking a card → opens ReviewModal:
      * Model name (prefilled, readonly)
      * Primary use case selector
      * Usage period: "From [month/year] to [month/year or present]"
      * Last used date picker
      * Rating sliders (1–5): Overall, Reasoning, Coding, Creative, Speed
      * Strengths text area
      * Weaknesses text area
      * Full review text area
      * Would recommend? Yes/No toggle
      * Public/private toggle
  - After review saved, card shows star rating + "LAST USED: [date]"

TAB 4 — COMMUNITY
  - Two sub-sections:
    a) "CHECK-INS" — recent public profiles showing: displayName, role, experience level,
       "currently working on" text, last updated date. Scrollable feed.
    b) "MODEL RATINGS" — aggregate leaderboard table:
       Columns: Model, Provider, Avg Rating (stars), # Reviews
       Grouped by provider, sorted by avg rating desc
       Click model row → filter community reviews to that model
  - Public model reviews feed (most recent first)
```

**File to create:** `artifacts/ai-hub/src/components/model-review-modal.tsx`

```typescript
// Modal for submitting/editing a frontier model review
// Props: modelName, provider, existingReview (optional), onSave, onClose
// Use shadcn Dialog component
// Form fields per section 3D above
// POST to /api/journey/models on submit
// Invalidate useQuery cache for /api/journey/models/mine and /api/journey/models on success
```

**File to create:** `artifacts/ai-hub/src/components/tool-usage-card.tsx`

```typescript
// Card showing a single AI tool a user has logged
// Props: tool (AiToolUsage), onEdit, onDelete
// Shows: toolName (large), category badge, frequency chip, star rating visual,
//        notes (collapsed, expandable), updatedAt date, edit/delete buttons
```

**File to modify:** `artifacts/ai-hub/src/App.tsx`

```typescript
import MyJourney from "@/pages/my-journey";
// Inside <Switch>:
<Route path="/my-journey" component={MyJourney} />
```

**File to modify:** `artifacts/ai-hub/src/components/layout.tsx`

Add nav link (use `Compass` or `Route` icon from lucide-react):
```typescript
{ href: "/my-journey", label: "MY_JOURNEY", icon: <Compass className="h-4 w-4" /> }
```

**File to modify:** `artifacts/ai-hub/src/pages/my-hub.tsx`

Add a summary card linking to `/my-journey`:
```typescript
// If user has a journey profile: show a compact summary card —
//   experience level badge, # tools logged, # models reviewed, "EDIT_JOURNEY →" link
// If no profile yet: show a CTA card — "START YOUR AI JOURNEY" button linking to /my-journey
```

---

### 3E. Home Page Integration

**File to modify:** `artifacts/ai-hub/src/pages/home.tsx`

Add a "COMMUNITY PULSE" section near the bottom of the home page:
```typescript
// Fetch GET /api/journey/models (aggregate ratings, public endpoint)
// Show a compact model leaderboard strip: top 3 rated models with provider + avg rating + review count
// "JOIN THE COMMUNITY →" CTA linking to /my-journey
// Only show if there are at least 3 reviews total (hide if data too sparse)
```

---

## Cross-Cutting Concerns

### API Client Code Generation

After adding new routes, regenerate the React API client:
```bash
pnpm --filter @workspace/api-spec run codegen
```
This updates `lib/api-client-react/` with typed hooks. If the codegen doesn't auto-pick up new routes (it depends on the OpenAPI spec in `lib/api-spec/`), you may need to manually add entries to the spec or write custom `useQuery` hooks directly in the page files.

### Zod Validation

For each new POST endpoint body, create corresponding Zod schemas in `lib/api-zod/src/`. Follow the existing pattern — export from the index file and import in the route handler with `.safeParse(req.body)`.

### Database Migrations

Run after every schema change:
```bash
pnpm --filter @workspace/db run generate
pnpm --filter @workspace/db run migrate
```

### Environment Variables Required (add to Replit Secrets and local .env)

```
ANTHROPIC_API_KEY=        # For interview summarizer (Feature 1)
# YouTube Data API key is NOT needed — we use public RSS feeds
```

### Design System Rules

- All new UI must match the existing terminal/cyberpunk aesthetic
- Use `font-mono` for labels, badges, and stat numbers
- Status labels use SCREAMING_SNAKE_CASE: `INTERVIEW_STREAM`, `NO_SIGNAL_FOUND`, `MY_AI_JOURNEY`
- Color: `bg-secondary`, `border-border`, `text-muted-foreground`, `text-primary` for highlights
- Skeleton loaders on all async data using the existing `<Skeleton />` from shadcn
- Empty states must have a label like `NO_DATA_YET` or `NO_SIGNAL_FOUND`
- Buttons: use `variant="outline"` with `font-mono` class for secondary actions

---

## Implementation Order

Recommended sequence to minimise blockers:

| Step | Task | Why this order |
|------|------|----------------|
| 1 | DB schema: `interviews.ts`, `journey.ts`, add columns to `people.ts` and `sources.ts` | Everything else depends on DB |
| 2 | Run DB migrations | Unblocks backend |
| 3 | Feature 1 backend: `youtube-fetcher.ts`, `interviews.ts` routes | Core data pipeline |
| 4 | Feature 2 backend: `sources.ts` seed + `fetchInterviewerChannels()` | Extends Feature 1 |
| 5 | Feature 1 frontend: `interview-card.tsx`, `interviews.tsx` page, home/person-detail updates | Delivers user-visible value |
| 6 | Feature 2 frontend: Sources page YouTube filter | Quick win, low complexity |
| 7 | Feature 3 backend: `journey.ts` routes | Isolated, parallel track |
| 8 | Feature 3 frontend: `my-journey.tsx`, modal components | Most complex frontend work |
| 9 | Feature 1 AI summaries: `interview-summarizer.ts` | Adds intelligence layer on top of data |
| 10 | Home page integrations (interviews strip, community pulse) | Polish pass |
| 11 | Admin: people channel ID management panel | Ops tooling |
| 12 | Transcript fetching service | Optional enhancement |
