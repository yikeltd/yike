import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/splash/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/store/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.yike.ng" }],
        destination: "https://yike.ng/:path*",
        permanent: true,
      },
      { source: "/home", destination: "/", permanent: true },
      { source: "/swipe-homes", destination: "/browse", permanent: true },
      { source: "/swipe", destination: "/browse", permanent: true },
      { source: "/list", destination: "/agent/become", permanent: true },
      { source: "/list-property", destination: "/agent/become", permanent: true },
      { source: "/request-home", destination: "/request-property", permanent: true },
      { source: "/cookie-policy", destination: "/cookies", permanent: true },
      { source: "/legal", destination: "/privacy", permanent: true },
      { source: "/support", destination: "/contact", permanent: true },
      {
        source: "/listing/:id",
        destination: "/properties/:id",
        permanent: true,
      },
      {
        source: "/property/:id",
        destination: "/properties/:id",
        permanent: true,
      },
      {
        source: "/areas/:city",
        destination: "/houses/:city",
        permanent: true,
      },
      {
        source: "/areas/:city/:neighborhood",
        destination: "/houses/:city/:neighborhood",
        permanent: true,
      },
      {
        source: "/areas/:city/:neighborhood/:propertyType",
        destination: "/houses/:city/:neighborhood/:propertyType",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/lex",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/lex/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
