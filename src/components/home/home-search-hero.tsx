"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BUDGET_RANGES,
  getAreasForSearchCity,
  POPULAR_CITIES,
} from "@/lib/constants";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { trackEvent } from "@/lib/analytics";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "mobile" | "desktop";

export function HomeSearchHero({ variant = "mobile" }: { variant?: Variant }) {
  const router = useRouter();
  const [listingType, setListingType] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("0");
  const areas = city ? getAreasForSearchCity(city) : [];
  const isDesktop = variant === "desktop";

  function runSearch() {
    const params = new URLSearchParams();
    if (listingType) params.set("type", listingType);
    if (city) params.set("city", city);
    if (area.trim()) params.set("area", area.trim());
    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    trackEvent("search", {
      city: city || undefined,
      area: area.trim() || undefined,
      listing_type: listingType || undefined,
      budget: range?.label,
      placement: isDesktop ? "home_hero_desktop" : "home_hero_mobile",
    });

    router.push(`/search?${params.toString()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isDesktop
          ? "rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-md lg:p-8"
          : "full-bleed border-b border-gold/15 bg-gradient-to-br from-navy via-navy-mid to-navy-dark px-3 pb-4 pt-3"
      )}
    >
      {!isDesktop && (
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gold/20 blur-3xl"
          aria-hidden
        />
      )}
      {isDesktop && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(228,181,71,0.15),transparent_55%)]"
          aria-hidden
        />
      )}

      {!isDesktop && (
        <p className="relative mb-3 flex items-center gap-1.5 text-xs font-semibold text-gold-light">
          <Sparkles className="h-3.5 w-3.5" />
          Find homes faster — search right here
        </p>
      )}

      <div
        className={cn(
          "relative hide-scrollbar flex gap-2 overflow-x-auto",
          isDesktop ? "mb-5" : "mb-3"
        )}
      >
        {SEARCH_DEAL_TYPES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setListingType(t.value)}
            className={cn(
              "pressable shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
              listingType === t.value
                ? "bg-gold text-navy shadow-glow-gold"
                : isDesktop
                  ? "bg-white/10 text-white/85 hover:bg-white/15"
                  : "bg-white/10 text-white/90 ring-1 ring-white/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="relative grid gap-2 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:gap-3">
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setArea("");
          }}
          aria-label="City"
          className={cn(
            "h-12 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gold/50",
            isDesktop
              ? "bg-white/95 text-navy"
              : "bg-white/95 text-navy shadow-sm"
          )}
        >
          <option value="">All cities</option>
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {areas.length > 0 ? (
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            aria-label="Area"
            className={cn(
              "h-12 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-gold/50",
              isDesktop ? "bg-white/95 text-navy" : "bg-white/95 text-navy"
            )}
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Area (optional)"
            aria-label="Area"
            className={cn(
              "h-12 rounded-xl px-4 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-gold/50",
              isDesktop ? "bg-white/95 text-navy" : "bg-white/95 text-navy"
            )}
          />
        )}

        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          aria-label="Budget"
          className={cn(
            "h-12 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-gold/50 sm:col-span-1",
            isDesktop ? "bg-white/95 text-navy" : "bg-white/95 text-navy"
          )}
        >
          {BUDGET_RANGES.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="pressable flex h-12 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold sm:col-span-1"
        >
          <Search className="h-4 w-4" />
          Search homes
        </button>
      </form>
    </div>
  );
}
