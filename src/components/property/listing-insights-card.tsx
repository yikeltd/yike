"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, ShieldCheck, RefreshCw, MapPin, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import type { ListingInsightSignal } from "@/lib/listing-history/summary";

const ICONS: Record<string, typeof Clock> = {
  listed_age: Clock,
  price_changes: TrendingUp,
  physical_review: ShieldCheck,
  legal_review: ShieldCheck,
  reactivated: RefreshCw,
  availability_confirmed: RefreshCw,
  neighborhood: MapPin,
  viewed_recently: Eye,
};

function iconFor(key: string) {
  if (key.startsWith("agent_")) return ShieldCheck;
  return ICONS[key] ?? Clock;
}

export function ListingInsightsCard({
  signals,
  listingId,
  className,
}: {
  signals: ListingInsightSignal[];
  listingId: string;
  className?: string;
}) {
  const [viewedLabel, setViewedLabel] = useState<string | null>(null);

  useEffect(() => {
    const recent = getRecentlyViewed().find((v) => v.id === listingId);
    if (!recent) return;
    const hours = (Date.now() - recent.viewedAt) / 3_600_000;
    if (hours <= 72) {
      setViewedLabel(hours < 1 ? "You viewed this recently" : "Viewed recently");
    }
  }, [listingId]);

  const merged: ListingInsightSignal[] = [...signals];
  if (viewedLabel && !merged.some((s) => s.key === "viewed_recently")) {
    merged.push({ key: "viewed_recently", label: viewedLabel, priority: 35 });
    merged.sort((a, b) => b.priority - a.priority);
  }

  const visible = merged.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-navy/5 bg-surface/50 px-3 py-2.5",
        className
      )}
      aria-label="Listing insights"
    >
      <ul className="space-y-1.5">
        {visible.map((signal) => {
          const Icon = iconFor(signal.key);
          return (
            <li
              key={signal.key}
              className="flex items-center gap-2 text-xs leading-snug text-muted"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
              <span>{signal.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
