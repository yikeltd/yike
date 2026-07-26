"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStateForCity } from "@/lib/constants";
import {
  budgetParamsFromValue,
  budgetValueFromSearchParams,
  buildBudgetSelectOptions,
  encodeBudgetValue,
} from "@/lib/budget-ranges";
import {
  buildCitySelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
import {
  buildVehicleMakeSelectOptions,
  buildVehicleTypeSelectOptions,
} from "@/lib/marketplace/vehicle-makes";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { ThemedSelect } from "@/components/ui/themed-select";
import { cn } from "@/lib/utils";

/**
 * Vehicle refine filters — same interaction model as property SearchRefineFilters.
 * Primary: State · City · Category · Budget, then Make · Model.
 */
export function VehicleRefineFilters({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const state = sp.get("state") ?? "";
  const city = sp.get("city") ?? "";
  const category = sp.get("category") ?? "";
  const make = sp.get("make") ?? "";
  const model = sp.get("model") ?? "";

  const budgetValue = useMemo(
    () =>
      budgetValueFromSearchParams(sp.get("min_price"), sp.get("max_price")) ||
      (sp.get("min_price") || sp.get("max_price")
        ? encodeBudgetValue(
            sp.get("min_price") ? Number(sp.get("min_price")) : null,
            sp.get("max_price") ? Number(sp.get("max_price")) : null,
          )
        : ""),
    [sp],
  );

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptionsList = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Any category" },
      ...VEHICLE_CATEGORIES.map((c) => ({ value: c.id, label: c.plural })),
    ],
    [],
  );
  const makeOptions = useMemo(() => buildVehicleMakeSelectOptions(), []);
  const modelOptions = useMemo(
    () => buildVehicleTypeSelectOptions(make),
    [make],
  );
  const budgetOptions = useMemo(() => buildBudgetSelectOptions("sale"), []);

  function push(updates: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/vehicles?${qs}` : "/vehicles");
  }

  return (
    <div className={cn("space-y-3 px-3 pb-3 pt-1", className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ThemedSelect
          value={state}
          onChange={(value) => {
            push({ state: value || null, city: null });
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
              ...(inferred ? { state: inferred } : {}),
            });
          }}
          options={cityOptionsList}
          placeholder="City"
          ariaLabel="City"
        />
        <ThemedSelect
          value={category}
          onChange={(value) => {
            push({ category: value || null });
          }}
          options={categoryOptions}
          placeholder="Category"
          ariaLabel="Vehicle category"
        />
        <ThemedSelect
          value={budgetValue}
          onChange={(value) => {
            const { min, max } = budgetParamsFromValue(value);
            push({
              min_price: min,
              max_price: max,
            });
          }}
          options={budgetOptions}
          placeholder="Price"
          ariaLabel="Budget"
          compactLabel
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ThemedSelect
          value={make}
          onChange={(value) => {
            push({ make: value || null, model: null });
          }}
          options={makeOptions}
          placeholder="Make"
          ariaLabel="Vehicle make"
        />
        <ThemedSelect
          value={model}
          onChange={(value) => {
            push({ model: value || null });
          }}
          options={modelOptions}
          placeholder="Model"
          ariaLabel="Vehicle model"
          disabled={!make}
        />
      </div>
    </div>
  );
}
