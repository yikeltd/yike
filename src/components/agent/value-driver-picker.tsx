"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  MAX_VALUE_DRIVER_SELECTIONS,
  VALUE_DRIVER_CATEGORIES,
  valueDriversByCategory,
} from "@/constants/valueDrivers";

export function ValueDriverPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => valueDriversByCategory(), []);
  const atLimit = selected.length >= MAX_VALUE_DRIVER_SELECTIONS;

  function toggle(key: string) {
    if (disabled) return;
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (atLimit) return;
    onChange([...selected, key]);
  }

  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search features…"
        className="h-10 w-full rounded-xl border border-navy/10 bg-white px-3 text-sm"
        disabled={disabled}
      />
      <p className="text-xs text-muted">
        {selected.length}/{MAX_VALUE_DRIVER_SELECTIONS} selected · Only select
        features you can reasonably support. Misleading claims may reduce
        visibility.
      </p>
      {VALUE_DRIVER_CATEGORIES.map((cat) => {
        const items = (grouped.get(cat.id) ?? []).filter(
          (d) => !q || d.label.toLowerCase().includes(q) || d.key.includes(q)
        );
        if (items.length === 0) return null;
        return (
          <div key={cat.id}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold-dark">
              {cat.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((d) => {
                const active = selected.includes(d.key);
                const locked = !active && atLimit;
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={disabled || locked}
                    onClick={() => toggle(d.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-gold text-navy"
                        : locked
                          ? "bg-surface text-muted/50"
                          : "bg-surface text-muted hover:bg-gold/15 hover:text-navy"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
