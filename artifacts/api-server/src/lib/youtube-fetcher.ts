import Parser from "rss-parser";
import { db } from "@workspace/db";
import { interviewsTable, peopleTable, sourcesTable } from "@workspace/db/schema";
import { isNotNull, eq, and } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({ timeout: 10000 });

const YT_CHANNEL_RSS = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const AI_KEYWORDS = [
  "artificial intelligence", " ai ", " ai,", " ai.", " agi", "machine learning",
  "deep learning", "neural network", "large language model", "llm", "gpt",
  "openai", "anthropic", "deepmind", "google deepmind", "mistral", "nvidia gpu",
  "robotics", "alignment", "safety", "capabilities", "scaling", "reasoning",
  "future of ai", "future of technology", "silicon valley", "tech ceo",
  "sam altman", "yann lecun", "andrej karpathy", "ilya sutskever",
  "dario amodei", "demis hassabis", "jensen huang", "elon musk",
  "geoffrey hinton", "yoshua bengio", "meta ai", "openai ceo",
];

function isInterviewLike(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}

const INTERVIEW_TITLE_KEYWORDS = [
  "interview", "conversation", "podcast", "speaks with", "sits down",
  "in conversation", "q&a", "fireside", "discusses", "full interview",
  "the future of", "the history of", "on ai", "on agi",
  "why agi", "how ai", "what is ai",
];

// Words that indicate clickbait / shorts / low-quality content
const EXCLUDE_KEYWORDS = [
  "#shorts", "#short", "shorts", "clip", "viral", "motivational",
  "mindset", "must watch", "speechless", "brutally honest", "terrified",
  "leaves reporter", "refuses to", "finally reveals", "this is why",
  "you won't believe", "shocking", "crypto", "bitcoin", "stock", "invest",
  "day in a life", "rise and shine", "reaction to", "reacts to",
  "mock interview", "job interview", "career switch", "racing", "turf",
  "podcast clip", "clips", "#podclip",
];

// Looser check for YouTube Data API results — we've already searched for "<name> interview"
function isInterviewTitle(title: string): boolean {
  const t = title.toLowerCase();
  // Reject if any exclude keyword is present
  if (EXCLUDE_KEYWORDS.some((kw) => t.includes(kw))) return false;
  // Must match at least one quality signal
  return INTERVIEW_TITLE_KEYWORDS.some((kw) => t.includes(kw));
}

export async function fetchPersonInterviews(): Promise<number> {
  const people = await db
    .select({ id: peopleTable.id, name: peopleTable.name, youtubeChannelId: peopleTable.youtubeChannelId })
    .from(peopleTable)
    .where(isNotNull(peopleTable.youtubeChannelId));

  let inserted = 0;

  const results = await Promise.allSettled(
    people.map(async (person: { id: number; name: string; youtubeChannelId: string | null }) => {
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

  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  if (failed > 0) {
    logger.warn({ failed }, "Some person channel fetches failed");
  }

  logger.info({ inserted }, "YouTube interview fetch complete");
  return inserted;
}

let lastFetchedAt: Date | null = null;
let fetchTimer: ReturnType<typeof setInterval> | null = null;

export async function fetchInterviewerChannels(): Promise<number> {
  const channels = await db
    .select({
      id: sourcesTable.id,
      name: sourcesTable.name,
      youtubeChannelId: sourcesTable.youtubeChannelId,
    })
    .from(sourcesTable)
    .where(
      and(
        eq(sourcesTable.isInterviewChannel, true),
        isNotNull(sourcesTable.youtubeChannelId)
      )
    );

  if (channels.length === 0) return 0;

  // Build a name-to-id lookup from people table for attribution
  const allPeople = await db
    .select({ id: peopleTable.id, name: peopleTable.name })
    .from(peopleTable);

  const peopleByName = new Map(allPeople.map((p) => [p.name.toLowerCase(), p.id]));

  let inserted = 0;

  const results = await Promise.allSettled(
    channels.map(async (channel: { id: number; name: string; youtubeChannelId: string | null }) => {
      const rssUrl = YT_CHANNEL_RSS(channel.youtubeChannelId!);
      let items: Parser.Item[];
      try {
        const feed = await parser.parseURL(rssUrl);
        items = feed.items ?? [];
      } catch (err) {
        logger.warn({ rssUrl, name: channel.name, err }, "Failed to fetch interviewer channel RSS");
        return;
      }

      for (const item of items.slice(0, 20)) {
        const videoUrl = item.link ?? "";
        const videoId = extractVideoId(videoUrl);
        if (!videoId) continue;

        const title = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? "";
        if (!isInterviewLike(title, description)) continue;

        // Try to match a person from the title
        let matchedPersonId: number | null = null;
        const titleLower = title.toLowerCase();
        for (const [personName, personId] of peopleByName) {
          if (titleLower.includes(personName)) {
            matchedPersonId = personId;
            break;
          }
        }

        const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        try {
          await db
            .insert(interviewsTable)
            .values({
              personId: matchedPersonId ?? null,
              videoId,
              channelId: channel.youtubeChannelId!,
              channelName: channel.name,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl,
              description: description.slice(0, 2000),
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              isOriginalSource: false,
            })
            .onConflictDoNothing({ target: interviewsTable.videoId });
          inserted++;
        } catch (err) {
          logger.error({ videoId, err }, "Failed to insert interviewer channel video");
        }
      }
    })
  );

  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  if (failed > 0) {
    logger.warn({ failed }, "Some interviewer channel fetches failed");
  }

  logger.info({ inserted }, "YouTube interviewer channel fetch complete");
  return inserted;
}

// ── YouTube Data API search ──────────────────────────────────────────────────
// Searches YouTube for "<name> interview" for every tracked person.
// Requires YOUTUBE_API_KEY env var (YouTube Data API v3).
// Costs ~100 quota units per person search; free quota is 10,000/day.

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    thumbnails: { high?: { url: string }; default?: { url: string } };
  };
}

export async function searchPersonInterviewsOnYouTube(): Promise<number> {
  const apiKey = process.env["YOUTUBE_API_KEY"];
  if (!apiKey) {
    logger.warn("YOUTUBE_API_KEY not set — skipping YouTube search");
    return 0;
  }

  const people = await db
    .select({ id: peopleTable.id, name: peopleTable.name })
    .from(peopleTable);

  // Only look back 30 days to keep quota low
  const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let inserted = 0;

  // Process in small batches to avoid hammering the API
  const BATCH = 5;
  for (let i = 0; i < people.length; i += BATCH) {
    const batch = people.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (person) => {
        const query = encodeURIComponent(`${person.name} interview`);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&order=date&maxResults=10&publishedAfter=${publishedAfter}&key=${apiKey}`;

        let items: YTSearchItem[];
        try {
          const res = await fetch(url);
          if (!res.ok) {
            logger.warn({ person: person.name, status: res.status }, "YouTube search failed");
            return;
          }
          const data = await res.json() as { items?: YTSearchItem[] };
          items = data.items ?? [];
        } catch (err) {
          logger.warn({ person: person.name, err }, "YouTube search request error");
          return;
        }

        for (const item of items) {
          const videoId = item.id.videoId;
          if (!videoId) continue;

          const { title, description, publishedAt, channelTitle, channelId, thumbnails } = item.snippet;

          // Must contain the person's name in the title (avoid false positives)
          if (!title.toLowerCase().includes(person.name.toLowerCase())) continue;

          // Must look like an interview (looser check — search query already includes "interview")
          if (!isInterviewTitle(title)) continue;

          const thumbnailUrl =
            thumbnails.high?.url ?? thumbnails.default?.url ??
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          try {
            await db.insert(interviewsTable).values({
              personId: person.id,
              videoId,
              channelId,
              channelName: channelTitle,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl,
              description: description.slice(0, 2000),
              publishedAt: new Date(publishedAt),
              isOriginalSource: false,
            }).onConflictDoNothing({ target: interviewsTable.videoId });
            inserted++;
          } catch (err) {
            logger.error({ videoId, err }, "Failed to insert YouTube search result");
          }
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) logger.warn({ failed }, "Some YouTube search batches failed");

    // Small delay between batches to be a good API citizen
    if (i + BATCH < people.length) await new Promise(r => setTimeout(r, 500));
  }

  logger.info({ inserted }, "YouTube person search complete");
  return inserted;
}

export function startInterviewScheduler(intervalMs = 60 * 60 * 1000) {
  if (fetchTimer) return;

  // Run channel RSS + person search on startup
  Promise.all([fetchPersonInterviews(), fetchInterviewerChannels(), searchPersonInterviewsOnYouTube()])
    .then(() => { lastFetchedAt = new Date(); })
    .catch((e) => {
      logger.error({ err: e }, "Initial interview fetch failed");
    });

  // Hourly: channel RSS feeds (cheap)
  fetchTimer = setInterval(async () => {
    try {
      await Promise.all([fetchPersonInterviews(), fetchInterviewerChannels()]);
      lastFetchedAt = new Date();
    } catch (e) {
      logger.error({ err: e }, "Scheduled interview fetch failed");
    }
  }, intervalMs);

  // Daily: YouTube search (uses API quota)
  setInterval(async () => {
    try {
      await searchPersonInterviewsOnYouTube();
      lastFetchedAt = new Date();
    } catch (e) {
      logger.error({ err: e }, "Daily YouTube search failed");
    }
  }, 24 * 60 * 60 * 1000);
}

export function getInterviewLastFetchedAt() { return lastFetchedAt; }
