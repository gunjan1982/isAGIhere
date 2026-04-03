import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, updateSeedData } from "./lib/seed";
import { refreshFeeds } from "./lib/rss-fetcher";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed static data if empty, apply any new entries, then kick off first feed refresh
  seedIfEmpty()
    .then(() => updateSeedData())
    .then(() => refreshFeeds())
    .then((count) => logger.info({ count }, "Initial feed refresh complete"))
    .catch((e) => logger.error({ err: e }, "Startup background tasks failed"));

  // Periodic refresh every 30 minutes
  setInterval(() => {
    refreshFeeds().catch((e) => logger.error({ err: e }, "Periodic feed refresh failed"));
  }, REFRESH_INTERVAL_MS);
});
