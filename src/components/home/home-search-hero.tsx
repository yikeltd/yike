"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUDGET_RANGES,
  getAreasForSearchCity,
  POPULAR_CITIES,
} from "@/lib/constants";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { trackEvent } from "@/lib/analytics";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "mobile" | "desktop";

type Initial = {
  listingType?: string;
  city?: string;
  area?: string;
  min?: string;
  max?: string;
};

export function HomeSearchHero({
  variant = "mobile",
  initial,
}: {
  variant?: Variant;
  initial?: Initial;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listingType, setListingType] = useState(initial?.listingType ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [budget, setBudget] = useState("0");
  const areas = city ? getAreasForSearchCity(city) : [];
  const isDesktop = variant === "desktop";

  useEffect(() => {
    const type = searchParams.get("type") ?? "";
    const c = searchParams.get("city") ?? "";
    const a = searchParams.get("area") ?? "";
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    setListingType(type);
    setCity(c);
    setArea(a);
    const idx = BUDGET_RANGES.findIndex(
      (b) =>
        (min ? String(b.min) === min : !b.min) &&
        (max ? String(b.max) === max : !b.max)
    );
    if (idx >= 0) setBudget(String(idx));
  }, [searchParams]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (listingType) params.set("type", listingType);
    if (city) params.set("city", city);
    if (area.trim()) params.set("area", area.trim());
    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    const label =
      [city, area.trim()].filter(Boolean).join(" · ") ||
      (listingType ? SEARCH_DEAL_TYPES.find((t) => t.value === listingType)?.label : "All Nigeria") ||
      "All Nigeria";

    trackEvent("search", {
      city: city || undefined,
      area: area.trim() || undefined,
      listing_type: listingType || undefined,
      budget: range?.label,
      placement: isDesktop ? "home_hero_desktop" : "home_hero_mobile",
    });

    saveBrowsePreferences({
      city: city || undefined,
      area: area.trim() || undefined,
      listingType: listingType || undefined,
    });

    addRecentSearch({ label, href: `/?${params.toString()}` });

    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  const fieldClass = cn(
    "h-12 w-full rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-gold/50",
    isDesktop
      ? "bg-white/95 text-navy"
      : "border border-white/10 bg-elevated text-foreground dark:bg-[#122746] dark:text-[#f4f7fb]"
  );

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

      <div
        className={cn(
          "relative hide-scrollbar flex gap-2 overflow-x-auto",
          isDesktop ? "mb-4" : "mb-3"
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
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-white/10 text-white ring-1 ring-white/15"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3"
      >
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setArea("");
          }}
          aria-label="City"
          className={fieldClass}
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
            aria-label="Area or neighbourhood"
            className={fieldClass}
          >
            <option value="">Area or neighbourhood</option>
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
            placeholder="Area or neighbourhood"
            aria-label="Area or neighbourhood"
            className={fieldClass}
          />
        )}

        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          aria-label="Budget"
          className={fieldClass}
        >
          {BUDGET_RANGES.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="pressable flex h-12 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold sm:col-span-2 lg:col-span-1"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Apply filters
        </button>
      </form>
    </div>
  );
}
