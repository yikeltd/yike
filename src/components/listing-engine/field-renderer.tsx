"use client";

import type { FieldOption, ListingFieldDef } from "@/lib/listing-engine";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

type Props = {
  field: ListingFieldDef;
  value: unknown;
  options: FieldOption[];
  error?: string;
  onChange: (value: unknown) => void;
};

export function FieldRenderer({ field, value, options, error, onChange }: Props) {
  const label = (
    <label htmlFor={`le-${field.id}`} className="mb-1.5 block text-sm font-medium text-navy">
      {field.label}
      {field.required ? <span className="text-gold"> *</span> : null}
    </label>
  );

  const help = field.description ? (
    <p className="mt-1 text-xs text-muted">{field.description}</p>
  ) : null;

  const err = error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;

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
      <div>
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
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  on ? "bg-navy text-gold" : "bg-navy/[0.06] text-navy/70 hover:bg-navy/10"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {help}
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
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  on ? "bg-gold/25 text-navy ring-1 ring-gold/50" : "bg-navy/[0.06] text-navy/70"
                )}
              >
                {on ? "✓ " : ""}
                {o.label}
              </button>
            );
          })}
        </div>
        {err}
      </div>
    );
  }

  if (
    (field.input === "select" || field.input === "location") &&
    options.length > 0
  ) {
    return (
      <div>
        {label}
        <select
          id={`le-${field.id}`}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {help}
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
          rows={4}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {help}
        {err}
      </div>
    );
  }

  const type =
    field.input === "number" || field.input === "year" || field.input === "currency"
      ? "number"
      : "text";

  return (
    <div>
      {label}
      <input
        id={`le-${field.id}`}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value === undefined || value === null ? "" : String(value)}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {help}
      {err}
    </div>
  );
}
