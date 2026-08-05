"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Sparkles, Building2, Car, MapPin, User, SlidersHorizontal, Bookmark } from "lucide-react";
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
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import { SearchContextFilters } from "./search-context-filters";
import { SavedSearchesManager } from "./saved-searches-manager";

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
  size?: "default" | "large";
  tone?: "default" | "hero" | "desktop";
  className?: string;
  placement?: string;
  placeholder?: string;
  showLocation?: boolean;
  showLogo?: boolean;
};

export function HeaderUniversalSearch({
  size = "default",
  tone = "default",
  className,
  placement = "header_universal",
  placeholder = 'Try "3 bed duplex in Lekki under ₦250m" or "Toyota Corolla"',
  showLocation = false,
  showLogo = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const homeCategory =
    pathname === "/" ? parseHomeCategory(searchParams.get("category")) : null;

  const [activeTab, setActiveTab] = useState<"all" | "property" | "vehicle" | "land" | "agent">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
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

  function commitSearch(text: string) {
    if (!allowNetworkAction()) return;
    const trimmed = text.trim();
    const rawParsed = parseSmartSearchQuery(text);

    if (activeTab !== "all") {
      rawParsed.vertical = activeTab;
    }

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

    const parsed = withMarketplaceLocation(rawParsed);
    const href = buildSearchHref(pathname, parsed);
    const label = parsed.resolvedLabel ?? (trimmed || "Search Results");

    addRecentSearch({ label, href });
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

      const parsed = parseSmartSearchQuery(`${query} ${s.match.area}`.trim() || s.match.label);
      if (activeTab !== "all") parsed.vertical = activeTab;
      parsed.city = s.match.city;
      parsed.area = s.match.area;
      parsed.state = s.match.state;
      parsed.resolvedLabel = s.match.label;
      const href = buildSearchHref(pathname, parsed);
      addRecentSearch({ label: s.match.label, href });
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

  function handleApplyFilters(filterParams: Record<string, string>) {
    const qs = new URLSearchParams(filterParams);
    const targetPath = filterParams.vertical === "vehicle" ? "/vehicles" : filterParams.vertical === "agent" ? "/agents" : "/search";
    router.push(`${targetPath}?${qs.toString()}`);
  }

  const isLarge = size === "large";
  const isHero = tone === "hero";
  const isDesktop = tone === "desktop";

  return (
    <>
      <div ref={wrapRef} className={cn("relative min-w-0 flex-1 space-y-1.5", className)}>
        


        {/* SEARCH INPUT BAR */}
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
          {showLogo ? (
            <Link
              href="/"
              className={cn(
                "ml-2 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                isLarge ? "p-0.5" : "p-0.5",
              )}
              aria-label="Yike home"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={brand.logoSm}
                alt=""
                width={isLarge ? 28 : 26}
                height={isLarge ? 28 : 26}
                className="rounded-md"
                priority
              />
            </Link>
          ) : (
            <Search
              className={cn(
                "ml-3.5 shrink-0 text-navy/40",
                isLarge ? "h-[18px] w-[18px]" : "h-4 w-4",
              )}
              aria-hidden
            />
          )}
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
              isLarge ? "h-11 text-[14px]" : "h-10 text-sm",
              query || showLocation ? "pr-1" : "pr-3",
              showLogo && "pl-1",
            )}
            aria-label={placeholder}
            aria-expanded={open}
            aria-controls="header-universal-suggestions"
          />

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pressable p-2 text-navy/60 hover:text-navy"
            title="Open Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

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

          {showLocation ? (
            <div className="mr-1.5 flex shrink-0 items-center">
              <span className="mx-0.5 h-5 w-px bg-navy/10" aria-hidden />
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
            </div>
          ) : null}
        </div>

        {/* SUGGESTIONS DROPDOWN */}
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
                Type a city, area, vehicle make, or property type
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

      {/* FILTER DRAWER */}
      {filtersOpen && (
        <SearchContextFilters
          activeVertical={activeTab}
          onApply={handleApplyFilters}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {/* SAVED SEARCHES DRAWER */}
      {savedDrawerOpen && (
        <SavedSearchesManager
          isOpen={savedDrawerOpen}
          onClose={() => setSavedDrawerOpen(false)}
        />
      )}
    </>
  );
}
