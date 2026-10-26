"use client";

import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  Building2,
  Car,
  MapPin,
  Sparkles,
  User,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/constants";
import {
  clearIncompatibleFilterFields,
  defaultSmartFilterState,
  hydrateSmartFilterFormState,
  ELECTRONICS_BRANDS,
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_CONDITIONS,
  type FilterVertical,
  type SmartFilterFormState,
} from "@/lib/search/smart-filter-engine";
import { usePathname, useSearchParams } from "next/navigation";
import { VEHICLE_MAKES, VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";
import {
  vehiclePrimaryCategorySelectOptions,
  VEHICLE_CATEGORY_GROUPS,
  VEHICLE_CONDITION_OPTIONS,
} from "@/lib/marketplace/vehicle-specs";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

export type { FilterVertical };

export function SearchContextFilters({
  activeVertical = "all",
  onApply,
  onClose,
}: {
  activeVertical?: FilterVertical;
  onApply: (filters: SmartFilterFormState) => void;
  onClose: () => void;
}) {
  const electronicsOn = isLaunchFeatureVisible("electronics_marketplace");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<SmartFilterFormState>(() =>
    hydrateSmartFilterFormState(
      pathname,
      new URLSearchParams(searchParams.toString()),
      activeVertical,
    ),
  );

  useEffect(() => {
    setForm(
      hydrateSmartFilterFormState(
        pathname,
        new URLSearchParams(searchParams.toString()),
        activeVertical,
      ),
    );
  }, [pathname, searchParams, activeVertical]);

  const modelOptions = form.make ? VEHICLE_MAKE_TYPES[form.make] || [] : [];

  function setVertical(next: FilterVertical) {
    setForm((prev) => clearIncompatibleFilterFields(prev, next));
  }

  function handleReset() {
    const reset = defaultSmartFilterState("all");
    setForm(reset);
    onApply(reset);
    onClose();
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(form);
    onClose();
  }

  const tabs: {
    id: FilterVertical;
    label: string;
    icon: typeof Sparkles;
    hidden?: boolean;
  }[] = [
    { id: "all", label: "All Categories", icon: Sparkles },
    { id: "property", label: "Properties", icon: Building2 },
    { id: "vehicle", label: "Vehicles", icon: Car },
    { id: "electronics", label: "Electronics", icon: Smartphone, hidden: !electronicsOn },
    { id: "land", label: "Land", icon: MapPin },
    { id: "agent", label: "Agents", icon: User },
  ];

  const { vertical } = form;
  const showSharedBudget =
    vertical === "all" ||
    vertical === "property" ||
    vertical === "land" ||
    vertical === "vehicle" ||
    vertical === "electronics";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 p-0 backdrop-blur-xs animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-navy/10 bg-white text-navy shadow-2xl animate-in slide-in-from-bottom-6 duration-200 sm:rounded-3xl dark:border-white/10 dark:bg-navy dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#031B4E] px-5 py-4 text-white dark:border-white/10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gold" />
            <h2 className="text-base font-black">Smart Filter Engine</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/20"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50 p-2 dark:border-white/10 dark:bg-navy-light">
          {tabs
            .filter((t) => !t.hidden)
            .map((item) => {
              const Icon = item.icon;
              const isActive = vertical === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVertical(item.id)}
                  className={cn(
                    "pressable flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition-all",
                    isActive
                      ? "bg-[#031B4E] text-white shadow-md dark:bg-gold dark:text-navy"
                      : "text-navy/70 hover:bg-slate-200 dark:text-white/70 dark:hover:bg-white/10",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
              Keywords
            </h4>
            <input
              type="search"
              value={form.q ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search title, brand, model, area…"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-gold dark:border-white/20 dark:bg-navy-light"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
              Location
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-navy/70">State</label>
                <select
                  value={form.state ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-gold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All Nigeria</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-navy/70">City / Area</label>
                <input
                  type="text"
                  value={form.city ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Lekki, Ikeja…"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-gold dark:border-white/20 dark:bg-navy-light"
                />
              </div>
            </div>
          </div>

          {(vertical === "property" || vertical === "land") && (
            <div className="space-y-3 border-t border-slate-100 pt-2 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Property
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.listing_type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, listing_type: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">Any deal</option>
                  <option value="sale">For sale</option>
                  <option value="rent">For rent</option>
                  <option value="lease">Lease</option>
                </select>
                <select
                  value={form.property_type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All types</option>
                  <option value="flat">Apartment / flat</option>
                  <option value="duplex">Duplex</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="land">Land plot</option>
                  <option value="office">Office</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              {vertical === "property" ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {["", "1", "2", "3", "4+"].map((b) => (
                    <button
                      key={b || "any"}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, beds: b }))}
                      className={cn(
                        "rounded-xl border py-2 text-xs font-bold",
                        form.beds === b
                          ? "border-[#031B4E] bg-[#031B4E] text-white dark:border-gold dark:bg-gold dark:text-navy"
                          : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5",
                      )}
                    >
                      {b ? `${b} bed` : "Any"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {vertical === "vehicle" && (
            <div className="space-y-3 border-t border-slate-100 pt-2 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Vehicles
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.vehicle_group ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vehicle_group: e.target.value,
                      vehicle_category: e.target.value ? "" : f.vehicle_category,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All type groups</option>
                  {VEHICLE_CATEGORY_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.vehicle_category ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vehicle_category: e.target.value,
                      vehicle_group: e.target.value ? "" : f.vehicle_group,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All categories</option>
                  {vehiclePrimaryCategorySelectOptions().map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.make ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, make: e.target.value, model: "" }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All makes</option>
                  {VEHICLE_MAKES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={form.model ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  disabled={!form.make}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold disabled:opacity-50 dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All models</option>
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={form.vehicle_condition ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, vehicle_condition: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
              >
                <option value="">All conditions</option>
                {VEHICLE_CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {vertical === "electronics" && (
            <div className="space-y-3 border-t border-slate-100 pt-2 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Electronics
              </h4>
              <select
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
              >
                <option value="">All electronics categories</option>
                {ELECTRONICS_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.condition ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All conditions</option>
                  {ELECTRONICS_CONDITIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.brand ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                >
                  <option value="">All brands</option>
                  {ELECTRONICS_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {vertical === "agent" && (
            <div className="space-y-3 border-t border-slate-100 pt-2 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Agents
              </h4>
              <select
                value={form.role ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
              >
                <option value="">All verified partners</option>
                <option value="agent">Real estate agents</option>
                <option value="dealer">Auto dealers</option>
                <option value="verifier">Field verifiers</option>
                <option value="legal">Legal partners</option>
              </select>
            </div>
          )}

          {showSharedBudget ? (
            <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-white/10">
              <h4 className="font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                Budget (₦)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={
                    vertical === "electronics" || vertical === "vehicle"
                      ? (form.min_price ?? "")
                      : (form.min ?? "")
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (vertical === "electronics" || vertical === "vehicle") {
                      setForm((f) => ({ ...f, min_price: v }));
                    } else {
                      setForm((f) => ({ ...f, min: v }));
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={
                    vertical === "electronics" || vertical === "vehicle"
                      ? (form.max_price ?? "")
                      : (form.max ?? "")
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (vertical === "electronics" || vertical === "vehicle") {
                      setForm((f) => ({ ...f, max_price: v }));
                    } else {
                      setForm((f) => ({ ...f, max: v }));
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-white/20 dark:bg-navy-light"
                />
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-100 pt-3 dark:border-white/10">
            <button
              type="submit"
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-[#031B4E] py-3.5 text-xs font-black text-white shadow-md hover:bg-navy/90 dark:bg-gold dark:text-navy"
            >
              <Check className="h-4 w-4" />
              Apply filters & search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
