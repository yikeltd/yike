"use client";

import { useState } from "react";
import { digitsOnly, formatNairaAmount } from "@/lib/naira-input";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NairaInput({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label?: string;
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const numeric = digitsOnly(value);
  const display = focused
    ? numeric
    : numeric
      ? formatNairaAmount(Number(numeric))
      : "";

  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Input
        value={display}
        onChange={(e) => onChange(digitsOnly(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        required={required}
        className={cn(className)}
        autoComplete="off"
      />
    </div>
  );
}
