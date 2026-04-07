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

const BING_NEWS_RSS = (query: string) =>
  `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS`;

const SOURCE_FEEDS: { name: string; url: string }[] = [
  { name: "Simon Willison's Weblog", url: "https://simonwillison.net/atom/everything/" },
  { name: "OpenAI Blog", url: "https://openai.com/news/rss.xml" },
  { name: "Anthropic Blog", url: BING_NEWS_RSS("site:anthropic.com AI research") },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml" },
  { name: "Lilian Weng's Blog", url: "https://lilianweng.github.io/index.xml" },
  { name: "The Batch (DeepLearning.AI)", url: BING_NEWS_RSS("deeplearning.ai \"the batch\" newsletter") },
  { name: "Latent Space", url: "https://www.latent.space/feed" },
  { name: "The Neuron", url: BING_NEWS_RSS("\"The Neuron\" AI newsletter daily") },
  { name: "AlphaSignal", url: "https://alphasignal.substack.com/feed" },
  { name: "Ben's Bites", url: "https://www.bensbites.com/feed" },
  { name: "TLDR AI", url: "https://tldr.tech/api/rss/ai" },
  { name: "3Blue1Brown", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw" },
  // News Websites
  { name: "Google Research Blog", url: "https://research.google/blog/rss" },
  { name: "The Verge - AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "WIRED - AI", url: "https://www.wired.com/feed/tag/ai/latest/rss" },
  { name: "TechCrunch - AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "The Guardian - AI", url: "https://www.theguardian.com/technology/artificialintelligenceai/rss" },
  { name: "Ars Technica - AI", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "KDnuggets", url: "https://www.kdnuggets.com/feed/" },
  { name: "Hacker News - AI", url: "https://hnrss.org/newest?q=AI+LLM+machine+learning&count=20" },
  // Research & Company Blogs
  { name: "Meta AI Blog", url: "https://engineering.fb.com/category/ai-research/feed/" },
  { name: "AWS Machine Learning Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/" },
  { name: "MIRI Blog", url: "https://intelligence.org/feed/" },
  { name: "O'Reilly AI & ML", url: "https://www.oreilly.com/radar/topics/ai-ml/feed/index.xml" },
  // Expanded sources
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "MIT Technology Review - AI", url: "https://www.technologyreview.com/feed/" },
  { name: "IEEE Spectrum - AI", url: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss" },
  { name: "Import AI (Jack Clark)", url: "https://jack-clark.net/feed/" },
  { name: "Interconnects (Nathan Lambert)", url: "https://www.interconnects.ai/feed" },
  { name: "One Useful Thing (Ethan Mollick)", url: "https://www.oneusefulthing.org/feed" },
  { name: "Gary Marcus Substack", url: "https://garymarcus.substack.com/feed" },
  { name: "Stratechery", url: "https://stratechery.com/feed/" },
  { name: "Ahead of AI (Sebastian Raschka)", url: "https://magazine.sebastianraschka.com/feed" },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org/feed.xml" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml" },
  { name: "Mistral Blog", url: BING_NEWS_RSS("Mistral AI model release") },
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

  // Fetch Bing News for each tracked person (Bing works from cloud servers; Google News blocks them)
  const people = await db.select({ id: peopleTable.id, name: peopleTable.name }).from(peopleTable);

  const personResults = await Promise.allSettled(
    people.map(async (person) => {
      const query = `"${person.name}" AI`;
      const items = await fetchFeed(BING_NEWS_RSS(query), person.name);
      return upsertItems(items, person.id, "Bing News", "news");
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
