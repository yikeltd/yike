"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BUDGET_RANGES,
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateForCity,
  getStates,
} from "@/lib/constants";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import { cn } from "@/lib/utils";
import { ShieldCheck, Star } from "lucide-react";

const selectClass =
  "h-10 w-full rounded-xl border border-navy/10 bg-white px-3 text-xs font-medium text-foreground outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/25 lg:text-sm";

export function SearchRefineFilters({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const state = sp.get("state") ?? "";
  const city = sp.get("city") ?? "";
  const propertyType = sp.get("property_type") ?? "";
  const verified = sp.get("verified") === "1";
  const featured = sp.get("featured") === "1";

  const budgetIndex = useMemo(() => {
    const min = sp.get("min");
    const max = sp.get("max");
    if (!min && !max) return 0;
    const idx = BUDGET_RANGES.findIndex(
      (b) =>
        (min ? String(b.min) === min : !b.min) &&
        (max ? String(b.max) === max : !b.max)
    );
    return idx === -1 ? 0 : idx;
  }, [sp]);

  const cityOptions = useMemo(
    () => (state ? getAllCitiesForState(state) : getAllCitiesComplete()),
    [state]
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

  return (
    <div className={cn("grid grid-cols-2 gap-2.5 px-3 pb-3 pt-1", className)}>
      <select
        value={state}
        onChange={(e) => {
          const value = e.target.value;
          push({ state: value || null, city: null, area: null });
        }}
        aria-label="State"
        className={selectClass}
      >
        <option value="">Any state</option>
        {getStates().map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={city}
        onChange={(e) => {
          const value = e.target.value;
          const inferred = value ? getStateForCity(value) : "";
          push({
            city: value || null,
            area: null,
            ...(inferred ? { state: inferred } : {}),
          });
        }}
        aria-label="City"
        className={selectClass}
      >
        <option value="">Any city</option>
        {cityOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={propertyType}
        onChange={(e) => {
          const value = e.target.value;
          push({
            property_type: value || null,
            hub: value === "land" ? "land_sale" : null,
          });
        }}
        aria-label="Property type"
        className={cn(selectClass, "col-span-2 sm:col-span-1")}
      >
        <option value="">Any Property Type</option>
        {PROPERTY_TYPES.slice(0, 16).map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <select
        value={budgetIndex}
        onChange={(e) => {
          const range = BUDGET_RANGES[Number(e.target.value)];
          push({
            min: range?.min ? String(range.min) : null,
            max: range?.max ? String(range.max) : null,
          });
        }}
        aria-label="Budget"
        className={selectClass}
      >
        {BUDGET_RANGES.map((b, i) => (
          <option key={b.label} value={i}>
            {b.label}
          </option>
        ))}
      </select>

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
