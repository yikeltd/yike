"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Property } from "@/types/database";
import { PropertyFeed } from "@/components/property/property-feed";
import { getSavedSearches, removeSavedSearch } from "@/lib/saved-searches";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { Bookmark, Clock, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "saved" | "searches" | "recent";

export function SavedHub({ properties }: { properties: Property[] }) {
  const [tab, setTab] = useState<Tab>("saved");
  const [searches, setSearches] = useState<ReturnType<typeof getSavedSearches>>([]);
  const [recent, setRecent] = useState<ReturnType<typeof getRecentlyViewed>>([]);

  useEffect(() => {
    setSearches(getSavedSearches());
    setRecent(getRecentlyViewed());
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
    { id: "saved", label: "Saved", icon: Heart },
    { id: "searches", label: "Searches", icon: Bookmark },
    { id: "recent", label: "Recent", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "pressable flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold",
              tab === id
                ? "bg-navy text-white"
                : "bg-surface text-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "saved" && (
        <PropertyFeed
          properties={properties}
          emptyMessage="No saved listings yet. Tap the heart on any home."
        />
      )}

      {tab === "searches" && (
        <div className="space-y-2">
          {searches.length === 0 ? (
            <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted">
              Save searches from the search page to revisit them quickly.
            </p>
          ) : (
            searches.map((s) => (
              <div
                key={s.href}
                className="flex items-center justify-between rounded-xl bg-elevated px-4 py-3 shadow-sm"
              >
                <Link href={s.href} className="font-semibold text-navy hover:text-gold-dark">
                  {s.label}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    removeSavedSearch(s.href);
                    setSearches(getSavedSearches());
                  }}
                  className="text-muted hover:text-red-600"
                  aria-label="Remove saved search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "recent" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {recent.length === 0 ? (
            <p className="col-span-full rounded-2xl bg-surface p-6 text-center text-sm text-muted">
              Homes you view will appear here for quick access.
            </p>
          ) : (
            recent.map((v) => (
              <Link
                key={v.id}
                href={`/properties/${v.id}`}
                className="pressable flex gap-3 rounded-xl bg-elevated p-3 shadow-sm"
              >
                <div
                  className="h-16 w-16 shrink-0 rounded-lg bg-surface bg-cover bg-center"
                  style={{ backgroundImage: `url(${v.image})` }}
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold text-navy">{v.title}</p>
                  <p className="text-xs text-muted">
                    {v.area}, {v.city}
                  </p>
                  <p className="text-xs font-semibold text-gold-dark">{v.priceLabel}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
