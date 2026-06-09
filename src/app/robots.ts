import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/houses/",
        "/blog/",
        "/search",
        "/browse",
        "/properties/",
        "/agents/",
        "/rent",
        "/buy",
        "/shortlet",
        "/land",
        "/explore",
      ],
      disallow: [
        "/lex/",
        "/agent/",
        "/ambassador",
        "/auth/",
        "/api/",
        "/legal-partner",
        "/offline",
        "/profile",
        "/saved",
        "/staff",
        "/verifier",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
