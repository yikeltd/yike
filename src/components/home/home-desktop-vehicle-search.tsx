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
import { buildVehicleMakeSelectOptions } from "@/lib/marketplace/vehicle-makes";
import { getStateForCity } from "@/lib/constants";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { cn } from "@/lib/utils";

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: {
    state?: string;
    city?: string;
    make?: string;
    budgetValue?: string;
  };
  className?: string;
};

/**
 * Desktop hero vehicle search — State · City · Make · Budget.
 * Same intelligent search path as /vehicles (no duplicate engine).
 */
export function HomeDesktopVehicleSearch({
  onSearch,
  initial,
  className,
}: Props) {
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [budget, setBudget] = useState(initial?.budgetValue ?? "");

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const makeOptions = useMemo(() => buildVehicleMakeSelectOptions(), []);
  const budgetOptions = useMemo(() => buildBudgetSelectOptions("sale"), []);

  function submit() {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (make) params.set("make", make);
    if (budget) {
      const { min, max } = budgetParamsFromValue(budget);
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    const labelParts = [
      make || "Vehicles",
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
        "yike-search-shell rounded-[1.35rem] border border-white/14 bg-[#031B4E]/96 p-4 shadow-search ring-1 ring-white/12 xl:p-5",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end xl:gap-3.5">
        <ThemedSelect
          value={state}
          onChange={(value) => {
            setState(value);
            setCity("");
          }}
          options={stateOptions}
          placeholder="State"
          ariaLabel="State"
          variant="hero"
        />
        <ThemedSelect
          value={city}
          onChange={(value) => {
            setCity(value);
            const inferred = value ? getStateForCity(value) : "";
            if (inferred) setState(inferred);
          }}
          options={cityOptions}
          placeholder="City"
          ariaLabel="City"
          variant="hero"
        />
        <ThemedSelect
          value={make}
          onChange={setMake}
          options={makeOptions}
          placeholder="Vehicle Make"
          ariaLabel="Vehicle Make"
          variant="hero"
        />
        <ThemedSelect
          value={budget}
          onChange={setBudget}
          options={budgetOptions}
          placeholder="Budget"
          ariaLabel="Budget"
          variant="hero"
          compactLabel
        />
        <button
          type="button"
          onClick={submit}
          className="pressable yike-btn-accent col-span-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy sm:col-span-1 lg:col-auto lg:h-12 lg:min-w-[10.5rem]"
        >
          <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Search Vehicles
        </button>
      </div>
    </div>
  );
}
