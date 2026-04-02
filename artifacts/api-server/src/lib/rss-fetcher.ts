import Parser from "rss-parser";
import { db } from "@workspace/db";
import { feedItemsTable, peopleTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "AI-Industry-Hub/1.0 RSS Reader" },
  customFields: {
    item: [["media:content", "mediaContent"], ["media:thumbnail", "mediaThumbnail"]],
  },
});

const GOOGLE_NEWS_RSS = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

const SOURCE_FEEDS: { name: string; url: string }[] = [
  { name: "Simon Willison's Weblog", url: "https://simonwillison.net/atom/everything/" },
  { name: "OpenAI Blog", url: "https://openai.com/index.rss" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/blog.rss" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml" },
  { name: "Lilian Weng's Blog", url: "https://lilianweng.github.io/index.xml" },
  { name: "The Batch (DeepLearning.AI)", url: "https://www.deeplearning.ai/the-batch/feed/" },
  { name: "Latent Space", url: "https://www.latent.space/feed" },
];

function extractImage(item: Parser.Item & { mediaContent?: { $?: { url?: string } }; mediaThumbnail?: { $?: { url?: string } } }): string | null {
  if (item.mediaContent?.["$"]?.url) return item.mediaContent["$"].url;
  if (item.mediaThumbnail?.["$"]?.url) return item.mediaThumbnail["$"].url;
  return null;
}

function extractSourceName(link: string): string {
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown Source";
  }
}

async function fetchFeed(url: string, label: string): Promise<Parser.Item[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items ?? [];
  } catch (err) {
    logger.warn({ url, label, err }, "Failed to fetch RSS feed");
    return [];
  }
}

async function upsertItems(
  items: Parser.Item[],
  personId: number | null,
  sourceName: string,
  type: string
) {
  let inserted = 0;
  for (const item of items.slice(0, 20)) {
    if (!item.link || !item.title) continue;

    try {
      await db
        .insert(feedItemsTable)
        .values({
          personId: personId ?? undefined,
          title: item.title,
          url: item.link,
          description: item.contentSnippet?.slice(0, 400) ?? item.summary?.slice(0, 400) ?? null,
          sourceName,
          sourceUrl: extractSourceName(item.link) ? `https://${extractSourceName(item.link)}` : null,
          imageUrl: extractImage(item as Parameters<typeof extractImage>[0]),
          publishedAt: item.pubDate ? new Date(item.pubDate) : item.isoDate ? new Date(item.isoDate) : null,
          type,
        })
        .onConflictDoNothing();
      inserted++;
    } catch {
      // unique constraint violation on url — skip
    }
  }
  return inserted;
}

export async function refreshFeeds(): Promise<number> {
  logger.info("Starting RSS feed refresh...");
  let total = 0;

  // Fetch Google News for each tracked person
  const people = await db.select({ id: peopleTable.id, name: peopleTable.name }).from(peopleTable);

  const personResults = await Promise.allSettled(
    people.map(async (person) => {
      const query = `"${person.name}" AI`;
      const items = await fetchFeed(GOOGLE_NEWS_RSS(query), person.name);
      return upsertItems(items, person.id, "Google News", "news");
    })
  );

  for (const r of personResults) {
    if (r.status === "fulfilled") total += r.value;
  }

  // Fetch curated source RSS feeds (not person-specific)
  const sourceResults = await Promise.allSettled(
    SOURCE_FEEDS.map(async ({ name, url }) => {
      const items = await fetchFeed(url, name);
      return upsertItems(items, null, name, "article");
    })
  );

  for (const r of sourceResults) {
    if (r.status === "fulfilled") total += r.value;
  }

  logger.info({ total }, "Feed refresh complete");
  return total;
}
