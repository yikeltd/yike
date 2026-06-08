"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const grouped = useMemo(() => valueDriversByCategory(), []);
  const atLimit = selected.length >= MAX_VALUE_DRIVER_SELECTIONS;
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    if (disabled) return;
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (atLimit) return;
    onChange([...selected, key]);
  }

  function toggleCat(id: string) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">
        {selected.length}/{MAX_VALUE_DRIVER_SELECTIONS} selected · optional
      </p>
      {VALUE_DRIVER_CATEGORIES.map((cat) => {
        const items = grouped.get(cat.id) ?? [];
        if (items.length === 0) return null;
        const open = openCats.has(cat.id);
        const count = items.filter((d) => selected.includes(d.key)).length;
        return (
          <div
            key={cat.id}
            className="overflow-hidden rounded-xl border border-navy/10 bg-surface/40"
          >
            <button
              type="button"
              onClick={() => toggleCat(cat.id)}
              className="pressable flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="text-xs font-bold text-navy">
                {cat.title}
                {count > 0 ? ` · ${count}` : ""}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
            {open ? (
              <div className="flex flex-wrap gap-1.5 border-t border-navy/8 px-2 pb-2 pt-1">
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
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        active
                          ? "bg-gold text-navy"
                          : locked
                            ? "bg-surface text-muted/50"
                            : "bg-white text-muted ring-1 ring-navy/10"
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
