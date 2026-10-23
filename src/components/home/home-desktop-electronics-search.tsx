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
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_CONDITIONS,
} from "@/lib/marketplace/electronics-specs";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { cn } from "@/lib/utils";

type Props = {
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: {
    state?: string;
    city?: string;
    category?: string;
    condition?: string;
    budgetValue?: string;
  };
  className?: string;
  /** Tighter grid for mobile hero. */
  compact?: boolean;
};

export function HomeDesktopElectronicsSearch({
  onSearch,
  initial,
  className,
  compact = false,
}: Props) {
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [budget, setBudget] = useState(initial?.budgetValue ?? "");

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const budgetOptions = useMemo(() => buildBudgetSelectOptions("sale"), []);
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...ELECTRONICS_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
    ],
    [],
  );
  const conditionOptions = useMemo(
    () => [
      { value: "", label: "Any condition" },
      ...ELECTRONICS_CONDITIONS.map((c) => ({ value: c.id, label: c.label })),
    ],
    [],
  );

  function submit() {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);
    if (budget) {
      const { min, max } = budgetParamsFromValue(budget);
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    const catLabel = ELECTRONICS_CATEGORIES.find((c) => c.id === category)?.label;
    const labelParts = [catLabel || "Electronics", city || state || undefined].filter(Boolean);

    onSearch({
      params,
      label: labelParts.join(" · ") || "Electronics",
    });
  }

  return (
    <div
      className={cn(
        compact
          ? "space-y-2"
          : "yike-search-shell rounded-2xl border border-white/14 bg-[#031B4E]/92 p-3 shadow-search ring-1 ring-white/12 backdrop-blur-sm",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-2",
          compact
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-center",
        )}
      >
        <ThemedSelect
          variant={compact ? "default" : "hero"}
          ariaLabel="State"
          value={state}
          onChange={(v) => {
            setState(v);
            setCity("");
          }}
          options={stateOptions}
          placeholder="State"
        />
        <ThemedSelect
          variant={compact ? "default" : "hero"}
          ariaLabel="City"
          value={city}
          onChange={setCity}
          options={cityOptions}
          placeholder="City"
        />
        <ThemedSelect
          variant={compact ? "default" : "hero"}
          ariaLabel="Electronics category"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          placeholder="Category"
        />
        <ThemedSelect
          variant={compact ? "default" : "hero"}
          ariaLabel="Condition"
          value={condition}
          onChange={setCondition}
          options={conditionOptions}
          placeholder="Condition"
        />
        <ThemedSelect
          variant={compact ? "default" : "hero"}
          ariaLabel="Budget"
          value={budget}
          onChange={setBudget}
          options={budgetOptions}
          placeholder="Budget"
        />
        <button
          type="button"
          onClick={submit}
          className={cn(
            "pressable flex items-center justify-center rounded-2xl bg-gold font-black text-navy shadow-md transition-all hover:bg-gold-light",
            compact ? "col-span-2 h-11 sm:col-span-3" : "h-11 w-full lg:h-11 lg:w-11",
          )}
          aria-label="Search electronics"
        >
          <Search className="h-5 w-5 stroke-[2.5]" />
          {compact ? <span className="ml-2 text-sm">Search</span> : null}
        </button>
      </div>
    </div>
  );
}
