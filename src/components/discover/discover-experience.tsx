"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import type { Property } from "@/types/database";
import { DiscoverDeck, type DiscoverSwipeAction } from "@/components/discover/discover-deck";
import { DiscoverEmpty } from "@/components/discover/discover-empty";
import { DiscoverFilters } from "@/components/discover/discover-filters";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import { buildDiscoverFeed } from "@/lib/discover/feed";
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilterState,
} from "@/lib/discover/filters";
import {
  getBrowsePreferences,
  syncBrowseFromRecentSearches,
  trackSavedListing,
  trackViewedListing,
} from "@/lib/browse-preferences";
import {
  continueBrowsingHint,
  getSwipeMemory,
  resolveSwipeResumeIndex,
  saveSwipeMemory,
} from "@/lib/swipe/memory";
import { preloadUpcomingSwipeCards } from "@/lib/swipe/preload";
import { recordSwipePace, recordCardDwell } from "@/lib/swipe/motion-timing";
import {
  trackSwipeSkip,
  trackSwipeSave,
  trackSwipeDwell,
  trackSwipeListingOpen,
} from "@/lib/swipe/analytics";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { recordEngagementSave } from "@/lib/engagement";
import {
  isGuestFavorite,
  toggleGuestFavorite,
} from "@/lib/guest-favorites";
import { isDemoProperty } from "@/lib/mock-listings";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { listingPath } from "@/lib/marketplace/listing-path";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { cn } from "@/lib/utils";

type Props = {
  properties: Property[];
  vehicles: Property[];
};

export function DiscoverExperience({ properties, vehicles }: Props) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const { user, guardAction, isListingSaved, setListingSaved } = useAuth();
  const [filters, setFilters] = useState<DiscoverFilterState>(() => ({
    ...DEFAULT_DISCOVER_FILTERS,
    category: vehiclesOn ? "vehicle" : "property",
  }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feed, setFeed] = useState<Property[]>([]);
  const [index, setIndex] = useState(0);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [seed, setSeed] = useState(0);
  const cardEnteredAt = useRef(0);

  const rebuild = useCallback(
    (nextFilters: DiscoverFilterState) => {
      syncBrowseFromRecentSearches();
      const prefs = getBrowsePreferences();
      const next = buildDiscoverFeed(properties, vehicles, nextFilters, prefs);
      setFeed(next);
      const memory = getSwipeMemory();
      setResumeHint(continueBrowsingHint(memory));
      setIndex(resolveSwipeResumeIndex(next.map((p) => p.id), memory));
    },
    [properties, vehicles],
  );

  useEffect(() => {
    rebuild(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed forces full refresh
  }, [rebuild, filters, seed]);

  const count = feed.length;
  const current = count > 0 ? feed[Math.min(index, count - 1)] : undefined;
  const next = count > 1 ? feed[(index + 1) % count] : undefined;

  useEffect(() => {
    if (count === 0) return;
    preloadUpcomingSwipeCards(feed, index);
  }, [feed, index, count]);

  useEffect(() => {
    if (!current) return;
    cardEnteredAt.current = Date.now();
    saveSwipeMemory({
      listingId: current.id,
      index,
      city: current.city,
      area: current.area,
      propertyType: current.property_type,
      price: Number(current.price),
    });

    const demo = isDemoProperty(current.id);
    if (!demo) {
      if (!user?.id) {
        setSavedMap((m) => ({ ...m, [current.id]: isGuestFavorite(current.id) }));
      } else {
        setSavedMap((m) => ({
          ...m,
          [current.id]: isListingSaved(current.id),
        }));
      }
    }

    trackViewedListing(current.id, {
      city: current.city,
      area: current.area,
      listingType: current.listing_type,
      propertyType: current.property_type,
    });

    return () => {
      const dwell = Date.now() - cardEnteredAt.current;
      if (dwell > 600) {
        recordCardDwell(dwell);
        trackSwipeDwell({
          listing_id: current.id,
          city: current.city,
          area: current.area,
          dwell_ms: dwell,
        });
      }
    };
  }, [current, index, user?.id, isListingSaved]);

  const advance = useCallback(() => {
    recordSwipePace();
    setResumeHint(null);
    setIndex((i) => i + 1);
  }, []);

  const saveListing = useCallback(
    (property: Property) => {
      if (isDemoProperty(property.id)) return;
      if (savedMap[property.id]) return;

      setSavedMap((m) => ({ ...m, [property.id]: true }));
      trackSwipeSave({
        listing_id: property.id,
        city: property.city,
        area: property.area,
      });
      trackEvent("save_listing", {
        listing_id: property.id,
        city: property.city,
        source: "discover",
        placement: "discover",
      });

      if (!user?.id) {
        toggleGuestFavorite(property.id);
        recordEngagementSave();
        trackSavedListing(property.id, {
          city: property.city,
          area: property.area,
          listingType: property.listing_type,
          propertyType: property.property_type,
        });
        return;
      }

      guardAction(
        {
          type: "save",
          listingId: property.id,
          redirectPath: listingPath(property),
        },
        async () => {
          if (!isSupabaseConfigured()) return;
          const supabase = createClient();
          const {
            data: { user: u },
          } = await supabase.auth.getUser();
          if (!u) return;
          await supabase.from("favorites").upsert(
            { user_id: u.id, property_id: property.id },
            { onConflict: "user_id,property_id", ignoreDuplicates: true },
          );
          setListingSaved(property.id, true);
          recordEngagementSave();
          trackSavedListing(property.id, {
            city: property.city,
            area: property.area,
            listingType: property.listing_type,
            propertyType: property.property_type,
          });
        },
      );
    },
    [guardAction, savedMap, setListingSaved, user?.id],
  );

  const handleAction = useCallback(
    (action: DiscoverSwipeAction) => {
      if (!current) return;

      if (action === "skip") {
        trackSwipeSkip({
          listing_id: current.id,
          city: current.city,
          area: current.area,
          direction: "left",
        });
        advance();
        return;
      }

      if (action === "interested") {
        saveListing(current);
        advance();
        return;
      }

      if (action === "open") {
        trackSwipeListingOpen({
          listing_id: current.id,
          city: current.city,
          area: current.area,
        });
      }
    },
    [advance, current, saveListing],
  );

  const searchHref = useMemo(() => {
    if (filters.category === "vehicle") return "/vehicles";
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.state) params.set("state", filters.state);
    if (filters.deal === "sale") params.set("type", "sale");
    if (filters.deal === "rent") params.set("type", "rent");
    if (filters.featuredOnly) params.set("featured", "1");
    if (filters.verifiedOnly) params.set("verified", "1");
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }, [filters]);

  const exhausted = !current || index >= count;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#021433] lg:hidden">
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
            Yike
          </p>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Discover
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            aria-label="Open filters"
          >
            <Filter className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <Link
            href={searchHref}
            className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            aria-label="Search listings"
          >
            <Search className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </header>

      {vehiclesOn ? (
        <div className="relative z-20 mx-auto w-full max-w-sm shrink-0 px-4 pb-2">
          <MarketplaceCategoryToggle
            category={filters.category as HomeMarketplaceCategory}
            onChange={(category) =>
              setFilters((f) => ({
                ...f,
                category,
                deal: category === "vehicle" ? "" : f.deal,
              }))
            }
            compact
            tone="onDark"
          />
        </div>
      ) : null}

      {resumeHint ? (
        <p className="relative z-20 truncate px-4 pb-1 text-center text-[10px] font-semibold text-white/60">
          {resumeHint}
        </p>
      ) : null}

      <div
        className={cn(
          "relative mx-auto w-full max-w-lg flex-1 px-3 pb-[calc(var(--bottom-nav-stack)+0.5rem)] pt-1",
        )}
      >
        {exhausted ? (
          <DiscoverEmpty
            filters={filters}
            onRefresh={() => {
              setIndex(0);
              setSeed((s) => s + 1);
            }}
            onExpandRadius={() =>
              setFilters((f) => ({ ...f, city: "", state: "" }))
            }
            onIncreaseBudget={() =>
              setFilters((f) => ({
                ...f,
                maxBudget:
                  f.maxBudget == null
                    ? null
                    : Math.round(f.maxBudget * 1.35),
              }))
            }
          />
        ) : current ? (
          <DiscoverDeck
            key={current.id}
            property={current}
            nextProperty={next && next.id !== current.id ? next : undefined}
            saved={Boolean(savedMap[current.id])}
            onToggleSave={() => saveListing(current)}
            onAction={handleAction}
          />
        ) : null}
      </div>

      {!exhausted && count > 0 ? (
        <p className="pointer-events-none absolute bottom-[calc(var(--bottom-nav-stack)-0.15rem)] left-0 right-0 z-10 text-center text-[10px] font-semibold text-white/45">
          {Math.min(index + 1, count)} / {count} · ← skip · save → · ↑ open
        </p>
      ) : null}

      <DiscoverFilters
        open={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
