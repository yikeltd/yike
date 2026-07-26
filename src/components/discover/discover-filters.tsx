"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  buildCitySelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
import {
  buildBudgetSelectOptions,
  budgetParamsFromValue,
  encodeBudgetValue,
} from "@/lib/budget-ranges";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";
import type { DiscoverFilterState, DiscoverDeal } from "@/lib/discover/filters";

type Props = {
  open: boolean;
  filters: DiscoverFilterState;
  onChange: (next: DiscoverFilterState) => void;
  onClose: () => void;
};

const DEAL_OPTIONS: { value: DiscoverDeal; label: string }[] = [
  { value: "", label: "Any deal" },
  { value: "rent", label: "Rent / Short let" },
  { value: "sale", label: "Buy" },
  { value: "land", label: "Land" },
];

export function DiscoverFilters({ open, filters, onChange, onClose }: Props) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(filters.state || undefined),
    [filters.state],
  );
  const budgetOptions = useMemo(
    () =>
      buildBudgetSelectOptions(
        filters.deal === "sale" || filters.deal === "land" ? "sale" : "rent",
      ),
    [filters.deal],
  );

  const budgetValue =
    filters.maxBudget != null
      ? encodeBudgetValue(null, filters.maxBudget)
      : "";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-navy/55 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6"
      role="dialog"
      aria-modal
      aria-label="Discover filters"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="relative max-h-[min(88dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-float-lg lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-navy/[0.06] text-navy"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {vehiclesOn ? (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-navy/45">
              Category
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "property", label: "Properties" },
                  { value: "vehicle", label: "Vehicles" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...filters,
                      category: opt.value,
                      deal: opt.value === "vehicle" ? "" : filters.deal,
                    })
                  }
                  className={cn(
                    "pressable min-h-[44px] rounded-xl text-sm font-bold",
                    filters.category === opt.value
                      ? "bg-navy text-white"
                      : "bg-navy/[0.05] text-navy/70",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {filters.category === "property" ? (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-navy/45">
              Buy / Rent
            </p>
            <div className="flex flex-wrap gap-2">
              {DEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "any"}
                  type="button"
                  onClick={() => onChange({ ...filters, deal: opt.value })}
                  className={cn(
                    "pressable rounded-full px-3.5 py-2 text-xs font-bold",
                    filters.deal === opt.value
                      ? "bg-gold text-navy"
                      : "bg-navy/[0.05] text-navy/65",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <ThemedSelect
            value={filters.state}
            onChange={(state) =>
              onChange({ ...filters, state, city: "" })
            }
            options={stateOptions}
            placeholder="State"
            ariaLabel="State"
          />
          <ThemedSelect
            value={filters.city}
            onChange={(city) => onChange({ ...filters, city })}
            options={cityOptions}
            placeholder="City"
            ariaLabel="City"
          />
        </div>

        <div className="mb-4">
          <ThemedSelect
            value={budgetValue}
            onChange={(value) => {
              const { max } = budgetParamsFromValue(value);
              onChange({
                ...filters,
                maxBudget: max ? Number(max) : null,
              });
            }}
            options={budgetOptions}
            placeholder="Max budget"
            ariaLabel="Budget"
            compactLabel
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({ ...filters, featuredOnly: !filters.featuredOnly })
            }
            className={cn(
              "pressable rounded-full px-3.5 py-2 text-xs font-bold",
              filters.featuredOnly
                ? "bg-gold text-navy"
                : "bg-navy/[0.05] text-navy/65",
            )}
          >
            Featured only
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })
            }
            className={cn(
              "pressable rounded-full px-3.5 py-2 text-xs font-bold",
              filters.verifiedOnly
                ? "bg-gold text-navy"
                : "bg-navy/[0.05] text-navy/65",
            )}
          >
            Verified only
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="pressable yike-btn-accent flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gold text-sm font-bold text-navy"
        >
          Show results
        </button>
      </div>
    </div>
  );
}
