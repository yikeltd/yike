import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getApprovedPropertyIds } from "@/lib/properties";
import { getSeoAreaPaths, getSeoCityPaths } from "@/lib/location-slugs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/search",
    "/post-property",
    "/verify-agent",
    "/about",
    "/safety",
    "/contact",
    "/saved",
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  for (const { citySlug } of getSeoCityPaths()) {
    entries.push({
      url: `${SITE_URL}/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    });
  }

  for (const { citySlug, areaSlug } of getSeoAreaPaths()) {
    entries.push({
      url: `${SITE_URL}/${citySlug}/${areaSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  const propertyIds = await getApprovedPropertyIds(120);
  for (const id of propertyIds) {
    entries.push({
      url: `${SITE_URL}/properties/${id}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}
