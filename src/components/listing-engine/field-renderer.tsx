"use client";

import type { FieldOption, ListingFieldDef } from "@/lib/listing-engine";
import { ListingSearchableSelect } from "@/components/listing-engine/listing-searchable-select";
import { YIKE_FIELD_CONTROL } from "@/lib/design/yike-classes";
import { cn } from "@/lib/utils";

const inputClass = `${YIKE_FIELD_CONTROL} w-full px-3 py-2.5 text-sm text-navy`;

type Props = {
  field: ListingFieldDef;
  value: unknown;
  options: FieldOption[];
  error?: string;
  inferred?: boolean;
  pendingSuggestions?: { value: unknown; label?: string }[];
  onChange: (value: unknown) => void;
};

export function FieldRenderer({
  field,
  value,
  options,
  error,
  inferred,
  pendingSuggestions,
  onChange,
}: Props) {
  const label = (
    <label htmlFor={`le-${field.id}`} className="mb-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-navy">
      <span>
        {field.label}
        {field.required ? <span className="text-gold"> *</span> : null}
      </span>
      {inferred ? (
        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy/80">
          Suggested
        </span>
      ) : null}
    </label>
  );

  const err = error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;

  const suggestionChips =
    pendingSuggestions && pendingSuggestions.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {pendingSuggestions.map((s, i) => {
          const chipLabel = s.label ?? String(s.value);
          return (
            <button
              key={`${field.id}-sug-${i}`}
              type="button"
              onClick={() => onChange(s.value)}
              className="pressable rounded-full border border-dashed border-gold/50 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-gold/20"
            >
              {chipLabel}
            </button>
          );
        })}
      </div>
    ) : null;

  if (field.input === "boolean") {
    const checked = value === true || value === "on" || value === "true";
    return (
      <div>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            id={`le-${field.id}`}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked ? "on" : "")}
            className="h-4 w-4 rounded border-navy/20 text-gold focus:ring-gold/30"
          />
          {field.label}
        </label>
        {err}
      </div>
    );
  }

  if (field.input === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="sm:col-span-2">
        {label}
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value]);
                }}
                className={cn(
                  "pressable min-h-[36px] rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  on ? "bg-navy text-gold" : "bg-navy/[0.06] text-navy/70 hover:bg-navy/10",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {suggestionChips}
        {err}
      </div>
    );
  }

  if (field.input === "searchable_select") {
    const disabled = options.length === 0 && !value;
    return (
      <div
        className={
          field.id === "auto_category" ||
          field.id === "brand" ||
          field.id === "model" ||
          field.id === "property_type"
            ? "sm:col-span-2"
            : undefined
        }
      >
        {label}
        {disabled && field.id === "brand" ? (
          <p className="mb-2 text-xs text-navy/55">Choose a product category first.</p>
        ) : null}
        {disabled && field.id === "model" ? (
          <p className="mb-2 text-xs text-navy/55">Choose a brand first, or enter a custom model.</p>
        ) : null}
        <ListingSearchableSelect
          id={`le-${field.id}`}
          value={String(value ?? "")}
          options={options}
          placeholder={field.placeholder ?? `Search ${field.label.toLowerCase()}`}
          label={field.label}
          allowCustom={
            field.id === "brand" ||
            field.id === "model" ||
            field.id === "area" ||
            field.id === "mileage"
          }
          customHint={
            field.id === "brand"
              ? "Type a brand not listed"
              : field.id === "model"
                ? "Type model / variant not listed"
                : "Enter manually"
          }
          disabled={disabled && field.id !== "brand" && field.id !== "model"}
          onChange={(v) => onChange(v)}
        />
        {suggestionChips}
        {err}
      </div>
    );
  }

  if (field.input === "confirm_chips" && options.length > 0) {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = String(value ?? "") === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={cn(
                  "pressable min-h-[36px] rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  on ? "bg-gold/25 text-navy ring-1 ring-gold/50" : "bg-navy/[0.06] text-navy/70",
                )}
              >
                {on ? "✓ " : ""}
                {o.label}
              </button>
            );
          })}
        </div>
        {suggestionChips}
        {err}
      </div>
    );
  }

  if ((field.input === "select" || field.input === "location") && options.length > 0) {
    const useChips = options.length <= 8 && field.id !== "state" && field.id !== "city";
    if (useChips) {
      return (
        <div className={field.id === "auto_category" || field.id === "listing_type" ? "sm:col-span-2" : undefined}>
          {label}
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const on = String(value ?? "") === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange(o.value)}
                  className={cn(
                    "pressable min-h-[36px] max-w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
                    on
                      ? "bg-navy text-gold shadow-sm"
                      : "bg-navy/[0.05] text-navy/75 hover:bg-navy/[0.08]",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {suggestionChips}
          {err}
        </div>
      );
    }

    return (
      <div>
        {label}
        <select
          id={`le-${field.id}`}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{field.placeholder ?? "Select"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {suggestionChips}
        {err}
      </div>
    );
  }

  if (field.input === "textarea") {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          id={`le-${field.id}`}
          rows={3}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {suggestionChips}
        {err}
      </div>
    );
  }

  const type =
    field.input === "number" || field.input === "year" || field.input === "currency"
      ? "number"
      : "text";

  return (
    <div className={field.id === "title" || field.id === "description" ? "sm:col-span-2" : undefined}>
      {label}
      <input
        id={`le-${field.id}`}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value === undefined || value === null ? "" : String(value)}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, inferred && "border-gold/40 bg-gold/[0.04]")}
      />
      {suggestionChips}
      {err}
    </div>
  );
}
