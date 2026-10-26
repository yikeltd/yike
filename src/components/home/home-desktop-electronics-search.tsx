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
import { cn } from "@/lib/utils";

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

    const catLabel = ELECTRONICS_CATEGORIES.find((c) => c.id === category)?.label;
    const labelParts = [catLabel || "Electronics", city || state || undefined].filter(Boolean);

    onSearch({
      params,
      label: labelParts.join(" · ") || "Electronics",
    });
  }

  const filterSummary = useMemo(() => {
    const parts = [
      category
        ? ELECTRONICS_CATEGORIES.find((c) => c.id === category)?.label
        : null,
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

  const filterControls = (
    <div
      className={cn(
        "grid gap-2",
        compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-5",
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
        ariaLabel="Electronics category"
        value={category}
        onChange={setCategory}
        options={categoryOptions}
        placeholder="Any category"
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
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-center">
          <ThemedSelect variant={variant} ariaLabel="State" value={state} onChange={(v) => { setState(v); setCity(""); }} options={stateOptions} placeholder="State" />
          <ThemedSelect variant={variant} ariaLabel="City" value={city} onChange={setCity} options={cityOptions} placeholder="City" />
          <ThemedSelect variant={variant} ariaLabel="Electronics category" value={category} onChange={setCategory} options={categoryOptions} placeholder="Category" />
          <ThemedSelect variant={variant} ariaLabel="Condition" value={condition} onChange={setCondition} options={conditionOptions} placeholder="Condition" />
          <ThemedSelect variant={variant} ariaLabel="Budget" value={budget} onChange={setBudget} options={budgetOptions} placeholder="Budget" />
          <button
            type="button"
            onClick={submit}
            className="pressable flex h-11 w-full items-center justify-center rounded-2xl bg-gold font-black text-navy shadow-md transition-all hover:bg-gold-light lg:h-11 lg:w-11"
            aria-label="Search electronics"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
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
      />
    </div>
  );
}
