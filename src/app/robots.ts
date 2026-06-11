import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
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
        "/intent/",
        "/dev/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
