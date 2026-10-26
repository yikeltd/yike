"use client";

import { useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import type { FieldOption } from "@/lib/listing-engine";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  options: FieldOption[];
  placeholder?: string;
  label: string;
  allowCustom?: boolean;
  customHint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function ListingSearchableSelect({
  id,
  value,
  options,
  placeholder = "Search and select",
  label,
  allowCustom = true,
  customHint = "Type a value not in the list",
  disabled,
  onChange,
}: Props) {
  const [customMode, setCustomMode] = useState(false);
  const selectOptions = [
    { value: "", label: placeholder },
    ...options.filter((o) => o.value !== ""),
  ];

  if (customMode || (allowCustom && value && !options.some((o) => o.value === value))) {
    return (
      <div className="space-y-2">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={customHint}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20",
          )}
        />
        {options.length > 0 ? (
          <button
            type="button"
            className="text-xs font-semibold text-gold-dark hover:underline"
            onClick={() => {
              setCustomMode(false);
              if (!options.some((o) => o.value === value)) onChange("");
            }}
          >
            Pick from catalogue
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ThemedSelect
        value={value}
        onChange={onChange}
        options={selectOptions}
        placeholder={placeholder}
        ariaLabel={label}
        searchable
        disabled={disabled}
      />
      {allowCustom ? (
        <button
          type="button"
          className="text-xs font-semibold text-navy/55 hover:text-navy hover:underline"
          onClick={() => setCustomMode(true)}
        >
          {customHint}
        </button>
      ) : null}
    </div>
  );
}
