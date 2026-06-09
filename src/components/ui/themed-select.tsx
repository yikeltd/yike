"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectableOption = { value: string; label: string };
type HeaderOption = { kind: "header"; id: string; label: string };
type SeparatorOption = { kind: "separator"; id: string; label: string };

export type ThemedSelectOption =
  | SelectableOption
  | HeaderOption
  | SeparatorOption;

type Variant = "default" | "hero";

function isSelectable(opt: ThemedSelectOption): opt is SelectableOption {
  return "value" in opt;
}

function optionKey(opt: ThemedSelectOption, index: number): string {
  if (isSelectable(opt)) return opt.value || "__empty";
  return opt.id || `meta-${index}`;
}

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  variant = "default",
  compactLabel,
  searchable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  placeholder: string;
  ariaLabel: string;
  variant?: Variant;
  /** Tighter typography for currency-style labels (e.g. budget tiers). */
  compactLabel?: boolean;
  /** Filter long lists — defaults on when there are more than 8 choices. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectableOptions = useMemo(
    () => options.filter(isSelectable),
    [options]
  );

  const selected = selectableOptions.find((o) => o.value === value);
  const isPlaceholder =
    !selected || (selected.value === "" && selected.label === placeholder);
  const display = isPlaceholder ? placeholder : (selected?.label ?? placeholder);

  const showSearch =
    searchable ??
    selectableOptions.filter((o) => o.value !== "").length > 8;

  const visibleOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;

    return selectableOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(trimmed) ||
        (opt.value && opt.value.toLowerCase().includes(trimmed))
    );
  }, [options, query, selectableOptions]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const triggerClass =
    variant === "hero"
      ? cn(
          "flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left outline-none transition-all duration-200",
          compactLabel ? "text-xs sm:text-sm" : "text-sm",
          "font-semibold",
          "border-white/30 bg-[#f4f6fa] text-navy",
          "shadow-[0_2px_10px_rgb(2_20_51_/20%),inset_0_1px_0_rgb(255_255_255_/90%)]",
          open
            ? "border-gold/55 shadow-[0_4px_18px_rgb(2_20_51_/26%)] ring-2 ring-gold/25"
            : "focus-visible:border-gold/50 focus-visible:shadow-[0_4px_16px_rgb(2_20_51_/22%)] focus-visible:ring-2 focus-visible:ring-gold/20"
        )
      : cn(
          "flex h-10 w-full items-center justify-between gap-1 rounded-xl border px-3 text-left text-xs font-medium outline-none transition-colors",
          "border-navy/10 bg-white text-foreground",
          "focus-visible:ring-2 focus-visible:ring-gold/35",
          "dark:border-white/10 dark:bg-elevated lg:text-sm"
        );

  const headerTextClass =
    variant === "hero"
      ? "px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-navy/45"
      : "px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45";

  const separatorClass =
    variant === "hero"
      ? "mx-3 my-1.5 border-t border-navy/8"
      : "mx-3 my-1.5 border-t border-white/10";

  const separatorLabelClass =
    variant === "hero"
      ? "px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-navy/40"
      : "px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40";

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
        <span
          className={cn(
            "min-w-0 truncate",
            compactLabel && "tracking-tight",
            variant === "hero" && (isPlaceholder ? "text-navy/55" : "text-navy")
          )}
        >
          {display}
        </span>
        <ChevronDown
          className={cn(
            "shrink-0",
            variant === "hero"
              ? "h-4 w-4 text-navy/65"
              : "h-3.5 w-3.5 opacity-70"
          )}
          strokeWidth={variant === "hero" ? 2.5 : 2}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end lg:items-center lg:justify-center lg:p-6">
          <button
            type="button"
            className={cn(
              "absolute inset-0 backdrop-blur-[3px]",
              variant === "hero" ? "bg-navy/55" : "bg-[#021433]/70 backdrop-blur-[2px]"
            )}
            aria-label="Close"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={cn(
              "relative flex max-h-[min(72vh,520px)] w-full flex-col shadow-float-lg",
              "lg:max-w-md lg:rounded-2xl",
              variant === "hero"
                ? "rounded-t-2xl border border-navy/10 bg-white"
                : "rounded-t-2xl border border-gold/20 bg-gradient-to-b from-[#042a66] to-[#031B4E]"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3 border-b px-4 py-3.5",
                variant === "hero" ? "border-navy/8" : "border-white/10 py-3"
              )}
            >
              <p
                className={cn(
                  "text-sm font-bold",
                  variant === "hero" ? "text-navy" : "text-gold"
                )}
              >
                {ariaLabel}
              </p>
              <button
                type="button"
                onClick={close}
                className={cn(
                  "pressable flex h-8 w-8 items-center justify-center rounded-full",
                  variant === "hero"
                    ? "bg-navy/[0.06] text-navy/70"
                    : "bg-white/10 text-white/80"
                )}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {showSearch ? (
              <div
                className={cn(
                  "border-b px-3 py-2.5",
                  variant === "hero" ? "border-navy/8" : "border-white/10"
                )}
              >
                <label className="sr-only" htmlFor={`${ariaLabel}-search`}>
                  Search {ariaLabel}
                </label>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                    variant === "hero"
                      ? "border-navy/10 bg-navy/[0.03]"
                      : "border-white/12 bg-white/[0.06]"
                  )}
                >
                  <Search
                    className={cn(
                      "h-4 w-4 shrink-0",
                      variant === "hero" ? "text-navy/40" : "text-white/45"
                    )}
                    aria-hidden
                  />
                  <input
                    id={`${ariaLabel}-search`}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${ariaLabel.toLowerCase()}…`}
                    autoComplete="off"
                    className={cn(
                      "min-w-0 flex-1 bg-transparent text-sm outline-none",
                      variant === "hero"
                        ? "text-navy placeholder:text-navy/40"
                        : "text-white placeholder:text-white/40"
                    )}
                  />
                </div>
              </div>
            ) : null}

            <ul
              role="listbox"
              aria-label={ariaLabel}
              className="hide-scrollbar flex-1 overflow-y-auto px-2 py-2"
            >
              {visibleOptions.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No matches
                </li>
              ) : (
                visibleOptions.map((opt, index) => {
                  if (!isSelectable(opt)) {
                    if (opt.kind === "header") {
                      return (
                        <li key={optionKey(opt, index)} aria-hidden>
                          <p className={headerTextClass}>{opt.label}</p>
                        </li>
                      );
                    }
                    return (
                      <li key={optionKey(opt, index)} aria-hidden>
                        <div className={separatorClass} role="separator" />
                        <p className={separatorLabelClass}>{opt.label}</p>
                      </li>
                    );
                  }

                  const active = opt.value === value;
                  return (
                    <li
                      key={optionKey(opt, index)}
                      role="option"
                      aria-selected={active}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          close();
                        }}
                        className={cn(
                          "pressable flex w-full items-center justify-between gap-2 rounded-xl px-3 text-left transition-colors",
                          compactLabel
                            ? "py-3.5 text-[13px] sm:text-sm"
                            : "py-3.5 text-sm",
                          variant === "hero"
                            ? active
                              ? "bg-gold/14 font-bold text-navy"
                              : "font-medium text-navy/85 hover:bg-navy/[0.04]"
                            : active
                              ? "bg-gold/15 font-bold text-gold"
                              : "text-white/90 hover:bg-white/[0.06]"
                        )}
                      >
                        <span
                          className={cn("min-w-0", compactLabel && "tracking-tight")}
                        >
                          {opt.label}
                        </span>
                        {active ? (
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              variant === "hero" ? "text-gold-dark" : "text-gold"
                            )}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="h-[max(0.5rem,env(safe-area-inset-bottom))]" />
          </div>
        </div>
      ) : null}
    </>
  );
}
