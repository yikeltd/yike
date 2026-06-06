import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getSitemapPropertyIds } from "@/lib/seo/sitemap-data";
import {
  getHousesCityParams,
  getHousesNeighborhoodParams,
  getHousesPropertyTypeParams,
} from "@/lib/seo/paths";
import { getAllBlogSlugs } from "@/constants/blogTopics";

const PROPERTY_CHUNK_SIZE = 500;
const MAX_PROPERTY_URLS = 5000;

export async function generateSitemaps() {
  const ids = await getSitemapPropertyIds(MAX_PROPERTY_URLS);
  const propertyChunks = Math.max(1, Math.ceil(ids.length / PROPERTY_CHUNK_SIZE));
  const maps: { id: number }[] = [{ id: 0 }];
  for (let i = 1; i <= propertyChunks; i++) maps.push({ id: i });
  return maps;
}

function mainSitemapEntries(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/explore",
    "/rent",
    "/buy",
    "/hotel",
    "/shortlet",
    "/land",
    "/search",
    "/browse",
    "/post-property",
    "/request-property",
    "/verify-agent",
    "/about",
    "/careers",
    "/odogwu_stankings",
    "/safety",
    "/contact",
    "/terms",
    "/privacy",
    "/moderation",
    "/disclaimer",
    "/cookies",
    "/blog",
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/blog" ? 0.75 : 0.7,
  }));

  for (const { city } of getHousesCityParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}`,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  for (const { city, neighborhood } of getHousesNeighborhoodParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}/${neighborhood}`,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  for (const { city, neighborhood, propertyType } of getHousesPropertyTypeParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}/${neighborhood}/${propertyType}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const slug of getAllBlogSlugs()) {
    entries.push({
      url: `${SITE_URL}/blog/${slug}`,
      changeFrequency: "monthly",
      priority: 0.72,
    });
  }

  return entries;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  if (id === 0) return mainSitemapEntries();

  const ids = await getSitemapPropertyIds(MAX_PROPERTY_URLS);
  const chunkIndex = id - 1;
  const slice = ids.slice(
    chunkIndex * PROPERTY_CHUNK_SIZE,
    (chunkIndex + 1) * PROPERTY_CHUNK_SIZE
  );

  return slice.map((propertyId) => ({
    url: `${SITE_URL}/properties/${propertyId}`,
    changeFrequency: "daily",
    priority: 0.82,
  }));
}
