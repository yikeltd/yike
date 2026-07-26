"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Mic } from "lucide-react";
import {
  buildSearchHref,
  getSmartSearchSuggestions,
  parseSmartSearchQuery,
  type SearchSuggestion,
  type SmartSearchResult,
} from "@/lib/smart-search";
import {
  addRecentSearch,
  getRecentSearches,
  TRENDING_AREAS,
} from "@/lib/search-recent";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import {
  getMarketplaceLocation,
  resolveCityCentroid,
  setMarketplaceLocation,
} from "@/lib/marketplace-location";
import { trackEvent } from "@/lib/analytics";
import { parseHomeCategory } from "@/lib/home/marketplace-category";
import { VEHICLE_MAKES } from "@/lib/marketplace/vehicle-makes";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { allowNetworkAction } from "@/lib/pwa/offline-ui";
import { cn } from "@/lib/utils";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";

function matchVehicleMake(text: string): string | null {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  const exact = VEHICLE_MAKES.find((m) => m.toLowerCase() === q);
  if (exact) return exact;
  const starts = VEHICLE_MAKES.find((m) => m.toLowerCase().startsWith(q));
  return starts ?? null;
}

/** Prefer explicit query location; else inherit marketplace scope. */
function withMarketplaceLocation(parsed: SmartSearchResult): SmartSearchResult {
  if (parsed.city || parsed.state) return parsed;
  const loc = getMarketplaceLocation();
  if (!loc?.city && !loc?.state) return parsed;
  return {
    ...parsed,
    ...(loc.city ? { city: loc.city } : {}),
    ...(loc.state ? { state: loc.state } : {}),
    ...(loc.area ? { area: loc.area } : {}),
  };
}

type Props = {
  /** Larger bar for marketplace top nav. */
  size?: "default" | "large";
  /** Home navy chrome vs elevated surfaces. */
  tone?: "default" | "hero" | "desktop";
  className?: string;
  placement?: string;
  /** Placeholder copy — presentation only. */
  placeholder?: string;
  /** Embed location selector inside the search surface. */
  showLocation?: boolean;
  /** Show disabled mic affordance (no voice engine in this task). */
  showMic?: boolean;
};

/**
 * Universal marketplace search — routes to /search or /vehicles when
 * category=vehicle (home) or the query matches a known vehicle make.
 */
export function HeaderUniversalSearch({
  size = "default",
  tone = "default",
  className,
  placement = "header_universal",
  placeholder = "Search cars, houses…",
  showLocation = false,
  showMic = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const homeCategory =
    pathname === "/" ? parseHomeCategory(searchParams.get("category")) : null;
  const preferVehicles = vehiclesOn && homeCategory === "vehicle";

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSuggestions = useCallback((value: string) => {
    setSuggestions(
      getSmartSearchSuggestions(value, {
        recent: getRecentSearches(),
        trending: TRENDING_AREAS,
      }),
    );
  }, []);

  useEffect(() => {
    if (open) refreshSuggestions(query);
  }, [open, query, refreshSuggestions]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function vehicleHref(text: string): string {
    const make = matchVehicleMake(text);
    if (make) {
      const params = new URLSearchParams({ make });
      return `/vehicles?${params.toString()}`;
    }
    const trimmed = text.trim();
    if (trimmed) {
      return `/vehicles?q=${encodeURIComponent(trimmed)}`;
    }
    return "/vehicles";
  }

  function commitSearch(text: string) {
    if (!allowNetworkAction()) return;
    const trimmed = text.trim();
    const rawParsed = parseSmartSearchQuery(text);
    const makeHit =
      vehiclesOn && (rawParsed.make || matchVehicleMake(trimmed));

    // Explicit city/state in query → switch marketplace location context
    if (rawParsed.switchesLocation && (rawParsed.city || rawParsed.state)) {
      const city = rawParsed.city ?? rawParsed.state!;
      const state = rawParsed.state ?? "";
      const centroid = resolveCityCentroid(city, state || undefined);
      setMarketplaceLocation({
        state: state || centroid?.state || "",
        city,
        area: rawParsed.area,
        lat: centroid?.lat,
        lng: centroid?.lng,
        source: "search",
      });
    }

    // Inherit marketplace location when the query does not name a place
    const parsed = withMarketplaceLocation(rawParsed);

    if (
      preferVehicles ||
      parsed.vertical === "vehicle" ||
      (vehiclesOn && makeHit)
    ) {
      const href =
        parsed.vertical === "vehicle" || parsed.make || parsed.body_type
          ? buildSearchHref(pathname, parsed)
          : (() => {
              const base = vehicleHref(trimmed);
              if (parsed.city || parsed.state) {
                const u = new URL(base, "https://yike.ng");
                if (parsed.city) u.searchParams.set("city", parsed.city);
                if (parsed.state) u.searchParams.set("state", parsed.state);
                return `${u.pathname}?${u.searchParams.toString()}`;
              }
              return base;
            })();
      const label =
        parsed.resolvedLabel ??
        (typeof makeHit === "string" ? makeHit : trimmed) ??
        "Vehicles";
      addRecentSearch({ label, href });
      trackEvent("search", {
        placement,
        listing_type: "vehicle",
        q: trimmed || undefined,
        city: parsed.city,
      });
      setOpen(false);
      setQuery("");
      router.push(href);
      return;
    }

    const href = buildSearchHref(pathname, parsed);
    const label = parsed.resolvedLabel ?? (trimmed || "All Nigeria");

    saveBrowsePreferences({
      city: parsed.city,
      area: parsed.area,
      listingType: parsed.listing_type,
      propertyType: parsed.property_type,
      minPrice: parsed.min_price,
      maxPrice: parsed.max_price,
    });

    addRecentSearch({ label, href });
    trackEvent("search", {
      city: parsed.city,
      area: parsed.area,
      placement,
      q: trimmed || undefined,
    });

    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onSelect(s: SearchSuggestion) {
    if (!allowNetworkAction()) return;
    if (s.kind === "location") {
      const centroid = resolveCityCentroid(s.match.city, s.match.state);
      setMarketplaceLocation({
        state: s.match.state,
        city: s.match.city,
        area: s.match.area !== s.match.city ? s.match.area : undefined,
        lat: centroid?.lat,
        lng: centroid?.lng,
        source: "search",
      });

      if (preferVehicles) {
        const href = `/vehicles?city=${encodeURIComponent(s.match.city)}`;
        addRecentSearch({ label: s.match.label, href });
        setOpen(false);
        setQuery("");
        router.push(href);
        return;
      }
      const parsed = parseSmartSearchQuery(
        `${query} ${s.match.area}`.trim() || s.match.label,
      );
      parsed.city = s.match.city;
      parsed.area = s.match.area;
      parsed.state = s.match.state;
      parsed.resolvedLabel = s.match.label;
      const href = buildSearchHref(pathname, parsed);
      addRecentSearch({ label: s.match.label, href });
      saveBrowsePreferences({ city: s.match.city, area: s.match.area });
      setOpen(false);
      setQuery("");
      router.push(href);
      return;
    }
    if (s.kind === "recent" || s.kind === "trending") {
      setOpen(false);
      setQuery("");
      router.push(s.href);
      return;
    }
    commitSearch(s.query);
  }

  const isLarge = size === "large";
  const isHero = tone === "hero";
  const isDesktop = tone === "desktop";

  return (
    <div ref={wrapRef} className={cn("relative min-w-0 flex-1", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border transition-all duration-200",
          isHero &&
            "border-white/15 bg-[#f4f6fa]/95 shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
          isDesktop &&
            "border-navy/8 bg-white shadow-[0_1px_3px_rgba(3,27,78,0.06),0_8px_24px_-12px_rgba(3,27,78,0.12)] hover:shadow-[0_2px_8px_rgba(3,27,78,0.08),0_12px_28px_-12px_rgba(3,27,78,0.14)]",
          !isHero &&
            !isDesktop &&
            "border-navy/8 bg-white shadow-[0_1px_3px_rgba(3,27,78,0.06),0_6px_18px_-10px_rgba(3,27,78,0.12)]",
          open && "border-gold/45 shadow-glow-gold ring-2 ring-gold/15",
        )}
      >
        <Search
          className={cn(
            "ml-3.5 shrink-0 text-navy/40",
            isLarge ? "h-[18px] w-[18px]" : "h-4 w-4",
          )}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            refreshSuggestions(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSearch(query);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-0 text-navy outline-none placeholder:text-navy/40",
            isLarge ? "h-12 text-[15px]" : "h-10 text-sm",
            query || showLocation || showMic ? "pr-1" : "pr-3",
          )}
          aria-label={placeholder}
          aria-expanded={open}
          aria-controls="header-universal-suggestions"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="pressable rounded-full p-1.5 text-muted transition-colors duration-150 hover:bg-navy/[0.06]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {(showLocation || showMic) && (
          <div className="mr-1.5 flex shrink-0 items-center gap-0.5">
            {showLocation ? (
              <>
                <span
                  className="mx-0.5 hidden h-5 w-px bg-navy/10 sm:block"
                  aria-hidden
                />
                <Suspense
                  fallback={
                    <span
                      className={cn(
                        "inline-block shrink-0",
                        isLarge ? "h-8 w-16" : "h-7 w-14",
                      )}
                      aria-hidden
                    />
                  }
                >
                  <MarketplaceLocationIndicator
                    size={isLarge ? "md" : "sm"}
                    variant="embedded"
                  />
                </Suspense>
              </>
            ) : null}
            {showMic ? (
              <>
                <span className="mx-0.5 h-5 w-px bg-navy/10" aria-hidden />
                <button
                  type="button"
                  disabled
                  title="Voice search coming soon"
                  aria-label="Voice search (coming soon)"
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full text-navy/35",
                    isLarge ? "h-9 w-9" : "h-8 w-8",
                  )}
                >
                  <Mic className={isLarge ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div
        id="header-universal-suggestions"
        className={cn(
          "absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-surface bg-elevated shadow-float-lg transition-all duration-200 origin-top",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-[0.98] opacity-0",
        )}
      >
        <ul className="max-h-[min(60dvh,320px)] overflow-y-auto py-1">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">
              Type a city, area, make, or property type
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li key={`${s.kind}-${i}`}>
                <button
                  type="button"
                  onClick={() => onSelect(s)}
                  className="pressable flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-gold/10"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <span className="truncate">{s.label}</span>
                  {s.kind === "trending" ? (
                    <span className="ml-auto text-[10px] font-bold uppercase text-gold-dark">
                      Hot
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
