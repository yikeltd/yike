"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  buildSearchHref,
  getSmartSearchSuggestions,
  parseSmartSearchQuery,
  smartSearchToUrlParams,
  type SearchSuggestion,
  type SmartSearchResult,
} from "@/lib/smart-search";
import {
  addRecentSearch,
  getRecentSearches,
  TRENDING_AREAS,
} from "@/lib/search-recent";
import {
  getMarketplaceLocation,
  resolveCityCentroid,
  setMarketplaceLocation,
} from "@/lib/marketplace-location";
import { parseHomeCategory } from "@/lib/home/marketplace-category";
import { allowNetworkAction } from "@/lib/pwa/offline-ui";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import { SearchContextFilters } from "./search-context-filters";
import {
  buildSmartFilterHref,
  type FilterVertical,
} from "@/lib/search/smart-filter-engine";
import type { SmartFilterFormState } from "@/lib/search/smart-filter-engine";

type Props = {
  size?: "default" | "large";
  tone?: "default" | "hero" | "desktop";
  layout?: "default" | "unified";
  className?: string;
  placement?: string;
  placeholder?: string;
  showLocation?: boolean;
  showLogo?: boolean;
};

function homeCategoryToFilterVertical(
  cat: ReturnType<typeof parseHomeCategory>,
): FilterVertical | null {
  if (cat === "vehicle") return "vehicle";
  if (cat === "property") return "property";
  if (cat === "electronics") return "electronics";
  return null;
}

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

export function HeaderUniversalSearch({
  size = "default",
  tone = "default",
  layout = "default",
  className,
  placement = "header_universal",
  placeholder = 'Try "3 bed duplex in Lekki under ₦250m" or "Toyota Corolla"',
  showLocation = false,
  showLogo = false,
}: Props) {
  void placement;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeCategory =
    pathname === "/" ? parseHomeCategory(searchParams.get("category")) : null;
  const homeVertical = homeCategory ? homeCategoryToFilterVertical(homeCategory) : null;

  const isUnified = layout === "unified";
  const unifiedLogo = isUnified || showLogo;
  const unifiedLocation = isUnified || showLocation;

  const [activeTab, setActiveTab] = useState<FilterVertical>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/vehicles")) setActiveTab("vehicle");
    else if (pathname.startsWith("/electronics")) setActiveTab("electronics");
    else if (pathname.startsWith("/agents")) setActiveTab("agent");
    else if (pathname.startsWith("/search")) {
      if (searchParams.get("hub") === "land_sale") setActiveTab("land");
      else setActiveTab("all");
    } else if (homeVertical) setActiveTab(homeVertical);
  }, [pathname, homeVertical, searchParams]);

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

  function resolveVerticalTab(): FilterVertical | undefined {
    if (homeVertical) return homeVertical;
    if (activeTab !== "all") return activeTab;
    return undefined;
  }

  function commitSearch(text: string) {
    if (!allowNetworkAction()) return;
    const trimmed = text.trim();
    const rawParsed = parseSmartSearchQuery(text);
    const verticalTab = resolveVerticalTab();
    if (verticalTab === "vehicle") rawParsed.vertical = "vehicle";
    else if (verticalTab === "property" || verticalTab === "land")
      rawParsed.vertical = verticalTab === "land" ? "land" : "property";
    else if (verticalTab === "electronics") rawParsed.vertical = "electronics";
    else if (verticalTab === "agent") rawParsed.vertical = "agent";

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
    if (trimmed && !parsed.q) parsed.q = trimmed;

    let href = buildSearchHref(pathname, parsed);
    if (pathname === "/" && homeCategory) {
      const params = smartSearchToUrlParams(parsed);
      const qs = params.toString();
      if (homeCategory === "vehicle") {
        href = qs ? `/vehicles?${qs}` : "/vehicles";
      } else if (homeCategory === "electronics") {
        href = qs ? `/electronics?${qs}` : "/electronics";
      } else {
        href = qs ? `/search?${qs}` : "/search";
      }
    }

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
      const verticalTab = resolveVerticalTab();
      if (verticalTab === "vehicle") parsed.vertical = "vehicle";
      else if (verticalTab === "electronics") parsed.vertical = "electronics";
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

  function handleApplyFilters(filters: SmartFilterFormState) {
    setActiveTab(filters.vertical);
    if (filters.q?.trim()) {
      setQuery("");
    }
    const href = buildSmartFilterHref(filters);
    router.push(href);
  }

  const isLarge = size === "large";
  const isHero = tone === "hero";
  const isDesktop = tone === "desktop";

  return (
    <>
      <div
        ref={wrapRef}
        className={cn(
          "relative space-y-1.5",
          isUnified ? "w-full min-w-0" : "min-w-0 flex-1",
          className,
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-0.5 rounded-full border transition-all duration-200 sm:gap-1",
            isHero &&
              "border-white/15 bg-[#f4f6fa]/95 shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
            isDesktop &&
              "border-navy/8 bg-white shadow-[0_1px_3px_rgba(3,27,78,0.06),0_8px_24px_-12px_rgba(3,27,78,0.12)]",
            !isHero &&
              !isDesktop &&
              "border-navy/8 bg-white shadow-[0_1px_3px_rgba(3,27,78,0.06),0_6px_18px_-10px_rgba(3,27,78,0.12)]",
            open && "border-gold/45 shadow-glow-gold ring-2 ring-gold/15",
            isUnified && "gap-1 px-1 py-0.5 sm:gap-1.5 sm:px-1.5",
          )}
        >
          {unifiedLogo ? (
            <Link
              href="/"
              className="shrink-0 rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label="Yike home"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={brand.logoSm}
                alt={brand.logoAlt}
                width={isLarge ? 30 : 28}
                height={isLarge ? 30 : 28}
                className="h-7 w-7 rounded-md sm:h-7.5 sm:w-7.5"
                priority
              />
            </Link>
          ) : (
            <Search
              className={cn(
                "ml-2 shrink-0 text-navy/40 sm:ml-3.5",
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
              isUnified ? "h-9 text-xs sm:h-10 sm:text-sm" : isLarge ? "h-11 text-[14px]" : "h-10 text-sm",
            )}
            aria-label={placeholder}
            aria-expanded={open}
            aria-controls="header-universal-suggestions"
          />

          <button
            type="button"
            onClick={() => commitSearch(query)}
            className="pressable shrink-0 rounded-full p-1.5 text-navy/50 hover:bg-navy/5 hover:text-navy sm:p-2"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="pressable shrink-0 rounded-full p-1.5 text-muted hover:bg-navy/[0.06]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pressable shrink-0 p-1.5 text-navy/60 hover:text-navy sm:p-2"
            title="Open Filters"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {unifiedLocation ? (
            <div className="mr-0.5 flex shrink-0 items-center sm:mr-1">
              <span className="mx-0.5 hidden h-5 w-px bg-navy/10 sm:block" aria-hidden />
              <Suspense
                fallback={
                  <span className="inline-block h-7 w-12 shrink-0 rounded-full bg-navy/5 sm:w-14" aria-hidden />
                }
              >
                <MarketplaceLocationIndicator
                  size={isLarge ? "md" : "sm"}
                  variant="embedded"
                  className="max-w-[5.5rem] sm:max-w-none"
                />
              </Suspense>
            </div>
          ) : null}
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
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {filtersOpen ? (
        <SearchContextFilters
          activeVertical={activeTab}
          onApply={handleApplyFilters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
