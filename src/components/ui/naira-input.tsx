"use client";

import { useState } from "react";
import {
  formatNairaAmount,
  formatNairaTyping,
  normalizeNairaInput,
} from "@/lib/naira-input";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SCALE_ALIASES = [
  "k",
  "thousand",
  "thousands",
  "m",
  "mn",
  "mil",
  "million",
  "millions",
  "b",
  "bn",
  "bil",
  "billion",
  "billions",
];

function cleanDraft(value: string): string {
  return value.trim().replace(/,/g, "").replace(/\s+/g, "").toLowerCase();
}

function shouldKeepRawDraft(raw: string): boolean {
  const cleaned = cleanDraft(raw);
  if (/^\d+\.\d*$/.test(cleaned)) return true;
  const scale = cleaned.match(/^\d+(?:\.\d+)?([a-z]+)$/)?.[1];
  return Boolean(scale && !SCALE_ALIASES.includes(scale));
}

export function NairaInput({
  label,
  value,
  onChange,
  required,
  className,
  placeholder = "(optional)",
}: {
  label?: string;
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const numeric = normalizeNairaInput(value);
  const display = focused
    ? draft
    : numeric
      ? formatNairaAmount(Number(numeric))
      : "";

  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Input
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          if (shouldKeepRawDraft(raw)) {
            setDraft(raw);
            return;
          }
          const next = normalizeNairaInput(raw);
          onChange(next);
          setDraft(next ? formatNairaTyping(next) : "");
        }}
        onFocus={() => {
          setFocused(true);
          setDraft(numeric ? formatNairaTyping(numeric) : "");
        }}
        onBlur={() => {
          setFocused(false);
          if (!shouldKeepRawDraft(draft)) {
            onChange(normalizeNairaInput(draft));
          }
        }}
        inputMode="decimal"
        required={required}
        placeholder={
          required && placeholder === "(optional)" ? undefined : placeholder
        }
        className={cn(className)}
        autoComplete="off"
      />
    </div>
  );
}
