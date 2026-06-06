"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BUDGET_RANGES, getStateForCity } from "@/lib/constants";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  HOME_DEAL_TYPES,
  chipToFilterParams,
  type SearchDealChip,
} from "@/constants/listingTypes";
import { trackEvent } from "@/lib/analytics";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { parseLocationQuery } from "@/lib/location-search";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Initial = {
  listingType?: string;
  hub?: string;
  propertyType?: string;
  state?: string;
  city?: string;
  area?: string;
  min?: string;
  max?: string;
};

function chipKeyFromParams(params: {
  type?: string;
  hub?: string;
  propertyType?: string;
}) {
  if (params.hub === "land_sale") return "land";
  if (params.propertyType === "shop") return "shops";
  if (params.propertyType === "hotel") return "hotel";
  return params.type ?? "";
}

function resolveChip(key: string): SearchDealChip {
  return (
    HOME_DEAL_TYPES.find(
      (t) =>
        t.value === key ||
        (key === "land" && t.hub === "land_sale") ||
        (key === "shops" && t.propertyType === "shop") ||
        (key === "hotel" && t.propertyType === "hotel")
    ) ?? HOME_DEAL_TYPES[0]
  );
}

export function HomeSearchHero({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dealKey, setDealKey] = useState(
    chipKeyFromParams({
      type: initial?.listingType,
      hub: initial?.hub,
      propertyType: initial?.propertyType,
    })
  );
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [budget, setBudget] = useState("0");
  const [browseQuery, setBrowseQuery] = useState("");

  useEffect(() => {
    if (searchParams.get("focus") === "search") {
      document.getElementById("home-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  useEffect(() => {
    const type = searchParams.get("type") ?? "";
    const hub = searchParams.get("hub") ?? "";
    const pt = searchParams.get("property_type") ?? "";
    const st = searchParams.get("state") ?? "";
    const c = searchParams.get("city") ?? "";
    const a = searchParams.get("area") ?? "";
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    setDealKey(chipKeyFromParams({ type, hub, propertyType: pt }));
    setState(st || (c ? getStateForCity(c) ?? "" : ""));
    setCity(c);
    setArea(a);
    setPropertyType(pt === "shop" ? "" : pt);
    setBrowseQuery([c, a].filter(Boolean).join(", "));
    const idx = BUDGET_RANGES.findIndex(
      (b) =>
        (min ? String(b.min) === min : !b.min) &&
        (max ? String(b.max) === max : !b.max)
    );
    if (idx >= 0) setBudget(String(idx));
  }, [searchParams]);

  function applyFilters(overrides?: {
    typeKey?: string;
    city?: string;
    area?: string;
    state?: string;
    propertyType?: string;
  }) {
    const chip = resolveChip(overrides?.typeKey ?? dealKey);
    const filter = chipToFilterParams(chip);
    const searchCity = overrides?.city ?? city;
    const searchArea = overrides?.area ?? area;
    const searchState = overrides?.state ?? state;
    const searchPropertyType =
      overrides?.propertyType ?? (propertyType || filter.property_type);

    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.hub) params.set("hub", filter.hub);
    if (searchPropertyType && !filter.hub)
      params.set("property_type", searchPropertyType);
    if (searchState) params.set("state", searchState);
    if (searchCity) params.set("city", searchCity);
    if (searchArea.trim()) params.set("area", searchArea.trim());

    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    const label =
      [searchCity, searchArea.trim()].filter(Boolean).join(" · ") ||
      chip.label ||
      "All Nigeria";

    trackEvent("search", {
      city: searchCity || undefined,
      area: searchArea.trim() || undefined,
      listing_type: filter.type,
      budget: range?.label,
      placement: "home_hero",
    });

    saveBrowsePreferences({
      city: searchCity || undefined,
      area: searchArea.trim() || undefined,
      listingType: filter.type,
      propertyType: searchPropertyType || undefined,
      minPrice: range?.min || undefined,
      maxPrice: range?.max || undefined,
    });

    addRecentSearch({ label, href: `/?${params.toString()}` });

    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function onBrowseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = browseQuery.trim();
    if (!trimmed) {
      applyFilters();
      return;
    }
    const parsed = parseLocationQuery(trimmed);
    const nextCity = parsed.city ?? city;
    const nextArea = parsed.area ?? area;
    const nextState = parsed.state ?? state;
    if (parsed.city) setCity(parsed.city);
    if (parsed.area) setArea(parsed.area);
    if (parsed.state) setState(parsed.state);
    applyFilters({
      city: nextCity,
      area: nextArea,
      state: nextState,
    });
  }

  return (
    <div
      id="home-search"
      className="relative overflow-hidden px-3 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))] lg:px-0 lg:pb-8 lg:pt-5"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />

      {/* Category chips */}
      <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        {HOME_DEAL_TYPES.map((t) => {
          const key = t.hub
            ? "land"
            : t.propertyType === "shop"
              ? "shops"
              : t.propertyType === "hotel"
                ? "hotel"
                : t.propertyType
                  ? t.propertyType
                  : t.value;
          const active = dealKey === key;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                setDealKey(key);
                applyFilters({ typeKey: key });
              }}
              className={cn(
                "pressable shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
                active
                  ? "bg-gold text-navy shadow-glow-gold"
                  : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Browse real listings — compact inline search */}
      <form
        onSubmit={onBrowseSubmit}
        className="relative mb-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm"
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light">
          Browse real listings
        </p>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-gold" />
          <input
            type="search"
            value={browseQuery}
            onChange={(e) => setBrowseQuery(e.target.value)}
            placeholder="City, area or neighbourhood"
            aria-label="Browse real listings"
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 outline-none"
          />
          <button
            type="submit"
            className="pressable shrink-0 rounded-lg bg-gold/90 px-3 py-1.5 text-xs font-bold text-navy"
          >
            Go
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            aria-label="Property type"
            className="h-9 rounded-lg border border-white/10 bg-navy/40 px-2 text-xs font-medium text-white outline-none"
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.slice(0, 12).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Budget"
            className="h-9 rounded-lg border border-white/10 bg-navy/40 px-2 text-xs font-medium text-white outline-none"
          >
            {BUDGET_RANGES.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
}
