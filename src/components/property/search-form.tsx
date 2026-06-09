"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAreasForSearchCity,
  LISTING_TYPES,
  POPULAR_CITIES,
} from "@/lib/constants";
import {
  budgetContextFromSearchParams,
  budgetLabelFromValue,
  budgetNativeSelectOptions,
  budgetParamsFromValue,
  budgetValueMatchesContext,
} from "@/lib/budget-ranges";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Search } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [listingType, setListingType] = useState("rent");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");

  const budgetContext = budgetContextFromSearchParams({ type: listingType });
  const budgetOptions = useMemo(
    () => budgetNativeSelectOptions(budgetContext),
    [budgetContext]
  );

  const areas = city ? getAreasForSearchCity(city) : [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", listingType);
    if (city) params.set("city", city);
    if (area) params.set("area", area);
    const { min, max } = budgetParamsFromValue(budget);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    trackEvent("search", {
      city: city || undefined,
      area: area || undefined,
      listing_type: listingType,
      budget: budgetLabelFromValue(budget, budgetContext) ?? undefined,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className={
        compact
          ? "space-y-3"
          : "card-shadow space-y-3 rounded-2xl border border-border bg-white p-4"
      }
    >
      <p className="text-sm font-medium text-muted">
        What are you looking for?
      </p>
      <div className="flex gap-2">
        {LISTING_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              const nextContext = budgetContextFromSearchParams({
                type: t.value,
              });
              setListingType(t.value);
              if (!budgetValueMatchesContext(budget, nextContext)) {
                setBudget("");
              }
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              listingType === t.value
                ? "bg-gold text-navy font-semibold shadow-sm"
                : "bg-surface text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Select
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          setArea("");
        }}
        aria-label="City"
      >
        <option value="">All cities</option>
        {POPULAR_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      {areas.length > 0 ? (
        <Select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          aria-label="Area"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      ) : (
        <Select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Area (optional)</option>
        </Select>
      )}
      <Select
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        aria-label="Budget"
      >
        {budgetOptions.map((b) => (
          <option key={b.value || "any"} value={b.value}>
            {b.label}
          </option>
        ))}
      </Select>
      <Button type="submit" fullWidth size="lg">
        <Search className="h-4 w-4" />
        Search homes
      </Button>
    </form>
  );
}
