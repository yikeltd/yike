"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemedSelectOption = { value: string; label: string };

type Variant = "default" | "hero";

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  placeholder: string;
  ariaLabel: string;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const isPlaceholder =
    !selected || (selected.value === "" && selected.label === placeholder);
  const display = isPlaceholder ? placeholder : (selected?.label ?? placeholder);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const triggerClass =
    variant === "hero"
      ? cn(
          "flex h-10 w-full items-center justify-between gap-1 rounded-xl border px-3 text-left text-xs font-medium outline-none transition-colors",
          "border-white/12 bg-[#021433]/90 text-white",
          "focus-visible:border-gold/40 focus-visible:ring-2 focus-visible:ring-gold/25",
          "lg:border-navy/10 lg:bg-white lg:text-foreground lg:focus-visible:ring-gold/35"
        )
      : cn(
          "flex h-10 w-full items-center justify-between gap-1 rounded-xl border px-3 text-left text-xs font-medium outline-none transition-colors",
          "border-navy/10 bg-white text-foreground",
          "focus-visible:ring-2 focus-visible:ring-gold/35",
          "dark:border-white/10 dark:bg-elevated lg:text-sm"
        );

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(true)}
        className={triggerClass}
      >
        <span className="min-w-0 truncate">{display}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-70",
            variant === "hero" && "text-gold lg:text-muted"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end lg:items-center lg:justify-center lg:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#021433]/70 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={cn(
              "relative flex max-h-[min(72vh,520px)] w-full flex-col",
              "rounded-t-2xl border border-gold/20 bg-gradient-to-b from-[#042a66] to-[#031B4E] shadow-float-lg",
              "lg:max-w-md lg:rounded-2xl"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold text-gold">{ariaLabel}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul
              role="listbox"
              aria-label={ariaLabel}
              className="hide-scrollbar flex-1 overflow-y-auto px-2 py-2"
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <li key={opt.value || "__empty"} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "pressable flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors",
                        active
                          ? "bg-gold/15 font-bold text-gold"
                          : "text-white/90 hover:bg-white/[0.06]"
                      )}
                    >
                      <span className="min-w-0">{opt.label}</span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-gold" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="h-[max(0.5rem,env(safe-area-inset-bottom))]" />
          </div>
        </div>
      ) : null}
    </>
  );
}
