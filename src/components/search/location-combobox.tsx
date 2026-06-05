"use client";

import { useEffect, useRef, useState } from "react";
import { searchLocations, type LocationMatch } from "@/lib/location-search";
import { cn } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";

export function LocationCombobox({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = "Search city, area, or state…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (match: LocationMatch) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationMatch[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchLocations(value, 6));
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            type="search"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit?.();
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="h-12 w-full rounded-xl bg-surface pl-10 pr-4 text-sm font-medium text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-gold/40 lg:h-14"
            autoComplete="off"
          />
        </div>
        {onSubmit && (
          <button
            type="button"
            onClick={() => {
              onSubmit();
              setOpen(false);
            }}
            className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-navy shadow-glow-gold lg:h-14 lg:w-14"
            aria-label="Search"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-[calc(100%-3.5rem)] overflow-auto rounded-xl border border-surface bg-elevated py-1 shadow-float-lg">
          {suggestions.map((s) => (
            <li key={`${s.city}-${s.area}-${s.state}`}>
              <button
                type="button"
                className="pressable flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface"
                onClick={() => {
                  onChange(s.label);
                  onSelect?.(s);
                  setOpen(false);
                }}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span>
                  <span className="font-semibold text-foreground">{s.label}</span>
                  <span className="ml-1.5 text-xs capitalize text-muted">
                    {s.type}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
