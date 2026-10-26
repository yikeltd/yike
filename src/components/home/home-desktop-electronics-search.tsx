"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  buildCitySelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
import {
  budgetParamsFromValue,
  buildBudgetSelectOptions,
} from "@/lib/budget-ranges";
import {
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_CONDITIONS,
} from "@/lib/marketplace/electronics-specs";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HomeMobileFilterShell } from "@/components/home/home-mobile-filter-shell";
import { useHomeMarketplaceFilterContext } from "@/lib/home/home-marketplace-filter-context";
import { electronicsMarketplaceMeaningfulSelection } from "@/lib/home/marketplace-filter-engagement";
import { cn } from "@/lib/utils";

/** Desktop hero shortcuts only — full taxonomy stays in mobile/advanced selects. */
export const DESKTOP_ELECTRONICS_HERO_SHORTCUTS = [
  { value: "phones_tablets", label: "Phones" },
  { value: "computers", label: "Laptops" },
  { value: "tv_audio", label: "TVs" },
  { value: "home_appliances", label: "Home Appliances" },
] as const;

function electronicsCategoryLabel(categoryId: string): string | undefined {
  const shortcut = DESKTOP_ELECTRONICS_HERO_SHORTCUTS.find((c) => c.value === categoryId);
  if (shortcut) return shortcut.label;
  return ELECTRONICS_CATEGORIES.find((c) => c.id === categoryId)?.label;
}

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: {
    state?: string;
    city?: string;
    category?: string;
    condition?: string;
    budgetValue?: string;
  };
  className?: string;
  /** Tighter grid for mobile hero. */
  compact?: boolean;
  mobileFilterCollapse?: boolean;
  filtersExpanded?: boolean;
  onFiltersExpandedChange?: (open: boolean) => void;
  resetToken?: number;
  onFilterSummaryChange?: (summary: string) => void;
};

export function HomeDesktopElectronicsSearch({
  onSearch,
  initial,
  className,
  compact = false,
  mobileFilterCollapse = false,
  filtersExpanded = false,
  onFiltersExpandedChange,
  resetToken = 0,
  onFilterSummaryChange,
}: Props) {
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [budget, setBudget] = useState(initial?.budgetValue ?? "");

  useEffect(() => {
    if (resetToken === 0) return;
    setState("");
    setCity("");
    setCategory("");
    setCondition("");
    setBudget("");
  }, [resetToken]);

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const budgetOptions = useMemo(() => buildBudgetSelectOptions("sale"), []);
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...ELECTRONICS_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
    ],
    [],
  );
  const conditionOptions = useMemo(
    () => [
      { value: "", label: "Any condition" },
      ...ELECTRONICS_CONDITIONS.map((c) => ({ value: c.id, label: c.label })),
    ],
    [],
  );

  const marketplaceFilter = useHomeMarketplaceFilterContext();
  const meaningfulSelection = electronicsMarketplaceMeaningfulSelection({
    category,
    state,
    city,
    condition,
    budget,
  });

  useEffect(() => {
    if (mobileFilterCollapse) {
      marketplaceFilter?.setMeaningfulFilterActive(meaningfulSelection);
    }
  }, [meaningfulSelection, marketplaceFilter, mobileFilterCollapse]);

  function resetFilters() {
    setState("");
    setCity("");
    setCategory("");
    setCondition("");
    setBudget("");
  }

  function submit() {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);
    if (budget) {
      const { min, max } = budgetParamsFromValue(budget);
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    const catLabel = category ? electronicsCategoryLabel(category) : undefined;
    const labelParts = [catLabel || "Electronics", city || state || undefined].filter(Boolean);

    onSearch({
      params,
      label: labelParts.join(" · ") || "Electronics",
    });
  }

  const filterSummary = useMemo(() => {
    const parts = [
      category ? electronicsCategoryLabel(category) : null,
      city || state || null,
      condition
        ? ELECTRONICS_CONDITIONS.find((c) => c.id === condition)?.label
        : null,
      budget ? "Budget set" : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [category, city, state, condition, budget]);

  useEffect(() => {
    onFilterSummaryChange?.(filterSummary);
  }, [filterSummary, onFilterSummaryChange]);

  const showDetailFilters = !mobileFilterCollapse || Boolean(category);

  const filterControls = (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      <ThemedSelect
        variant={compact ? "default" : "hero"}
        ariaLabel="Electronics category"
        value={category}
        onChange={setCategory}
        options={categoryOptions}
        placeholder="Any category"
      />
      {showDetailFilters ? (
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4",
          )}
        >
          <ThemedSelect
            variant={compact ? "default" : "hero"}
            ariaLabel="State"
            value={state}
            onChange={(v) => {
              setState(v);
              setCity("");
            }}
            options={stateOptions}
            placeholder="Any state"
          />
          <ThemedSelect
            variant={compact ? "default" : "hero"}
            ariaLabel="City"
            value={city}
            onChange={setCity}
            options={cityOptions}
            placeholder="Any city"
          />
          <ThemedSelect
            variant={compact ? "default" : "hero"}
            ariaLabel="Condition"
            value={condition}
            onChange={setCondition}
            options={conditionOptions}
            placeholder="Any condition"
          />
          <ThemedSelect
            variant={compact ? "default" : "hero"}
            ariaLabel="Budget"
            value={budget}
            onChange={setBudget}
            options={budgetOptions}
            placeholder="Any budget"
            compactLabel
          />
        </div>
      ) : (
        <p className="text-[11px] font-medium text-white/65">
          Choose a category to set city, condition, and budget.
        </p>
      )}
    </div>
  );

  const searchButton = (
    <button
      type="button"
      onClick={submit}
      className={cn(
        "pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gold font-bold text-navy shadow-glow-gold",
        compact ? "py-3 text-[15px]" : "py-3.5 text-[15px]",
      )}
      aria-label="Search electronics"
    >
      <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      Search
    </button>
  );

  if (!compact && !mobileFilterCollapse) {
    const variant = "hero" as const;
    return (
      <div
        className={cn(
          "yike-search-shell rounded-2xl border border-white/14 bg-[#031B4E]/92 p-3 shadow-search ring-1 ring-white/12 backdrop-blur-sm",
          className,
        )}
        data-testid="home-desktop-electronics-search"
      >
        <div
          className="mb-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-start"
          data-testid="home-desktop-electronics-category-chips"
          role="group"
          aria-label="Electronics category shortcuts"
        >
          {DESKTOP_ELECTRONICS_HERO_SHORTCUTS.map((chip) => {
            const active = category === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(chip.value)}
                className={cn(
                  "pressable min-w-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 sm:px-4 sm:text-xs",
                  active
                    ? "bg-gold text-navy shadow-glow-gold"
                    : "border border-white/14 bg-white/[0.06] text-white/78 hover:bg-white/[0.1] hover:text-white",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end xl:gap-3.5">
          <ThemedSelect
            variant={variant}
            ariaLabel="State"
            value={state}
            onChange={(v) => {
              setState(v);
              setCity("");
            }}
            options={stateOptions}
            placeholder="State"
          />
          <ThemedSelect
            variant={variant}
            ariaLabel="City"
            value={city}
            onChange={setCity}
            options={cityOptions}
            placeholder="City"
          />
          <ThemedSelect
            variant={variant}
            ariaLabel="Condition"
            value={condition}
            onChange={setCondition}
            options={conditionOptions}
            placeholder="Condition"
          />
          <ThemedSelect
            variant={variant}
            ariaLabel="Budget"
            value={budget}
            onChange={setBudget}
            options={budgetOptions}
            placeholder="Budget"
            compactLabel
          />
          {meaningfulSelection ? (
            <button
              type="button"
              data-testid="home-desktop-electronics-search-cta"
              onClick={submit}
              className="pressable yike-btn-accent col-span-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy sm:col-span-1 lg:col-auto lg:h-12 lg:min-w-[3.5rem]"
              aria-label="Search electronics"
            >
              <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(compact ? "space-y-2" : undefined, className)}>
      <HomeMobileFilterShell
        collapseEnabled={mobileFilterCollapse}
        expanded={filtersExpanded}
        onExpandedChange={onFiltersExpandedChange ?? (() => {})}
        summary={filterSummary}
        onResetFilters={resetFilters}
        filterControls={filterControls}
        searchButton={searchButton}
        showSearchButton={!mobileFilterCollapse || meaningfulSelection}
      />
    </div>
  );
}
