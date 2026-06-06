"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  buildSearchHref,
  getSmartSearchSuggestions,
  parseSmartSearchQuery,
  type SearchSuggestion,
} from "@/lib/smart-search";
import { addRecentSearch, getRecentSearches, TRENDING_AREAS } from "@/lib/search-recent";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function HeaderMobileSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSuggestions = useCallback(
    (value: string) => {
      setSuggestions(
        getSmartSearchSuggestions(value, {
          recent: getRecentSearches(),
          trending: TRENDING_AREAS,
        })
      );
    },
    []
  );

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
    const parsed = parseSmartSearchQuery(text);
    const href = buildSearchHref(pathname, parsed);
    const label = parsed.resolvedLabel ?? (text.trim() || "All Nigeria");

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
      placement: "header_mobile",
      q: text.trim() || undefined,
    });

    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onSelect(s: SearchSuggestion) {
    if (s.kind === "location") {
      const parsed = parseSmartSearchQuery(
        `${query} ${s.match.area}`.trim() || s.match.label
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

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border bg-navy/[0.04] transition-all duration-200 dark:bg-surface/90",
          open
            ? "border-gold/50 shadow-glow-gold ring-2 ring-gold/20"
            : "border-navy/10 shadow-sm dark:border-surface"
        )}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted" aria-hidden />
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
          placeholder="2 bed in Aba, self contain Ogbor Hill…"
          className="h-9 min-w-0 flex-1 bg-transparent py-0 pr-2 text-sm text-foreground outline-none placeholder:text-muted/80"
          aria-label="Search homes"
          aria-expanded={open}
          aria-controls="header-search-suggestions"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="pressable mr-2 rounded-full p-1 text-muted"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        id="header-search-suggestions"
        className={cn(
          "absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-surface bg-elevated shadow-float-lg transition-all duration-200 origin-top",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-[0.98] opacity-0"
        )}
      >
        <ul className="max-h-[min(60dvh,320px)] overflow-y-auto py-1">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">Type a city, area, or property type</li>
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
                  {s.kind === "trending" && (
                    <span className="ml-auto text-[10px] font-bold uppercase text-gold-dark">
                      Hot
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
