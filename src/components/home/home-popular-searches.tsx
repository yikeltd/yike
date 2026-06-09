"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getBrowsePreferences } from "@/lib/browse-preferences";
import {
  buildHomePopularSearches,
  hasActiveHomeSearchContext,
  type HomePopularSearchContext,
} from "@/lib/home/popular-search-links";

type HomePopularSearchesProps = {
  initialContext: HomePopularSearchContext;
};

function contextFromParams(
  params: URLSearchParams,
  fallback: HomePopularSearchContext
): HomePopularSearchContext {
  return {
    listingType: params.get("type") ?? fallback.listingType,
    hub: params.get("hub") ?? fallback.hub,
    city: params.get("city") ?? fallback.city,
    area: params.get("area") ?? fallback.area,
  };
}

export function HomePopularSearches({ initialContext }: HomePopularSearchesProps) {
  const searchParams = useSearchParams();
  const [showAll, setShowAll] = useState(false);
  const [prefCity, setPrefCity] = useState<string | undefined>();

  useEffect(() => {
    const prefs = getBrowsePreferences();
    if (prefs.cities[0]) setPrefCity(prefs.cities[0]);
  }, []);

  const urlContext = useMemo(
    () => contextFromParams(searchParams, initialContext),
    [searchParams, initialContext]
  );

  const contextual = hasActiveHomeSearchContext(urlContext);

  const linkContext = useMemo(() => {
    if (urlContext.city) return urlContext;
    if (hasActiveHomeSearchContext(urlContext)) return urlContext;
    if (prefCity) return { ...urlContext, city: prefCity };
    return urlContext;
  }, [urlContext, prefCity]);

  const { title, description, primary, extra } = useMemo(
    () => buildHomePopularSearches(linkContext),
    [linkContext]
  );

  const [open, setOpen] = useState(contextual);

  useEffect(() => {
    if (contextual) setOpen(true);
  }, [contextual]);

  useEffect(() => {
    setShowAll(false);
  }, [linkContext.listingType, linkContext.hub, linkContext.city, linkContext.area]);

  const visible = showAll ? [...primary, ...extra] : primary;
  const hasMore = !showAll && extra.length > 0;

  if (!open) {
    return (
      <section className="mx-auto max-w-7xl px-3 pb-4 pt-2 lg:px-6 xl:px-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pressable flex w-full items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-elevated/80 px-4 py-3 text-left shadow-sm ring-1 ring-navy/[0.06]"
        >
          <span className="text-sm font-semibold text-foreground">
            Browse popular property searches
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-6 lg:px-6 xl:px-8">
      <div className="border-t border-navy/10 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground lg:text-xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted lg:text-sm">
              {description}
            </p>
          </div>
          {!contextual ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="pressable shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
            >
              Hide
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="pressable rounded-full bg-elevated px-3.5 py-2 text-xs font-bold text-foreground shadow-sm ring-1 ring-navy/10 transition-colors hover:bg-gold/10"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {hasMore ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="pressable mt-3 text-xs font-bold text-gold-dark hover:underline"
          >
            Show more areas & cities
          </button>
        ) : null}
      </div>
    </section>
  );
}
