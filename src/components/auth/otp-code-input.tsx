"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleChange(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, 6);
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) handleChange(pasted);
  }

  return (
    <div className="relative">
      <div className="flex justify-center gap-2" aria-hidden>
        {digits.map((d, i) => (
          <span
            key={i}
            className={cn(
              "flex h-12 w-10 items-center justify-center rounded-xl border text-lg font-bold tabular-nums transition-colors",
              d.trim()
                ? "border-gold/50 bg-gold/10 text-navy"
                : "border-navy/10 bg-surface text-muted",
              disabled && "opacity-60"
            )}
          >
            {d.trim() || "·"}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        aria-label="6-digit verification code"
      />
    </div>
  );
}
