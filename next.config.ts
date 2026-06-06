import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
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
    formats: ["image/webp"],
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
