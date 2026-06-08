"use client";

import { useMemo, useState } from "react";
import {
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateDisplayLabel,
  getStateForCity,
  getStates,
} from "@/lib/constants";
import { budgetParamsFromIndex, budgetSelectOptions } from "@/lib/budget-ranges";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  HOME_DEAL_TYPES,
  chipToFilterParams,
  type SearchDealChip,
} from "@/constants/listingTypes";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemedSelect } from "@/components/ui/themed-select";

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

    const { min: budgetMin, max: budgetMax } = budgetParamsFromIndex(
      Number(budgetIndex)
    );
    if (budgetMin) params.set("min", budgetMin);
    if (budgetMax) params.set("max", budgetMax);

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

  const selectVariant = isPremium ? "hero" : "default";

  const stateOptions = [
    { value: "", label: "Any state" },
    ...getStates().map((s) => ({
      value: s,
      label: getStateDisplayLabel(s),
    })),
  ];

  const cityOptionsList = [
    { value: "", label: "Any city" },
    ...cityOptions.map((c) => ({ value: c, label: c })),
  ];

  const propertyTypeOptions = [
    { value: "", label: "Any property type" },
    ...PROPERTY_TYPES.slice(0, 14).map((t) => ({ value: t.value, label: t.label })),
  ];

  const budgetOptions = budgetSelectOptions();

  return (
    <div className={shellClass}>
      <p className={cn(titleClass, "text-center text-balance")}>{title}</p>

      <div className="mb-3.5 grid grid-cols-4 gap-1.5 pb-0.5 lg:mb-3 lg:flex lg:justify-center lg:gap-2">
        {HOME_DEAL_TYPES.map((t) => {
          const key = chipKey(t);
          const active = dealKey === key;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setDealKey(key)}
              className={cn(
                "pressable min-w-0 rounded-full px-2 py-2 text-center text-[11px] font-bold leading-tight transition-all duration-200 sm:text-xs lg:shrink-0 lg:px-4 lg:py-2.5 lg:text-sm",
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
        <ThemedSelect
          value={state}
          onChange={(value) => {
            setState(value);
            setCity("");
          }}
          options={stateOptions}
          placeholder="Any state"
          ariaLabel="State"
          variant={selectVariant}
        />
        <ThemedSelect
          value={city}
          onChange={(value) => {
            setCity(value);
            const inferred = value ? getStateForCity(value) : "";
            if (inferred) setState(inferred);
          }}
          options={cityOptionsList}
          placeholder="Any city"
          ariaLabel="City"
          variant={selectVariant}
        />
        <ThemedSelect
          value={propertyType}
          onChange={setPropertyType}
          options={propertyTypeOptions}
          placeholder="Any property type"
          ariaLabel="Property type"
          variant={selectVariant}
        />
        <ThemedSelect
          value={budget}
          onChange={setBudget}
          options={budgetOptions}
          placeholder="Any budget"
          ariaLabel="Budget"
          variant={selectVariant}
        />
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
