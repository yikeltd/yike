"use client";

import { useMemo, useState } from "react";
import {
  BUDGET_RANGES,
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateForCity,
  getStates,
} from "@/lib/constants";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  HOME_DEAL_TYPES,
  chipToFilterParams,
  type SearchDealChip,
} from "@/constants/listingTypes";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-navy/10 bg-white px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-gold/35 dark:border-white/10 dark:bg-elevated lg:text-sm";

function resolveChip(key: string): SearchDealChip {
  return (
    HOME_DEAL_TYPES.find(
      (t) =>
        t.value === key ||
        (key === "land" && t.hub === "land_sale") ||
        (key === "shops" && t.propertyType === "shop")
    ) ?? HOME_DEAL_TYPES[0]
  );
}

function chipKey(chip: SearchDealChip): string {
  if (chip.hub === "land_sale") return "land";
  if (chip.propertyType === "shop") return "shops";
  return chip.value;
}

export type BrowseSearchPayload = {
  params: URLSearchParams;
  label: string;
};

export type BrowseListingsInitial = {
  dealKey?: string;
  state?: string;
  city?: string;
  area?: string;
  propertyType?: string;
  budgetIndex?: string;
  locationQuery?: string;
};

export function BrowseListingsBlock({
  onSearch,
  initial,
  title = "Discover homes across Nigeria",
  variant = "default",
}: {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: BrowseListingsInitial;
  title?: string;
  variant?: "default" | "home-premium";
}) {
  const isPremium = variant === "home-premium";
  const [dealKey, setDealKey] = useState(initial?.dealKey ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area] = useState(initial?.area ?? "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [budget, setBudget] = useState(initial?.budgetIndex ?? "0");

  const cityOptions = useMemo(
    () => (state ? getAllCitiesForState(state) : getAllCitiesComplete()),
    [state]
  );

  const hasFilterSelection = Boolean(
    dealKey || state || city || area || propertyType || budget !== "0"
  );

  function buildParams(overrides?: {
    dealKey?: string;
    state?: string;
    city?: string;
    area?: string;
    propertyType?: string;
    budgetIndex?: string;
  }): BrowseSearchPayload {
    const chip = resolveChip(overrides?.dealKey ?? dealKey);
    const filter = chipToFilterParams(chip);
    const searchState = overrides?.state ?? state;
    const searchCity = overrides?.city ?? city;
    const searchArea = (overrides?.area ?? area).trim();
    const searchPropertyType =
      overrides?.propertyType ?? (propertyType || filter.property_type);
    const budgetIndex = overrides?.budgetIndex ?? budget;

    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.hub) params.set("hub", filter.hub);
    if (searchPropertyType && !filter.hub) {
      params.set("property_type", searchPropertyType);
    }
    if (searchState) params.set("state", searchState);
    if (searchCity) params.set("city", searchCity);
    if (searchArea) params.set("area", searchArea);

    const range = BUDGET_RANGES[Number(budgetIndex)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    const label =
      [searchCity, searchArea].filter(Boolean).join(" · ") ||
      chip.label ||
      "All Nigeria";

    return { params, label };
  }

  function submit(overrides?: Parameters<typeof buildParams>[0]) {
    onSearch(buildParams(overrides));
  }

  const shellClass = isPremium
    ? "rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgb(228_181_71_/_12%),0_8px_32px_rgb(2_20_51_/_28%)] ring-1 ring-white/[0.05] lg:border-navy/10 lg:bg-white/95 lg:p-3.5 lg:shadow-sm lg:ring-navy/[0.06] lg:[box-shadow:none]"
    : "rounded-2xl border border-navy/10 bg-white/95 p-3.5 shadow-sm ring-1 ring-navy/[0.06] dark:border-white/10 dark:bg-elevated dark:ring-white/[0.05]";

  const titleClass = isPremium
    ? "mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold lg:mb-3 lg:text-sm lg:normal-case lg:tracking-normal lg:text-navy lg:dark:text-foreground"
    : "mb-3 text-sm font-bold text-navy dark:text-foreground";

  const chipIdle = isPremium
    ? "border border-white/12 bg-white/[0.07] text-white/85 hover:bg-white/10 lg:border-navy/10 lg:bg-navy/[0.04] lg:text-muted lg:hover:text-foreground"
    : "bg-navy/[0.04] text-muted ring-1 ring-navy/10 hover:text-foreground dark:bg-white/5 dark:ring-white/[0.08]";

  const selectPremium =
    "home-hero-select h-10 w-full appearance-none rounded-xl border border-white/12 bg-[#021433]/90 px-3 pr-8 text-xs font-medium text-white outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/25 [&>option]:bg-[#031B4E] [&>option]:text-white lg:border-navy/10 lg:bg-white lg:pr-3 lg:text-foreground lg:focus:ring-gold/35 lg:[&>option]:bg-white lg:[&>option]:text-foreground lg:text-sm lg:[background-image:none]";

  const selectMerged = isPremium ? selectPremium : selectClass;

  return (
    <div className={shellClass}>
      <p className={cn(titleClass, "text-center text-balance")}>{title}</p>

      <div className="mb-3.5 flex flex-wrap justify-center gap-2 pb-0.5 lg:mb-3">
        {HOME_DEAL_TYPES.map((t) => {
          const key = chipKey(t);
          const active = dealKey === key;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setDealKey(key)}
              className={cn(
                "pressable shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200",
                active
                  ? "bg-gold text-navy shadow-glow-gold"
                  : chipIdle
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <select
          value={state}
          onChange={(e) => {
            const value = e.target.value;
            setState(value);
            setCity("");
          }}
          aria-label="State"
          className={selectMerged}
        >
          <option value="">Any state</option>
          {getStates().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => {
            const value = e.target.value;
            setCity(value);
            const inferred = value ? getStateForCity(value) : "";
            if (inferred) setState(inferred);
          }}
          aria-label="City"
          className={selectMerged}
        >
          <option value="">Any city</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          aria-label="Property type"
          className={selectMerged}
        >
          <option value="">Any Property Type</option>
          {PROPERTY_TYPES.slice(0, 14).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          aria-label="Budget"
          className={selectMerged}
        >
          {BUDGET_RANGES.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          hasFilterSelection
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => submit()}
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy shadow-glow-gold"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            Search homes
          </button>
        </div>
      </div>
    </div>
  );
}
