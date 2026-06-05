import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getApprovedPropertyIds } from "@/lib/properties";
import { getSeoAreaPaths, getSeoCityPaths } from "@/lib/location-slugs";
import {
  getHousesCityParams,
  getHousesNeighborhoodParams,
  getHousesPropertyTypeParams,
} from "@/lib/seo/paths";
import { getAllBlogSlugs } from "@/constants/blogTopics";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/explore",
    "/rent",
    "/buy",
    "/shortlet",
    "/land",
    "/search",
    "/browse",
    "/post-property",
    "/request-property",
    "/verify-agent",
    "/about",
    "/safety",
    "/contact",
    "/terms",
    "/privacy",
    "/moderation",
    "/account/delete",
    "/disclaimer",
    "/cookies",
    "/saved",
    "/blog",
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/blog" ? 0.75 : 0.7,
  }));

  for (const { city } of getHousesCityParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.88,
    });
  }

  for (const { city, neighborhood } of getHousesNeighborhoodParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}/${neighborhood}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.82,
    });
  }

  for (const { city, neighborhood, propertyType } of getHousesPropertyTypeParams()) {
    entries.push({
      url: `${SITE_URL}/houses/${city}/${neighborhood}/${propertyType}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78,
    });
  }

  for (const slug of getAllBlogSlugs()) {
    entries.push({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.72,
    });
  }

  for (const { citySlug } of getSeoCityPaths()) {
    entries.push({
      url: `${SITE_URL}/${citySlug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const { citySlug, areaSlug } of getSeoAreaPaths()) {
    entries.push({
      url: `${SITE_URL}/${citySlug}/${areaSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
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
