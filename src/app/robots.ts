import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/houses/", "/blog/", "/search", "/properties/"],
      disallow: [
        "/lex/",
        "/agent/",
        "/auth/",
        "/api/",
        "/offline",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
