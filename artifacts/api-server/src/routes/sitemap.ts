import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { peopleTable, sourcesTable, communitiesTable } from "@workspace/db/schema";

const router: IRouter = Router();
const SITE_URL = "https://isagihere.wiki";

router.get("/sitemap.xml", async (req, res) => {
  try {
    const [people, sources, communities] = await Promise.all([
      db.select({ id: peopleTable.id }).from(peopleTable),
      db.select({ id: sourcesTable.id }).from(sourcesTable),
      db.select({ id: communitiesTable.id }).from(communitiesTable),
    ]);

    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: SITE_URL, priority: "1.0", changefreq: "daily" },
      { loc: `${SITE_URL}/people`, priority: "0.9", changefreq: "daily" },
      { loc: `${SITE_URL}/feed`, priority: "0.9", changefreq: "hourly" },
      { loc: `${SITE_URL}/sources`, priority: "0.8", changefreq: "weekly" },
      { loc: `${SITE_URL}/communities`, priority: "0.8", changefreq: "weekly" },
      { loc: `${SITE_URL}/learn`, priority: "0.7", changefreq: "weekly" },
      { loc: `${SITE_URL}/agi`, priority: "0.8", changefreq: "daily" },
    ];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
      ...people.map(p => `
  <url>
    <loc>${SITE_URL}/people/${p.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`),
      ...sources.map(s => `
  <url>
    <loc>${SITE_URL}/sources</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).slice(0, 1), // sources page is one URL
      ...communities.map(c => `
  <url>
    <loc>${SITE_URL}/communities</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).slice(0, 1),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  } catch {
    res.status(500).send("Failed to generate sitemap");
  }
});

router.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

export default router;
