"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAreasForSearchCity,
  getAllCities,
  POPULAR_CITIES,
} from "@/lib/constants";
import {
  budgetContextFromDealKey,
  budgetNativeSelectOptions,
  budgetParamsFromValue,
  budgetValueMatchesContext,
} from "@/lib/budget-ranges";
import {
  SEARCH_DEAL_TYPES,
  chipToFilterParams,
  findDealChip,
} from "@/constants/listingTypes";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "hero" | "compact" | "inline";

export function SearchPanel({
  variant = "hero",
  className,
  defaultListingType = "",
}: {
  variant?: Variant;
  className?: string;
  defaultListingType?: string;
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState(defaultListingType);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const areas = city ? getAreasForSearchCity(city) : [];
  const cityOptions = variant === "hero" || variant === "inline" ? getAllCities() : [...POPULAR_CITIES];

  const budgetContext = budgetContextFromDealKey(
    listingType === "land" ? "land" : listingType || ""
  );
  const budgetOptions = useMemo(
    () => budgetNativeSelectOptions(budgetContext),
    [budgetContext]
  );

  function search() {
    const params = new URLSearchParams();
    const hub = listingType === "land" ? "land_sale" : null;
    const propertyType =
      listingType === "hotel"
        ? "hotel"
        : listingType === "shops"
          ? "shop"
          : null;
    const chip = findDealChip(listingType, hub, propertyType);
    if (chip) {
      const filters = chipToFilterParams(chip);
      if (filters.hub) params.set("hub", filters.hub);
      if (filters.type) params.set("type", filters.type);
      if (filters.property_type) params.set("property_type", filters.property_type);
    }
    if (city) params.set("city", city);
    if (area) params.set("area", area);
    const { min, max } = budgetParamsFromValue(budget);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    router.push(`/search?${params.toString()}`);
  }

  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-2xl bg-elevated shadow-float-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        isHero && "p-6 lg:p-8",
        isCompact && "p-4",
        variant === "inline" && "p-4 lg:p-5",
        className
      )}
    >
      {!isCompact && (
        <p className="mb-4 text-sm font-semibold text-foreground lg:text-base">
          Looking for
        </p>
      )}
      <div
        className={cn(
          "hide-scrollbar flex gap-2 overflow-x-auto",
          isCompact ? "mb-3" : "mb-5",
          isHero && "lg:mb-6"
        )}
      >
        {SEARCH_DEAL_TYPES.map((t) => {
          const chipValue = t.hub
            ? "land"
            : t.propertyType === "hotel"
              ? "hotel"
              : t.propertyType === "shop"
                ? "shops"
                : t.value;
          return (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              const nextContext = budgetContextFromDealKey(
                chipValue === "land" ? "land" : chipValue || ""
              );
              setListingType(chipValue);
              if (!budgetValueMatchesContext(budget, nextContext)) {
                setBudget("");
              }
            }}
            className={cn(
              "pressable shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all lg:py-3",
              listingType === chipValue
                ? "bg-gold text-navy shadow-glow-gold"
                : "bg-surface text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        );
        })}
      </div>
      <div
        className={cn(
          "grid gap-3",
          isHero
            ? "sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setArea("");
          }}
          className="h-12 rounded-xl bg-surface px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-gold/40 lg:h-14"
        >
          <option value="">All cities</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {areas.length > 0 ? (
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-12 rounded-xl bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-gold/40 lg:h-14"
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Area"
            className="h-12 rounded-xl bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-gold/40 lg:h-14"
          />
        )}
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="h-12 rounded-xl bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-gold/40 lg:h-14"
        >
          {budgetOptions.map((b) => (
            <option key={b.value || "any"} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={search}
          className="pressable flex h-12 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold lg:h-14 lg:text-base"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </div>
  );
}
