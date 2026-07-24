"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStateForCity } from "@/lib/constants";
import {
  budgetContextFromSearchParams,
  budgetParamsFromValue,
  budgetValueFromSearchParams,
  buildBudgetSelectOptions,
} from "@/lib/budget-ranges";
import {
  buildCitySelectOptions,
  buildPropertyTypeSelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
import { ThemedSelect } from "@/components/ui/themed-select";
import { SearchFilterChips } from "@/components/search/search-filter-chips";
import { getMarketplaceLocation } from "@/lib/marketplace-location/preference";
import { cn } from "@/lib/utils";

export function SearchRefineFilters({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const state = sp.get("state") ?? "";
  const city = sp.get("city") ?? "";
  const propertyType = sp.get("property_type") ?? "";
  const listingType = sp.get("type") ?? "";
  const verified = sp.get("verified") === "1";
  const featured = sp.get("featured") === "1";
  const nearby = sp.get("nearby") === "1";

  const budgetContext = useMemo(
    () =>
      budgetContextFromSearchParams({
        type: sp.get("type"),
        hub: sp.get("hub"),
      }),
    [sp]
  );

  const budgetValue = useMemo(
    () => budgetValueFromSearchParams(sp.get("min"), sp.get("max")),
    [sp]
  );

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
    () => buildBudgetSelectOptions(budgetContext),
    [budgetContext]
  );

  function push(updates: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  function toggleFlag(key: "verified" | "featured") {
    const params = new URLSearchParams(sp.toString());
    if (params.get(key) === "1") params.delete(key);
    else params.set(key, "1");
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  function toggleListingType(value: "sale" | "rent") {
    if (listingType === value) {
      push({ type: null });
      return;
    }
    push({ type: value });
  }

  function toggleNearby() {
    if (nearby) {
      push({ nearby: null });
      return;
    }
    const loc = getMarketplaceLocation();
    push({
      nearby: "1",
      ...(loc?.city ? { city: loc.city } : {}),
      ...(loc?.state ? { state: loc.state } : {}),
      ...(loc?.area ? { area: loc.area } : {}),
    });
  }

  const chips = [
    {
      id: "verified",
      label: "Verified",
      active: verified,
      onToggle: () => toggleFlag("verified"),
    },
    {
      id: "featured",
      label: "Featured",
      active: featured,
      onToggle: () => toggleFlag("featured"),
    },
    {
      id: "nearby",
      label: "Nearby",
      active: nearby,
      onToggle: toggleNearby,
    },
    {
      id: "sale",
      label: "For Sale",
      active: listingType === "sale",
      onToggle: () => toggleListingType("sale"),
    },
    {
      id: "rent",
      label: "For Rent",
      active: listingType === "rent",
      onToggle: () => toggleListingType("rent"),
    },
  ];

  return (
    <div className={cn("space-y-3 px-3 pb-3 pt-1", className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ThemedSelect
          value={state}
          onChange={(value) => {
            push({ state: value || null, city: null, area: null });
          }}
          options={stateOptions}
          placeholder="State"
          ariaLabel="State"
        />
        <ThemedSelect
          value={city}
          onChange={(value) => {
            const inferred = value ? getStateForCity(value) : "";
            push({
              city: value || null,
              area: null,
              ...(inferred ? { state: inferred } : {}),
            });
          }}
          options={cityOptionsList}
          placeholder="City"
          ariaLabel="City"
        />
        <ThemedSelect
          value={propertyType}
          onChange={(value) => {
            push({
              property_type: value || null,
              hub: value === "land" ? "land_sale" : null,
            });
          }}
          options={propertyTypeOptions}
          placeholder="Category"
          ariaLabel="Property type"
        />
        <ThemedSelect
          value={budgetValue}
          onChange={(value) => {
            const { min, max } = budgetParamsFromValue(value);
            push({ min, max });
          }}
          options={budgetOptions}
          placeholder="Price"
          ariaLabel="Budget"
          compactLabel
        />
      </div>

      <SearchFilterChips chips={chips} />
    </div>
  );
}
