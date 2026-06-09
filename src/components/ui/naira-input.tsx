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
  const numeric = normalizeNairaInput(value);
  const display = focused
    ? formatNairaTyping(numeric)
    : numeric
      ? formatNairaAmount(Number(numeric))
      : "";

  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Input
        value={display}
        onChange={(e) => onChange(normalizeNairaInput(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
