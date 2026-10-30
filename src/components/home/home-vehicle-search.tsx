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
  buildVehicleMakeSelectOptions,
  buildVehicleTypeSelectOptions,
  isValidTypeForMake,
} from "@/lib/marketplace/vehicle-makes";
import {
  vehicleCategoryLabel,
  vehicleHomeSearchCategorySelectOptions,
} from "@/lib/marketplace/vehicle-specs";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HomeMobileFilterShell } from "@/components/home/home-mobile-filter-shell";
import { useHomeMarketplaceFilterContext } from "@/lib/home/home-marketplace-filter-context";
import { vehicleMarketplaceMeaningfulSelection } from "@/lib/home/marketplace-filter-engagement";
import { cn } from "@/lib/utils";

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  className?: string;
  /** Compact inline controls — no card shell (homepage marketplace). */
  compact?: boolean;
  mobileFilterCollapse?: boolean;
  filtersExpanded?: boolean;
  onFiltersExpandedChange?: (open: boolean) => void;
  resetToken?: number;
  onFilterSummaryChange?: (summary: string) => void;
};

/** Vehicle search — Category · State · City · Make · Model · Budget + strongest CTA. */
export function HomeVehicleSearch({
  onSearch,
  className,
  compact = false,
  mobileFilterCollapse = false,
  filtersExpanded = false,
  onFiltersExpandedChange,
  resetToken = 0,
  onFilterSummaryChange,
}: Props) {
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [make, setMake] = useState("");
  const [carType, setCarType] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (resetToken === 0) return;
    setCategory("");
    setState("");
    setCity("");
    setMake("");
    setCarType("");
    setBudget("");
  }, [resetToken]);

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const budgetOptions = useMemo(() => buildBudgetSelectOptions("sale"), []);
  const makeOptions = useMemo(() => buildVehicleMakeSelectOptions(), []);
  const typeOptions = useMemo(
    () => buildVehicleTypeSelectOptions(make),
    [make],
  );
  const categoryOptions = useMemo(() => vehicleHomeSearchCategorySelectOptions(), []);
  const marketplaceFilter = useHomeMarketplaceFilterContext();

  const meaningfulSelection = vehicleMarketplaceMeaningfulSelection({
    category,
    state,
    city,
    make,
    carType,
    budget,
  });

  useEffect(() => {
    marketplaceFilter?.setMeaningfulFilterActive(meaningfulSelection);
  }, [meaningfulSelection, marketplaceFilter]);

  const typeDisabled = !make;

  function onMakeChange(nextMake: string) {
    setMake(nextMake);
    if (!nextMake || !isValidTypeForMake(nextMake, carType)) {
      setCarType("");
    }
  }

  function resetFilters() {
    setCategory("");
    setState("");
    setCity("");
    setMake("");
    setCarType("");
    setBudget("");
  }

  function submit() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (make) params.set("make", make);
    if (carType) params.set("model", carType);
    if (budget) {
      const { min, max } = budgetParamsFromValue(budget);
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    const labelParts = [
      category ? vehicleCategoryLabel(category) : "Vehicles",
      make || undefined,
      carType || undefined,
      city || state || undefined,
    ].filter(Boolean);

    onSearch({
      params,
      label: labelParts.join(" · ") || "Search vehicles",
    });
  }

  const filterSummary = useMemo(() => {
    const parts = [
      category ? vehicleCategoryLabel(category) : null,
      city || state || null,
      make || null,
      budget ? "Budget set" : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [category, city, state, make, budget]);

  useEffect(() => {
    onFilterSummaryChange?.(filterSummary);
  }, [filterSummary, onFilterSummaryChange]);

  const showDetailFilters = !mobileFilterCollapse || Boolean(category);

  const filterControls = (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      <ThemedSelect
        ariaLabel="Category"
        placeholder="Any category"
        value={category}
        onChange={setCategory}
        options={categoryOptions}
      />
      {showDetailFilters ? (
        <div
          className={cn(
            "grid grid-cols-2 sm:grid-cols-3",
            compact ? "gap-2" : "gap-3",
          )}
        >
          <ThemedSelect
            ariaLabel="State"
            placeholder="Any state"
            value={state}
            onChange={(v) => {
              setState(v);
              setCity("");
            }}
            options={stateOptions}
          />
          <ThemedSelect
            ariaLabel="City"
            placeholder="Any city"
            value={city}
            onChange={setCity}
            options={cityOptions}
          />
          <ThemedSelect
            ariaLabel="Make"
            placeholder="Any make"
            value={make}
            onChange={onMakeChange}
            options={makeOptions}
          />
          <ThemedSelect
            ariaLabel="Model"
            placeholder="Any model"
            value={carType}
            onChange={setCarType}
            options={typeOptions}
            disabled={typeDisabled}
          />
          <ThemedSelect
            ariaLabel="Budget"
            placeholder="Any budget"
            value={budget}
            onChange={setBudget}
            options={budgetOptions}
            compactLabel
          />
        </div>
      ) : (
        <p className="text-[11px] font-medium text-white/65">
          Choose a vehicle type to set city, make, and budget.
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
        compact ? "py-3 text-[15px]" : "py-3.5 text-[15px] sm:py-4",
      )}
      aria-label="Search vehicles"
    >
      <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      Search
    </button>
  );

  return (
    <div
      className={cn(
        !compact &&
          "rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_12px_40px_-18px_rgba(3,27,78,0.28)] ring-1 ring-navy/[0.04]",
        className,
      )}
    >
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
