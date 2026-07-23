"use client";

import { useMemo, useState } from "react";
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
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { cn } from "@/lib/utils";

const VEHICLE_CATEGORIES = [
  { value: "car", label: "Cars" },
  { value: "suv", label: "SUVs" },
  { value: "truck", label: "Pickups" },
  { value: "van", label: "Buses" },
  { value: "motorcycle", label: "Motorcycles" },
] as const;

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  className?: string;
  /** Compact inline controls — no card shell (homepage marketplace). */
  compact?: boolean;
};

/** Vehicle search — Category · State · City · Make · Model · Budget + strongest CTA. */
export function HomeVehicleSearch({
  onSearch,
  className,
  compact = false,
}: Props) {
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [make, setMake] = useState("");
  const [carType, setCarType] = useState("");
  const [budget, setBudget] = useState("");

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
  const categoryOptions = useMemo(
    () => VEHICLE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    [],
  );

  const typeDisabled = !make;

  function onMakeChange(nextMake: string) {
    setMake(nextMake);
    if (!nextMake || !isValidTypeForMake(nextMake, carType)) {
      setCarType("");
    }
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
      category
        ? VEHICLE_CATEGORIES.find((c) => c.value === category)?.label
        : "Vehicles",
      make || undefined,
      carType || undefined,
      city || state || undefined,
    ].filter(Boolean);

    onSearch({
      params,
      label: labelParts.join(" · ") || "Search vehicles",
    });
  }

  return (
    <div
      className={cn(
        !compact &&
          "rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_12px_40px_-18px_rgba(3,27,78,0.28)] ring-1 ring-navy/[0.04]",
        className,
      )}
    >
      {!compact ? (
        <p className="mb-3 text-center text-base font-bold tracking-tight text-navy">
          Find Your Next Vehicle
        </p>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3",
          compact ? "gap-2" : "gap-3",
        )}
      >
        <ThemedSelect
          ariaLabel="Category"
          placeholder="Any category"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
        />
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
          placeholder={typeDisabled ? "Select make first" : "Any model"}
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

      <button
        type="button"
        onClick={submit}
        className={cn(
          "pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gold font-bold text-navy shadow-glow-gold",
          compact
            ? "mt-2.5 py-3 text-[15px]"
            : "mt-3.5 py-3.5 text-[15px] sm:py-4",
        )}
      >
        <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        Search Vehicles
      </button>
    </div>
  );
}
