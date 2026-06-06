"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight, Clock, Heart, X } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { getSavedSearches } from "@/lib/saved-searches";
import { getRecentSearches } from "@/lib/search-recent";
import { getBrowsePreferences } from "@/lib/browse-preferences";
import { getInferredLocation } from "@/lib/inferred-location";
import { ListingThumbCard } from "./listing-thumb-card";
import { prefetchListingImages } from "@/lib/image-prefetch";

const DISMISS_KEY = "yike_continue_dismissed_at";

function getContinueTitle(): string {
  const inferred = getInferredLocation();
  if (inferred.hasSignal && inferred.area && inferred.city) {
    return `New listings in ${inferred.area}`;
  }
  if (inferred.hasSignal && inferred.city) {
    return `Continue browsing homes in ${inferred.city}`;
  }
  const recent = getRecentSearches()[0];
  if (recent?.label) return `Homes near ${recent.label}`;
  return "Continue browsing";
}

function isDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    const prefs = getBrowsePreferences();
    return at > 0 && at >= (prefs.updatedAt ?? 0);
  } catch {
    return false;
  }
}

export function BrowseRail() {
  const [hidden, setHidden] = useState(false);
  const [recentViews, setRecentViews] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [savedSearches, setSavedSearches] = useState<ReturnType<typeof getSavedSearches>>([]);
  const [recentSearches, setRecentSearches] = useState<ReturnType<typeof getRecentSearches>>([]);

  useEffect(() => {
    setHidden(isDismissed());
    setRecentViews(getRecentlyViewed().slice(0, 8));
    setSavedSearches(getSavedSearches().slice(0, 4));
    setRecentSearches(getRecentSearches().slice(0, 4));
    prefetchListingImages(
      getRecentlyViewed()
        .slice(0, 4)
        .map((v) => v.image)
    );
  }, []);

  const title = useMemo(() => getContinueTitle(), []);

  const continueHref =
    recentSearches[0]?.href ??
    (getInferredLocation().city
      ? `/search?city=${encodeURIComponent(getInferredLocation().city!)}`
      : recentViews[0]
        ? `/properties/${recentViews[0].id}`
        : "/search");

  const hasChips =
    savedSearches.length > 0 ||
    recentSearches.length > 0 ||
    recentViews.length > 0;

  if (hidden || !hasChips) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  }

  return (
    <section className="mx-auto max-w-7xl px-3 lg:px-6 xl:px-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-sm font-bold text-foreground lg:text-base">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={continueHref}
            className="flex items-center gap-0.5 text-xs font-bold text-gold-dark hover:underline"
          >
            Resume
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="pressable rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="hide-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/saved"
          className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-elevated px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Heart className="h-3.5 w-3.5 text-gold" />
          Saved
        </Link>

        {savedSearches.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-elevated px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
          >
            <Bookmark className="h-3.5 w-3.5 text-navy" />
            {s.label}
          </Link>
        ))}

        {recentSearches
          .filter((s) => !savedSearches.some((x) => x.href === s.href))
          .map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-muted"
            >
              <Clock className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          ))}
      </div>

      {recentViews.length > 0 && (
        <>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted">
            Recently viewed
          </p>
          <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {recentViews.map((v, i) => (
              <ListingThumbCard
                key={v.id}
                href={`/properties/${v.id}`}
                title={v.title}
                image={v.image}
                subtitle={`${v.area} · ${v.priceLabel}`}
                priority={i < 2}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
