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
    // Baseline launch CSP — compatible with Next App Router + Supabase media.
    // Tighten further post-launch with nonces once deploy is certified.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.sendchamp.com https://api.paystack.co https://*.paystack.co https://vitals.vercel-insights.com",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
      { source: "/list", destination: "/agent/verify", permanent: true },
      { source: "/list-property", destination: "/agent/verify", permanent: true },
      { source: "/agent/become", destination: "/agent/verify", permanent: false },
      { source: "/post-property", destination: "/agent/verify", permanent: false },
      { source: "/agent/pricing", destination: "/agent/plans", permanent: false },
      { source: "/plans", destination: "/agent/plans", permanent: false },
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
