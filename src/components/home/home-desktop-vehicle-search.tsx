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

/** Mirrors property All / Rent / Buy / Land — vehicle types that fit the hero. */
const VEHICLE_DEAL_CHIPS = [
  { value: "", label: "All" },
  { value: "car", label: "Cars" },
  { value: "suv", label: "SUVs" },
  { value: "truck", label: "Trucks" },
] as const;

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: {
    state?: string;
    city?: string;
    make?: string;
    budgetValue?: string;
    category?: string;
  };
  className?: string;
};

/**
 * Desktop hero vehicle search — chips + State · City · Make · Budget.
 * Same intelligent search path as /vehicles (no duplicate engine).
 */
export function HomeDesktopVehicleSearch({
  onSearch,
  initial,
  className,
}: Props) {
  const [category, setCategory] = useState(initial?.category ?? "");
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
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (make) params.set("make", make);
    if (budget) {
      const { min, max } = budgetParamsFromValue(budget);
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    const chipLabel = VEHICLE_DEAL_CHIPS.find((c) => c.value === category)?.label;
    const labelParts = [
      make || (chipLabel && chipLabel !== "All" ? chipLabel : "Vehicles"),
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
        "yike-search-shell rounded-2xl border border-white/14 bg-[#031B4E]/92 p-3 shadow-search ring-1 ring-white/12 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-2.5 flex flex-wrap gap-2 lg:justify-start">
        {VEHICLE_DEAL_CHIPS.map((chip) => {
          const active = category === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setCategory(chip.value)}
              className={cn(
                "pressable rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 sm:px-4 sm:text-xs",
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
          className="pressable yike-btn-accent col-span-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-navy sm:col-span-1 lg:col-auto lg:h-12 lg:min-w-[3.5rem]"
          aria-label="Search vehicles"
        >
          <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}
