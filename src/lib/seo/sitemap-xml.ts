import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import {
  getSitemapAgentEntries,
  getSitemapPropertyEntries,
} from "@/lib/seo/sitemap-data";
import {
  getHousesCityParams,
  getHousesNeighborhoodParams,
  getHousesPropertyTypeParams,
  getAllSeoCitySlugs,
} from "@/lib/seo/paths";
import { intentInCityPath } from "@/lib/seo/intent-in-city";
import { getAllBlogSlugs } from "@/constants/blogTopics";

const MAX_PROPERTY_URLS = 5000;

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(urls: SitemapUrlEntry[]): string {
  const body = urls
    .map((entry) => {
      const parts = [`    <loc>${xmlEscape(entry.loc)}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority != null) {
        parts.push(`    <priority>${entry.priority.toFixed(2)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`
  );
}

function staticSitemapEntries(): SitemapUrlEntry[] {
  const staticRoutes: Array<{
    path: string;
    changeFrequency: SitemapUrlEntry["changefreq"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/search", changeFrequency: "daily", priority: 0.95 },
    { path: "/rent", changeFrequency: "daily", priority: 0.9 },
    { path: "/buy", changeFrequency: "daily", priority: 0.9 },
    { path: "/land", changeFrequency: "daily", priority: 0.9 },
    { path: "/explore", changeFrequency: "weekly", priority: 0.85 },
    { path: "/browse", changeFrequency: "daily", priority: 0.85 },
    { path: "/post-property", changeFrequency: "weekly", priority: 0.8 },
    { path: "/property-verification", changeFrequency: "weekly", priority: 0.78 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
    { path: "/safety", changeFrequency: "monthly", priority: 0.65 },
    { path: "/disclaimer", changeFrequency: "yearly", priority: 0.45 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.45 },
    { path: "/moderation", changeFrequency: "monthly", priority: 0.55 },
    { path: "/why-verified", changeFrequency: "monthly", priority: 0.72 },
    { path: "/verify-agent", changeFrequency: "monthly", priority: 0.68 },
    { path: "/verify-property", changeFrequency: "monthly", priority: 0.68 },
    { path: "/request-property", changeFrequency: "weekly", priority: 0.65 },
    { path: "/legal-verification", changeFrequency: "monthly", priority: 0.62 },
    { path: "/become-a-field-verifier", changeFrequency: "monthly", priority: 0.6 },
    { path: "/become-a-legal-partner", changeFrequency: "monthly", priority: 0.6 },
    { path: "/become-an-ambassador", changeFrequency: "monthly", priority: 0.6 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.65 },
    { path: "/hotel", changeFrequency: "weekly", priority: 0.75 },
    { path: "/shortlet", changeFrequency: "weekly", priority: 0.75 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  ];

  const buildDate = new Date().toISOString().slice(0, 10);

  return staticRoutes.map(({ path, changeFrequency: changefreq, priority }) => ({
    loc: `${SITE_URL}${path}`,
    lastmod: path === "" ? buildDate : undefined,
    changefreq,
    priority,
  }));
}

function seoSitemapEntries(): SitemapUrlEntry[] {
  const entries: SitemapUrlEntry[] = [];

  for (const { city } of getHousesCityParams()) {
    entries.push({
      loc: `${SITE_URL}/houses/${city}`,
      changefreq: "daily",
      priority: 0.88,
    });
  }

  const intentSlugs = getAllSeoCitySlugs();
  for (const intent of ["rent", "buy", "land"] as const) {
    for (const city of intentSlugs) {
      entries.push({
        loc: `${SITE_URL}${intentInCityPath(intent, city)}`,
        changefreq: "weekly",
        priority: intent === "rent" ? 0.86 : 0.84,
      });
    }
  }

  for (const { city, neighborhood } of getHousesNeighborhoodParams()) {
    entries.push({
      loc: `${SITE_URL}/houses/${city}/${neighborhood}`,
      changefreq: "weekly",
      priority: 0.82,
    });
  }

  for (const { city, neighborhood, propertyType } of getHousesPropertyTypeParams()) {
    entries.push({
      loc: `${SITE_URL}/houses/${city}/${neighborhood}/${propertyType}`,
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  for (const slug of getAllBlogSlugs()) {
    entries.push({
      loc: `${SITE_URL}/blog/${slug}`,
      changefreq: "monthly",
      priority: 0.72,
    });
  }

  return entries;
}

function dedupeSitemapUrls(entries: SitemapUrlEntry[]): SitemapUrlEntry[] {
  const seen = new Set<string>();
  const out: SitemapUrlEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    out.push(entry);
  }
  return out;
}

/** All public URLs for /sitemap.xml — approved listings + SEO pages, no auth/admin. */
export async function getAllSitemapUrls(): Promise<SitemapUrlEntry[]> {
  const [propertyEntries, agentEntries] = await Promise.all([
    getSitemapPropertyEntries(MAX_PROPERTY_URLS),
    getSitemapAgentEntries(),
  ]);

  const propertyUrls: SitemapUrlEntry[] = propertyEntries.map((entry) => ({
    loc: `${SITE_URL}/properties/${entry.path}`,
    lastmod: entry.updated_at
      ? new Date(entry.updated_at).toISOString().slice(0, 10)
      : undefined,
    changefreq: "daily",
    priority: 0.82,
  }));

  const agentUrls: SitemapUrlEntry[] = agentEntries.map((entry) => ({
    loc: `${SITE_URL}/agents/${entry.slug}`,
    lastmod: entry.updated_at
      ? new Date(entry.updated_at).toISOString().slice(0, 10)
      : undefined,
    changefreq: "weekly",
    priority: 0.74,
  }));

  return dedupeSitemapUrls([
    ...staticSitemapEntries(),
    ...seoSitemapEntries(),
    ...agentUrls,
    ...propertyUrls,
  ]);
}
