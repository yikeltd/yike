"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, MapPin, ChevronDown } from "lucide-react";
import { CONSUMER_ROUTES } from "@/lib/navigation/consumer-routes";
import type { Property } from "@/types/database";
import { DiscoverDeck, type DiscoverSwipeAction } from "@/components/discover/discover-deck";
import { DiscoverEmpty } from "@/components/discover/discover-empty";
import { DiscoverFilters } from "@/components/discover/discover-filters";
import { DiscoverCategoryRail } from "@/components/discover/discover-category-rail";
import { discoverHref } from "@/lib/discover/categories";
import {
  discoverLocationPillLabel,
  discoverStateScopeFromMarketplaceLocation,
} from "@/lib/discover/location-scope";
import {
  ensureMarketplaceLocationPersisted,
  getMarketplaceLocation,
} from "@/lib/marketplace-location/preference";
import { ShareButton } from "@/components/property/listing-share-menu";
import { buildDiscoverFeed } from "@/lib/discover/feed";
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilterState,
} from "@/lib/discover/filters";
import { resolveDiscoverEmptyReason } from "@/lib/discover/empty-state";
import {
  getBrowsePreferences,
  syncBrowseFromRecentSearches,
  trackSavedListing,
  trackViewedListing,
} from "@/lib/browse-preferences";
import {
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
import { listingPath, listingAbsoluteUrl } from "@/lib/marketplace/listing-path";

type Props = {
  properties: Property[];
  vehicles: Property[];
  electronics: Property[];
  initialFilters?: DiscoverFilterState;
};

export function DiscoverExperience({
  properties,
  vehicles,
  electronics,
  initialFilters,
}: Props) {
  const router = useRouter();
  const { user, guardAction, isListingSaved, setListingSaved } = useAuth();
  const [filters, setFilters] = useState<DiscoverFilterState>(() => ({
    ...DEFAULT_DISCOVER_FILTERS,
    ...initialFilters,
  }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [electronicsTypesOpen, setElectronicsTypesOpen] = useState(false);
  const [feed, setFeed] = useState<Property[]>([]);
  const [index, setIndex] = useState(0);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [seed, setSeed] = useState(0);
  const cardEnteredAt = useRef(0);

  const syncFiltersToUrl = useCallback(
    (nextFilters: DiscoverFilterState) => {
      const href = discoverHref({
        category: nextFilters.category,
        electronicsSub: nextFilters.electronicsSub,
      });
      const current = `${window.location.pathname}${window.location.search}`;
      if (href !== current) {
        router.replace(href, { scroll: false });
      }
    },
    [router],
  );

  const applyFilters = useCallback(
    (nextFilters: DiscoverFilterState) => {
      setFilters(nextFilters);
      syncFiltersToUrl(nextFilters);
    },
    [syncFiltersToUrl],
  );

  const rebuild = useCallback(
    (nextFilters: DiscoverFilterState) => {
      syncBrowseFromRecentSearches();
      const prefs = getBrowsePreferences();
      const next = buildDiscoverFeed(
        properties,
        vehicles,
        nextFilters,
        prefs,
        electronics,
      );
      setFeed(next);
      const memory = getSwipeMemory();
      setIndex(resolveSwipeResumeIndex(next.map((p) => p.id), memory));
    },
    [properties, vehicles, electronics],
  );

  useEffect(() => {
    if (!initialFilters) return;
    setFilters((prev) => ({
      ...prev,
      ...initialFilters,
    }));
  }, [initialFilters]);

  useEffect(() => {
    ensureMarketplaceLocationPersisted();
    const loc = getMarketplaceLocation();
    const scope = discoverStateScopeFromMarketplaceLocation(loc);
    if (!scope.state) return;
    setFilters((prev) => {
      if (prev.state || prev.city) return prev;
      return { ...prev, ...scope };
    });
  }, []);

  useEffect(() => {
    rebuild(filters);
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
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          );
          setListingSaved(property.id, true);
          recordEngagementSave();
          trackSavedListing(property.id, {
            city: property.city,
            area: property.area,
            listingType: property.listing_type,
            propertyType: property.property_type,
          });
        }
      );
    },
    [guardAction, savedMap, setListingSaved, user?.id]
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
    [advance, current, saveListing]
  );

  const showEmpty = count === 0 || index >= count;
  const emptyReason = resolveDiscoverEmptyReason(count, index);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-navy">
      {/* TOP OVERLAY BAR MATCHING REFERENCE IMAGE EXACTLY */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-navy/90 via-navy/50 to-transparent">
        {/* Left: YIKE eyebrow + Discover Title */}
        <div className="flex flex-col text-left">
          <Link
            href={CONSUMER_ROUTES.home}
            className="text-[10px] font-black uppercase tracking-[0.18em] text-gold hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm"
          >
            YIKE
          </Link>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
            Discover
          </h1>
        </div>

        {/* Center: Current Location Selector Pill */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="pressable inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm active:scale-95"
        >
          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {discoverLocationPillLabel(filters)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/70 shrink-0" />
        </button>

        {/* Right: Share Button & Filter Icon Button (NO HEART / NO SAVE BUTTON) */}
        <div className="flex items-center gap-2">
          <ShareButton
            title={current?.title || "Discover listing on Yike"}
            text={current?.title || "Check out this listing on Yike"}
            url={current ? listingAbsoluteUrl(current) : "https://yike.ng/discover"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md shadow-sm active:scale-95"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md shadow-sm active:scale-95"
            aria-label="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <DiscoverCategoryRail
        filters={filters}
        onChange={(next) => {
          if (next.category !== "electronics") {
            setElectronicsTypesOpen(false);
          }
          applyFilters(next);
        }}
        electronicsTypesOpen={
          electronicsTypesOpen || Boolean(filters.electronicsSub)
        }
        onToggleElectronicsTypes={() =>
          setElectronicsTypesOpen((open) => !open)
        }
      />

      {/* FULL BLEED CARD STACK */}
      <div className="relative h-full w-full">
        {showEmpty ? (
          <div className="h-full pt-[calc(max(3.75rem,env(safe-area-inset-top))+5.5rem)]">
            <DiscoverEmpty
              reason={emptyReason}
              filters={filters}
              onRefresh={() => {
                setIndex(0);
                setSeed((s) => s + 1);
              }}
              onClearFilters={() => {
                setIndex(0);
                applyFilters({ ...DEFAULT_DISCOVER_FILTERS });
              }}
              onBrowseAllCategories={() => {
                setIndex(0);
                applyFilters({
                  ...filters,
                  category: "all",
                  electronicsSub: "",
                });
              }}
              onExpandRadius={() => {
                setIndex(0);
                applyFilters({ ...filters, city: "", state: "" });
              }}
              onIncreaseBudget={() => {
                setIndex(0);
                applyFilters({
                  ...filters,
                  maxBudget:
                    filters.maxBudget == null
                      ? null
                      : Math.round(filters.maxBudget * 1.35),
                });
              }}
            />
          </div>
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

      <DiscoverFilters
        open={filtersOpen}
        filters={filters}
        onChange={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
