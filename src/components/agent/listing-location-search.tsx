"use client";

import { useMemo, useState } from "react";
import { searchLocations } from "@/lib/location-search";
import { getStateDisplayLabel } from "@/lib/constants";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";

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
  const hasSelection = Boolean(state && city);
  const [searchOpen, setSearchOpen] = useState(!hasSelection);
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(Boolean(state && !city));

  const suggestions = useMemo(
    () => (query.trim().length >= 2 ? searchLocations(query, 6) : []),
    [query]
  );

  function applyMatch(match: (typeof suggestions)[0]) {
    onStateChange(match.state);
    onCityChange(match.city);
    onAreaChange(match.type === "area" ? match.area : match.city);
    setQuery("");
    setSearchOpen(false);
  }

  function clearSelection() {
    onStateChange("");
    onCityChange("");
    onAreaChange("");
    setQuery("");
    setSearchOpen(true);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="area" value={area} />

      {searchOpen ? (
        <div className="relative">
          <FieldLabel>Location</FieldLabel>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, area, estate, or LGA"
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
      ) : null}

      {hasSelection ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs font-semibold text-gold-dark"
          >
            Change location
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-xs font-semibold text-gold-dark"
      >
        {showAdvanced ? "Hide manual fields" : "Edit location manually"}
      </button>

      {showAdvanced ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <FieldLabel>City / LGA</FieldLabel>
            <Input value={city} onChange={(e) => onCityChange(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Area / estate</FieldLabel>
            <Input value={area} onChange={(e) => onAreaChange(e.target.value)} />
          </div>
          <div>
            <FieldLabel>State</FieldLabel>
            <Input value={state} onChange={(e) => onStateChange(e.target.value)} />
          </div>
        </div>
      ) : null}

      <div>
        <FieldLabel>Landmark (optional)</FieldLabel>
        <Input
          name="landmark"
          defaultValue={initialLandmark ?? ""}
          placeholder="Nearest landmark"
        />
      </div>
      <div>
        <FieldLabel>Private address note (optional)</FieldLabel>
        <Input
          name="address_hint"
          defaultValue={initialAddressHint ?? ""}
          placeholder="Private note, not shown publicly"
        />
      </div>
    </div>
  );
}
