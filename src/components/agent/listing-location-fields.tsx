"use client";

import { useMemo } from "react";
import { NIGERIAN_STATES } from "@/lib/constants";
import { getAllCitiesForState } from "@/constants/nigeriaAllCities";
import { getAreasForSearchCity } from "@/lib/constants";
import { Input, Select } from "@/components/ui/input";

export function ListingLocationFields({
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
  const cityOptions = useMemo(
    () => (state ? getAllCitiesForState(state) : []),
    [state]
  );
  const areaSuggestions = useMemo(
    () => (city ? getAreasForSearchCity(city) : []),
    [city]
  );

  return (
    <div className="space-y-3">
      <Select
        name="state"
        value={state}
        onChange={(e) => onStateChange(e.target.value)}
        required
      >
        {NIGERIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      <div>
        <Input
          name="city"
          list="listing-city-options"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City, town, or LGA (type freely if not listed)"
          required
        />
        <datalist id="listing-city-options">
          {cityOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className="mt-1 text-[11px] text-muted">
          Pick from suggestions or type your exact city/LGA — new developments welcome.
        </p>
      </div>

      <div>
        <Input
          name="area"
          list={areaSuggestions.length > 0 ? "listing-area-options" : undefined}
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          placeholder="Area, estate, or neighbourhood"
          required
        />
        {areaSuggestions.length > 0 ? (
          <datalist id="listing-area-options">
            {areaSuggestions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        ) : null}
      </div>

      <Input
        name="landmark"
        placeholder="Landmark (optional)"
        defaultValue={initialLandmark ?? ""}
      />
      <Input
        name="address_hint"
        placeholder="Street or estate name (optional, not shown publicly)"
        defaultValue={initialAddressHint ?? ""}
      />
    </div>
  );
}
