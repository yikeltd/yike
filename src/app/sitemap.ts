import type { MetadataRoute } from "next";
import { getAllSitemapUrls } from "@/lib/seo/sitemap-xml";

export const revalidate = 3600;

/** Canonical /sitemap.xml — Next.js MetadataRoute (not HTML). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllSitemapUrls();
  return entries.map((entry) => ({
    url: entry.loc,
    lastModified: entry.lastmod ? new Date(entry.lastmod) : undefined,
    changeFrequency: entry.changefreq,
    priority: entry.priority,
  }));
}
