"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, MapPin, Car, Wallet, Calendar, Home, BedDouble } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  buildCitySelectOptions,
  buildStateSelectOptions,
} from "@/lib/search-dropdown-options";
import { budgetParamsFromValue, encodeBudgetValue } from "@/lib/budget-ranges";
import {
  buildVehicleMakeSelectOptions,
  buildVehicleTypeSelectOptions,
} from "@/lib/marketplace/vehicle-makes";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { cn } from "@/lib/utils";

/** Curated vehicle purchase bands — marketplace confidence, not free typing. */
const VEHICLE_BUDGET_OPTIONS = [
  { value: "", label: "Any budget" },
  { value: encodeBudgetValue(0, 5_000_000), label: "₦0 – ₦5M" },
  { value: encodeBudgetValue(5_000_000, 10_000_000), label: "₦5M – ₦10M" },
  { value: encodeBudgetValue(10_000_000, 20_000_000), label: "₦10M – ₦20M" },
  { value: encodeBudgetValue(20_000_000, 50_000_000), label: "₦20M – ₦50M" },
  { value: encodeBudgetValue(50_000_000, 100_000_000), label: "₦50M – ₦100M" },
  { value: encodeBudgetValue(100_000_000, 1_000_000_000), label: "₦100M – ₦1B" },
  { value: encodeBudgetValue(1_000_000_000, null), label: "Above ₦1B" },
];

const PROPERTY_BUDGET_OPTIONS = [
  { value: "", label: "Any budget" },
  { value: encodeBudgetValue(0, 5_000_000), label: "₦0 – ₦5M" },
  { value: encodeBudgetValue(5_000_000, 20_000_000), label: "₦5M – ₦20M" },
  { value: encodeBudgetValue(20_000_000, 50_000_000), label: "₦20M – ₦50M" },
  { value: encodeBudgetValue(50_000_000, 100_000_000), label: "₦50M – ₦100M" },
  { value: encodeBudgetValue(100_000_000, 250_000_000), label: "₦100M – ₦250M" },
  { value: encodeBudgetValue(250_000_000, 500_000_000), label: "₦250M – ₦500M" },
  { value: encodeBudgetValue(500_000_000, 1_000_000_000), label: "₦500M – ₦1B" },
  { value: encodeBudgetValue(1_000_000_000, null), label: "Above ₦1B" },
];

/** Year: specific or range — encoded for min_year / max_year. */
const YEAR_OPTIONS = [
  { value: "", label: "Any year" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2020", label: "2020" },
  { value: "2018-2022", label: "2018–2022" },
  { value: "2015-2019", label: "2015–2019" },
  { value: "2020+", label: "2020+" },
  { value: "2015+", label: "2015+" },
  { value: "2010+", label: "2010+" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "flat_2", label: "Apartment" },
  { value: "detached_duplex", label: "Duplex" },
  { value: "bungalow", label: "Bungalow" },
  { value: "land_residential", label: "Land" },
  { value: "shop", label: "Shop" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
];

const BED_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

type Props = {
  category: HomeMarketplaceCategory;
  onSearch: (payload: BrowseSearchPayload) => void;
  initial?: {
    state?: string;
    city?: string;
    make?: string;
    budgetValue?: string;
    propertyType?: string;
  };
  className?: string;
  tone?: "light" | "hero";
  /** Collapsed chip row by default — expand for full stack. */
  defaultOpen?: boolean;
};

function applyYearParams(params: URLSearchParams, year: string) {
  if (!year) return;
  if (year.endsWith("+")) {
    params.set("min_year", year.replace("+", ""));
    return;
  }
  if (year.includes("-")) {
    const [min, max] = year.split("-");
    if (min) params.set("min_year", min);
    if (max) params.set("max_year", max);
    return;
  }
  params.set("min_year", year);
  params.set("max_year", year);
}

/**
 * Marketplace discovery filters — no form title, no Find button.
 * First meaningful choice navigates immediately.
 */
export function QuickFinderBar({
  category,
  onSearch,
  initial,
  className,
  tone = "light",
  defaultOpen = false,
}: Props) {
  const isVehicle = category === "vehicle";
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState(initial?.budgetValue ?? "");
  const [year, setYear] = useState("");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [beds, setBeds] = useState("");

  const stateOptions = useMemo(() => buildStateSelectOptions(), []);
  const cityOptions = useMemo(
    () => buildCitySelectOptions(state || undefined),
    [state],
  );
  const makeOptions = useMemo(() => buildVehicleMakeSelectOptions(), []);
  const modelOptions = useMemo(
    () => buildVehicleTypeSelectOptions(make),
    [make],
  );
  const budgetOptions = isVehicle
    ? VEHICLE_BUDGET_OPTIONS
    : PROPERTY_BUDGET_OPTIONS;

  const selectVariant = tone === "hero" ? "hero" : "default";

  const runSearch = useCallback(
    (next: {
      state?: string;
      city?: string;
      make?: string;
      model?: string;
      budget?: string;
      year?: string;
      propertyType?: string;
      beds?: string;
    }) => {
      const s = next.state ?? state;
      const c = next.city ?? city;
      const m = next.make ?? make;
      const mo = next.model ?? model;
      const b = next.budget ?? budget;
      const y = next.year ?? year;
      const pt = next.propertyType ?? propertyType;
      const bd = next.beds ?? beds;

      const meaningful = Boolean(
        s || c || m || mo || b || y || pt || bd,
      );
      if (!meaningful) return;

      const params = new URLSearchParams();
      if (s) params.set("state", s);
      if (c) params.set("city", c);
      if (b) {
        const { min, max } = budgetParamsFromValue(b);
        if (isVehicle) {
          if (min) params.set("min_price", min);
          if (max) params.set("max_price", max);
        } else {
          if (min) params.set("min", min);
          if (max) params.set("max", max);
        }
      }

      if (isVehicle) {
        if (m) params.set("make", m);
        if (mo) params.set("model", mo);
        applyYearParams(params, y);
        const labelParts = [m || "Vehicles", mo, c || s || undefined].filter(
          Boolean,
        );
        onSearch({
          params,
          label: labelParts.join(" · ") || "Vehicles",
        });
        return;
      }

      if (pt) params.set("property_type", pt);
      if (bd) params.set("beds", bd);
      const labelParts = ["Properties", c || s || undefined].filter(Boolean);
      onSearch({
        params,
        label: labelParts.join(" · ") || "Properties",
      });
    },
    [
      state,
      city,
      make,
      model,
      budget,
      year,
      propertyType,
      beds,
      isVehicle,
      onSearch,
    ],
  );

  const locationChip = city
    ? `${city}`
    : state
      ? state
      : "Location";
  const makeChip = isVehicle
    ? model
      ? `${make} ${model}`
      : make || "Make"
    : propertyType
      ? PROPERTY_TYPE_OPTIONS.find((o) => o.value === propertyType)?.label ||
        "Type"
      : "Type";
  const budgetChip = budget
    ? budgetOptions.find((o) => o.value === budget)?.label || "Budget"
    : "Budget";
  const yearChip = isVehicle
    ? year
      ? YEAR_OPTIONS.find((o) => o.value === year)?.label || "Year"
      : "Year"
    : beds
      ? `${beds}+ beds`
      : "Beds";

  const chips = [
    { id: "loc", label: locationChip, Icon: MapPin },
    { id: "make", label: makeChip, Icon: isVehicle ? Car : Home },
    { id: "budget", label: budgetChip, Icon: Wallet },
    { id: "year", label: yearChip, Icon: isVehicle ? Calendar : BedDouble },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/10 bg-white/95 shadow-[0_10px_28px_-18px_rgba(3,27,78,0.35)] backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map(({ id, label, Icon }) => (
            <span
              key={id}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                label !== "Location" &&
                  label !== "Make" &&
                  label !== "Type" &&
                  label !== "Budget" &&
                  label !== "Year" &&
                  label !== "Beds"
                  ? "border-gold/40 bg-gold/15 text-navy"
                  : "border-navy/10 bg-navy/[0.03] text-navy/60",
              )}
            >
              <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span className="max-w-[7rem] truncate">{label}</span>
            </span>
          ))}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-navy/40 transition",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-2.5 border-t border-navy/[0.06] px-3 pb-3 pt-2.5">
          {/* Location: state → optional city */}
          <ThemedSelect
            value={state}
            onChange={(value) => {
              setState(value);
              setCity("");
              runSearch({ state: value, city: "" });
            }}
            options={[
              { value: "", label: "Any state" },
              ...stateOptions.filter(
                (o): o is { value: string; label: string } =>
                  "value" in o && typeof o.value === "string",
              ),
            ]}
            placeholder="State"
            ariaLabel="State"
            variant={selectVariant}
          />
          {state ? (
            <ThemedSelect
              value={city}
              onChange={(value) => {
                setCity(value);
                runSearch({ city: value });
              }}
              options={[
                { value: "", label: "Any city / LGA (optional)" },
                ...cityOptions.filter(
                  (o): o is { value: string; label: string } =>
                    "value" in o && typeof o.value === "string",
                ),
              ]}
              placeholder="City"
              ariaLabel="City or LGA"
              variant={selectVariant}
            />
          ) : null}

          {isVehicle ? (
            <>
              <ThemedSelect
                value={make}
                onChange={(value) => {
                  setMake(value);
                  setModel("");
                  runSearch({ make: value, model: "" });
                }}
                options={makeOptions}
                placeholder="Make"
                ariaLabel="Vehicle make"
                variant={selectVariant}
              />
              {make ? (
                <ThemedSelect
                  value={model}
                  onChange={(value) => {
                    setModel(value);
                    runSearch({ model: value });
                  }}
                  options={modelOptions}
                  placeholder="Model (optional)"
                  ariaLabel="Vehicle model"
                  variant={selectVariant}
                />
              ) : null}
            </>
          ) : (
            <ThemedSelect
              value={propertyType}
              onChange={(value) => {
                setPropertyType(value);
                runSearch({ propertyType: value });
              }}
              options={PROPERTY_TYPE_OPTIONS}
              placeholder="Property type"
              ariaLabel="Property type"
              variant={selectVariant}
            />
          )}

          <ThemedSelect
            value={budget}
            onChange={(value) => {
              setBudget(value);
              runSearch({ budget: value });
            }}
            options={budgetOptions}
            placeholder="Budget"
            ariaLabel="Budget"
            variant={selectVariant}
            compactLabel
          />

          {isVehicle ? (
            <ThemedSelect
              value={year}
              onChange={(value) => {
                setYear(value);
                runSearch({ year: value });
              }}
              options={YEAR_OPTIONS}
              placeholder="Year"
              ariaLabel="Year"
              variant={selectVariant}
            />
          ) : (
            <ThemedSelect
              value={beds}
              onChange={(value) => {
                setBeds(value);
                runSearch({ beds: value });
              }}
              options={BED_OPTIONS}
              placeholder="Bedrooms (optional)"
              ariaLabel="Bedrooms"
              variant={selectVariant}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
