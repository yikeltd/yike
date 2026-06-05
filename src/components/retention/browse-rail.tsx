"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Clock, Heart, ChevronRight } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { getSavedSearches } from "@/lib/saved-searches";
import { getRecentSearches } from "@/lib/search-recent";

export function BrowseRail() {
  const [recentViews, setRecentViews] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [savedSearches, setSavedSearches] = useState<ReturnType<typeof getSavedSearches>>([]);
  const [recentSearches, setRecentSearches] = useState<ReturnType<typeof getRecentSearches>>([]);

  useEffect(() => {
    setRecentViews(getRecentlyViewed().slice(0, 6));
    setSavedSearches(getSavedSearches().slice(0, 4));
    setRecentSearches(getRecentSearches().slice(0, 4));
  }, []);

  const continueHref =
    recentViews[0]?.id
      ? `/properties/${recentViews[0].id}`
      : recentSearches[0]?.href ?? "/search";

  const hasContent =
    recentViews.length > 0 || savedSearches.length > 0 || recentSearches.length > 0;

  if (!hasContent) return null;

  return (
    <section className="mt-6 px-3 lg:px-0">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground lg:text-lg">
          Continue browsing
        </h2>
        <Link
          href={continueHref}
          className="flex items-center gap-0.5 text-xs font-bold text-gold-dark hover:underline"
        >
          Resume
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/saved"
          className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-elevated px-3 py-2.5 text-xs font-semibold text-foreground shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <Heart className="h-4 w-4 text-gold" />
          Saved listings
        </Link>

        {savedSearches.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-elevated px-3 py-2.5 text-xs font-semibold text-foreground shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
          >
            <Bookmark className="h-4 w-4 text-navy" />
            {s.label}
          </Link>
        ))}

        {recentSearches
          .filter((s) => !savedSearches.some((x) => x.href === s.href))
          .map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="pressable flex shrink-0 items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs font-semibold text-muted"
            >
              <Clock className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          ))}
      </div>

      {recentViews.length > 0 && (
        <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {recentViews.map((v) => (
            <Link
              key={v.id}
              href={`/properties/${v.id}`}
              className="pressable flex w-36 shrink-0 flex-col overflow-hidden rounded-xl bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <div
                className="aspect-[4/3] bg-surface bg-cover bg-center"
                style={{ backgroundImage: `url(${v.image})` }}
              />
              <div className="p-2">
                <p className="line-clamp-1 text-[11px] font-bold text-foreground">
                  {v.title}
                </p>
                <p className="text-[10px] text-muted">{v.priceLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
