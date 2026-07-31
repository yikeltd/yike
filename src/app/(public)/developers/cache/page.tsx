import type { Metadata } from "next";
import { CachePerformanceDashboard } from "@/components/developers/cache-performance-dashboard";

export const metadata: Metadata = {
  title: "Redis Caching & Edge Performance Hub | Yike Developer Platform",
  description: "Multi-layer Redis cache zone management, pattern invalidations, global CDN POP edge latencies, and payload compression.",
};

export default function DeveloperCachePage() {
  return (
    <main>
      <CachePerformanceDashboard />
    </main>
  );
}
