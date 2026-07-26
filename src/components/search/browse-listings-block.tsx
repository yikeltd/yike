"use client";

import { useMemo, useState } from "react";
import { getStateForCity } from "@/lib/constants";
import {
  budgetContextFromDealKey,
  budgetParamsFromIndex,
  budgetParamsFromValue,
  budgetValueMatchesContext,
  buildBudgetHeroSelectOptions,
  buildBudgetSelectOptions,
  encodeBudgetValue,
} from "@/lib/budget-ranges";
import {
  buildCitySelectOptions,
  buildPropertyTypeSelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
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
  budgetValue?: string;
  /** @deprecated use budgetValue */
  budgetIndex?: string;
  locationQuery?: string;
};

export function BrowseListingsBlock({
  onSearch,
  initial,
  title = "Discover homes across Nigeria",
  searchButtonLabel = "Search homes",
  variant = "default",
  alwaysShowSearch = false,
  hideTitle = false,
}: {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: BrowseListingsInitial;
  title?: string;
  searchButtonLabel?: string;
  variant?: "default" | "home-premium" | "home-desktop-panel" | "home-inline";
  /** Always show primary Search CTA (homepage marketplace). */
  alwaysShowSearch?: boolean;
  /** Hide contextual title when category tab already provides context. */
  hideTitle?: boolean;
}) {
  const isPremium = variant === "home-premium";
  const isDesktopPanel = variant === "home-desktop-panel";
  const isInline = variant === "home-inline";
  const [dealKey, setDealKey] = useState(initial?.dealKey ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area] = useState(initial?.area ?? "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [budget, setBudget] = useState(() => {
    if (initial?.budgetValue) return initial.budgetValue;
    if (initial?.budgetIndex && initial.budgetIndex !== "0") {
      const { min, max } = budgetParamsFromIndex(Number(initial.budgetIndex));
      return encodeBudgetValue(
        min ? Number(min) : null,
        max ? Number(max) : null
      );
    }
    return "";
  });

  const budgetContext = budgetContextFromDealKey(dealKey);

  const hasFilterSelection = Boolean(
    dealKey || state || city || area || propertyType || budget
  );
  const showSearchButton =
    alwaysShowSearch || isPremium || isDesktopPanel || hasFilterSelection;

  function buildParams(overrides?: {
    dealKey?: string;
    state?: string;
    city?: string;
    area?: string;
    propertyType?: string;
    budgetValue?: string;
  }): BrowseSearchPayload {
    const chip = resolveChip(overrides?.dealKey ?? dealKey);
    const filter = chipToFilterParams(chip);
    const searchState = overrides?.state ?? state;
    const searchCity = overrides?.city ?? city;
    const searchArea = (overrides?.area ?? area).trim();
    const searchPropertyType =
      overrides?.propertyType ?? (propertyType || filter.property_type);
    const budgetValue = overrides?.budgetValue ?? budget;

    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.hub) params.set("hub", filter.hub);
    if (searchPropertyType && !filter.hub) {
      params.set("property_type", searchPropertyType);
    }
    if (searchState) params.set("state", searchState);
    if (searchCity) params.set("city", searchCity);
    if (searchArea) params.set("area", searchArea);

    const { min: budgetMin, max: budgetMax } = budgetParamsFromValue(budgetValue);
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

  const shellClass = isDesktopPanel
    ? "yike-search-shell rounded-2xl border border-white/14 bg-[#031B4E]/92 p-3 shadow-search ring-1 ring-white/12 backdrop-blur-sm"
    : isPremium
      ? "yike-search-shell rounded-[1.35rem] border border-white/18 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_14%),0_14px_40px_rgb(2_20_51_/_34%)] ring-1 ring-white/[0.1] lg:p-3.5"
      : isInline
        ? ""
        : alwaysShowSearch
          ? "yike-search-shell rounded-[1.35rem] border border-navy/10 bg-white/95 p-4 shadow-[0_16px_48px_-18px_rgba(3,27,78,0.3)] ring-1 ring-navy/[0.05]"
          : "yike-search-shell rounded-[1.25rem] border border-navy/10 bg-white/95 p-3.5 shadow-card ring-1 ring-navy/[0.06] dark:border-white/10 dark:bg-elevated dark:ring-white/[0.05]";

  const titleClass = isPremium
    ? "mb-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold lg:mb-3 lg:text-sm lg:normal-case lg:tracking-normal"
    : alwaysShowSearch
      ? "mb-3 text-center text-base font-bold tracking-tight text-navy"
      : "mb-3 text-sm font-bold text-navy dark:text-foreground";

  const chipIdle = isPremium
    ? "border border-white/12 bg-white/[0.07] text-white/85 hover:bg-white/10"
    : isDesktopPanel
      ? "border border-white/14 bg-white/[0.06] text-white/78 hover:bg-white/[0.1] hover:text-white"
      : isInline
        ? "bg-white/90 text-navy/55 ring-1 ring-navy/10 hover:text-navy"
        : "bg-navy/[0.04] text-muted ring-1 ring-navy/10 hover:text-foreground dark:bg-white/5 dark:ring-white/[0.08]";

  const selectVariant = isPremium ? "hero" : isDesktopPanel ? "hero" : "default";

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptionsList = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state]
  );
  const propertyTypeOptions = useMemo(
    () => buildPropertyTypeSelectOptions(),
    []
  );
  const budgetOptions = useMemo(
    () =>
      isPremium
        ? buildBudgetHeroSelectOptions(budgetContext)
        : buildBudgetSelectOptions(budgetContext),
    [isPremium, budgetContext]
  );

  const showTitle = !isDesktopPanel && !hideTitle && !isInline;

  return (
    <div className={shellClass}>
      {showTitle ? (
        <p className={cn(titleClass, "text-center text-balance")}>{title}</p>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-4 gap-1 pb-0.5 lg:flex lg:justify-center lg:gap-2",
          isInline ? "mb-2" : "mb-3.5 lg:mb-3",
          isDesktopPanel && "mb-2.5 lg:mb-2.5 lg:justify-start"
        )}
      >
        {HOME_DEAL_TYPES.map((t) => {
          const key = chipKey(t);
          const active = dealKey === key;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                const nextContext = budgetContextFromDealKey(key);
                setDealKey(key);
                if (!budgetValueMatchesContext(budget, nextContext)) {
                  setBudget("");
                }
              }}
              className={cn(
                "pressable min-w-0 rounded-lg text-center font-bold leading-tight transition-all duration-200 lg:shrink-0",
                isInline
                  ? "px-1.5 py-1.5 text-[10px] sm:rounded-full sm:px-3 sm:text-xs"
                  : "rounded-full px-2 py-2 text-[11px] sm:text-xs lg:px-4 lg:py-2.5 lg:text-sm",
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

      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-4",
          isInline ? "gap-2" : "gap-3",
          isDesktopPanel && "lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end xl:gap-3.5"
        )}
      >
        <ThemedSelect
          value={state}
          onChange={(value) => {
            setState(value);
            setCity("");
          }}
          options={stateOptions}
          placeholder={isDesktopPanel ? "State" : "Any state"}
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
          placeholder={isDesktopPanel ? "City" : "Any city"}
          ariaLabel="City"
          variant={selectVariant}
        />
        <ThemedSelect
          value={propertyType}
          onChange={setPropertyType}
          options={propertyTypeOptions}
          placeholder={isDesktopPanel ? "Property Type" : "Any type"}
          ariaLabel="Property type"
          variant={selectVariant}
        />
        <ThemedSelect
          value={budget}
          onChange={setBudget}
          options={budgetOptions}
          placeholder={isDesktopPanel ? "Budget" : "Any budget"}
          ariaLabel="Budget"
          variant={selectVariant}
          compactLabel={isPremium || isInline}
        />
        {isDesktopPanel ? (
          <button
            type="button"
            onClick={() => submit()}
            className="pressable yike-btn-accent col-span-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy sm:col-span-1 lg:col-auto lg:h-12 lg:min-w-[10.5rem]"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            {searchButtonLabel}
          </button>
        ) : null}
      </div>

      {!isDesktopPanel ? (
        alwaysShowSearch || isInline ? (
          <button
            type="button"
            onClick={() => submit()}
            className={cn(
              "pressable yike-btn-accent flex w-full items-center justify-center gap-2 rounded-xl bg-gold font-bold text-navy",
              isInline
                ? "mt-2.5 py-3 text-[15px]"
                : "mt-3.5 py-3 text-sm sm:py-3.5 sm:text-[15px]",
            )}
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            {searchButtonLabel}
          </button>
        ) : (
          <div
            className={cn(
              "grid transition-all duration-300 ease-out",
              showSearchButton
                ? "mt-3 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <button
                type="button"
                onClick={() => submit()}
                className="pressable yike-btn-accent flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy"
              >
                <Search className="h-4 w-4" strokeWidth={2.5} />
                {searchButtonLabel}
              </button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
