"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateDisplayLabel,
  getStateForCity,
  getStates,
} from "@/lib/constants";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  budgetIndexFromSearchParams,
  budgetParamsFromIndex,
  budgetSelectOptions,
} from "@/lib/budget-ranges";
import { ThemedSelect } from "@/components/ui/themed-select";
import { cn } from "@/lib/utils";
import { ShieldCheck, Star } from "lucide-react";

export function SearchRefineFilters({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const state = sp.get("state") ?? "";
  const city = sp.get("city") ?? "";
  const propertyType = sp.get("property_type") ?? "";
  const verified = sp.get("verified") === "1";
  const featured = sp.get("featured") === "1";

  const budgetIndex = useMemo(
    () => String(budgetIndexFromSearchParams(sp.get("min"), sp.get("max"))),
    [sp]
  );

  const cityOptions = useMemo(
    () => (state ? getAllCitiesForState(state) : getAllCitiesComplete()),
    [state]
  );

  const stateOptions = useMemo(
    () => [
      { value: "", label: "Any state" },
      ...getStates().map((s) => ({
        value: s,
        label: getStateDisplayLabel(s),
      })),
    ],
    []
  );

  const cityOptionsList = useMemo(
    () => [
      { value: "", label: "Any city" },
      ...cityOptions.map((c) => ({ value: c, label: c })),
    ],
    [cityOptions]
  );

  const propertyTypeOptions = useMemo(
    () => [
      { value: "", label: "Any property type" },
      ...PROPERTY_TYPES.slice(0, 16).map((t) => ({
        value: t.value,
        label: t.label,
      })),
    ],
    []
  );

  const budgetOptions = useMemo(() => budgetSelectOptions(), []);

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

  return (
    <div className={cn("grid grid-cols-2 gap-2.5 px-3 pb-3 pt-1", className)}>
      <ThemedSelect
        value={state}
        onChange={(value) => {
          push({ state: value || null, city: null, area: null });
        }}
        options={stateOptions}
        placeholder="Any state"
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
        placeholder="Any city"
        ariaLabel="City"
      />
      <div className="col-span-2 sm:col-span-1">
        <ThemedSelect
          value={propertyType}
          onChange={(value) => {
            push({
              property_type: value || null,
              hub: value === "land" ? "land_sale" : null,
            });
          }}
          options={propertyTypeOptions}
          placeholder="Any property type"
          ariaLabel="Property type"
        />
      </div>
      <ThemedSelect
        value={budgetIndex}
        onChange={(value) => {
          const { min, max } = budgetParamsFromIndex(Number(value));
          push({ min, max });
        }}
        options={budgetOptions}
        placeholder="Any budget"
        ariaLabel="Budget"
      />

      <div className="col-span-2 flex gap-2">
        <button
          type="button"
          onClick={() => toggleFlag("verified")}
          className={cn(
            "pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold",
            verified
              ? "bg-gold text-navy shadow-glow-gold"
              : "border border-navy/10 bg-white text-muted"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified
        </button>
        <button
          type="button"
          onClick={() => toggleFlag("featured")}
          className={cn(
            "pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold",
            featured
              ? "bg-gold text-navy shadow-glow-gold"
              : "border border-navy/10 bg-white text-muted"
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Featured
        </button>
      </div>
    </div>
  );
}
