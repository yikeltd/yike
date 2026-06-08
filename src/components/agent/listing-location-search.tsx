"use client";

import { useMemo, useState } from "react";
import { searchLocations } from "@/lib/location-search";
import { getStateDisplayLabel } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ListingLocationSearch({
  state,
  city,
  area,
  onStateChange,
  onCityChange,
  onAreaChange,
  initialLandmark,
  initialAddressHint,
}: {
  state: string;
  city: string;
  area: string;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  initialLandmark?: string | null;
  initialAddressHint?: string | null;
}) {
  const [query, setQuery] = useState(
    [area, city].filter(Boolean).join(", ") || city || ""
  );
  const [showAdvanced, setShowAdvanced] = useState(Boolean(state && !city));

  const suggestions = useMemo(
    () => (query.trim().length >= 2 ? searchLocations(query, 6) : []),
    [query]
  );

  function applyMatch(match: (typeof suggestions)[0]) {
    onStateChange(match.state);
    onCityChange(match.city);
    onAreaChange(match.type === "area" ? match.area : match.city);
    setQuery(match.label);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="area" value={area} />

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) {
              onCityChange("");
              onAreaChange("");
            }
          }}
          placeholder="Type city, area, estate, or LGA — e.g. Lekki Phase 1, Wuse 2"
          autoComplete="off"
        />
        {suggestions.length > 0 && query.trim().length >= 2 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-navy/10 bg-white py-1 shadow-float-lg">
            {suggestions.map((s) => (
              <li key={`${s.label}-${s.type}`}>
                <button
                  type="button"
                  className="pressable w-full px-3 py-2.5 text-left text-sm text-navy hover:bg-gold/10"
                  onClick={() => applyMatch(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {(state || city) && (
        <div className="flex flex-wrap gap-1.5">
          {state ? (
            <span className="rounded-full bg-navy/8 px-2.5 py-1 text-[11px] font-semibold text-navy">
              {getStateDisplayLabel(state)}
            </span>
          ) : null}
          {city ? (
            <span className="rounded-full bg-navy/8 px-2.5 py-1 text-[11px] font-semibold text-navy">
              {city}
            </span>
          ) : null}
          {area && area !== city ? (
            <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-navy">
              {area}
            </span>
          ) : null}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-xs font-semibold text-gold-dark"
      >
        {showAdvanced ? "Hide manual fields" : "Edit location manually"}
      </button>

      {showAdvanced ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="City / LGA"
          />
          <Input
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            placeholder="Area / estate"
          />
          <Input
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="State"
          />
        </div>
      ) : null}

      <Input
        name="landmark"
        placeholder="Landmark (optional)"
        defaultValue={initialLandmark ?? ""}
      />
      <Input
        name="address_hint"
        placeholder="Private address note (optional)"
        defaultValue={initialAddressHint ?? ""}
      />
    </div>
  );
}
