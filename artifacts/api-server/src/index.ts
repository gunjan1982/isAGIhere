import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, updateSeedData } from "./lib/seed";
import { buildDigestAndSendToAll } from "./lib/digest-scheduler";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed static data if empty, apply any new entries
  seedIfEmpty()
    .then(() => updateSeedData())
    .catch((e) => logger.error({ err: e }, "Startup background tasks failed"));

  // Weekly digest scheduler — fires every Monday at 08:00 UTC
  scheduleWeeklyDigest();
});

function scheduleWeeklyDigest() {
  function msUntilNextMonday8am(): number {
    const now = new Date();
    const target = new Date(now);
    // Find next Monday
    const daysUntilMonday = (1 - now.getUTCDay() + 7) % 7 || 7;
    target.setUTCDate(now.getUTCDate() + daysUntilMonday);
    target.setUTCHours(8, 0, 0, 0);
    return target.getTime() - now.getTime();
  }

  const delay = msUntilNextMonday8am();
  logger.info({ delayHours: Math.round(delay / 3600000) }, "Weekly digest scheduled");

  setTimeout(function fire() {
    buildDigestAndSendToAll()
      .then(({ sent, errors }) => logger.info({ sent, errors }, "Weekly digest sent"))
      .catch((e) => logger.error({ err: e }, "Weekly digest failed"));

    // Re-schedule for next Monday
    setTimeout(fire, msUntilNextMonday8am());
  }, delay);
}
