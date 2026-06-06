/**
 * Foundation for future push/email alerts — relevance-first, no spam.
 * Does not send notifications; surfaces candidates for UI or cron later.
 */

import type { BrowsePreferences } from "@/lib/browse-preferences";

export type RetentionNotificationCandidate = {
  id: string;
  title: string;
  body: string;
  href: string;
  priority: "low" | "medium";
  kind: "new_area" | "price_drop" | "verified" | "return";
};

export function buildRetentionCandidates(
  prefs: BrowsePreferences,
  context?: {
    newListingsInArea?: number;
    city?: string;
    area?: string;
  }
): RetentionNotificationCandidate[] {
  const out: RetentionNotificationCandidate[] = [];
  const city = context?.city ?? prefs.cities[0];
  const area = context?.area ?? prefs.areas[0];

  if (area && (context?.newListingsInArea ?? 0) > 0) {
    out.push({
      id: `new-${area}`,
      title: `${context!.newListingsInArea} new rentals near ${area}`,
      body: `Fresh listings in ${area} — tap to browse.`,
      href: `/search?city=${encodeURIComponent(city ?? "")}&area=${encodeURIComponent(area)}`,
      priority: "medium",
      kind: "new_area",
    });
  } else if (city) {
    out.push({
      id: `return-${city}`,
      title: `Homes in ${city} for you`,
      body: "Pick up where you left off.",
      href: `/search?city=${encodeURIComponent(city)}`,
      priority: "low",
      kind: "return",
    });
  }

  if (city) {
    out.push({
      id: `verified-${city}`,
      title: `New verified homes in ${city}`,
      body: "Identity-checked agents only.",
      href: `/search?city=${encodeURIComponent(city)}&verified=1`,
      priority: "low",
      kind: "verified",
    });
  }

  return out.slice(0, 3);
}
