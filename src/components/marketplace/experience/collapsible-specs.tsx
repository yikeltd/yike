import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpecCardItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

/** Rotating accent palette — premium, brand-safe color. */
const SPEC_ACCENTS = [
  {
    tile: "border-gold/30 bg-gradient-to-br from-gold/20 to-gold/5",
    icon: "bg-gold text-navy",
  },
  {
    tile: "border-sky-400/30 bg-gradient-to-br from-sky-100 to-sky-50",
    icon: "bg-sky-600 text-white",
  },
  {
    tile: "border-emerald-400/30 bg-gradient-to-br from-emerald-100 to-emerald-50",
    icon: "bg-emerald-600 text-white",
  },
  {
    tile: "border-violet-400/30 bg-gradient-to-br from-violet-100 to-violet-50",
    icon: "bg-violet-600 text-white",
  },
  {
    tile: "border-orange-400/30 bg-gradient-to-br from-orange-100 to-orange-50",
    icon: "bg-orange-500 text-white",
  },
  {
    tile: "border-rose-400/30 bg-gradient-to-br from-rose-100 to-rose-50",
    icon: "bg-rose-500 text-white",
  },
  {
    tile: "border-navy/20 bg-gradient-to-br from-navy/10 to-navy/[0.03]",
    icon: "bg-navy text-gold",
  },
  {
    tile: "border-teal-400/30 bg-gradient-to-br from-teal-100 to-teal-50",
    icon: "bg-teal-600 text-white",
  },
] as const;

/**
 * Compact colorful 2×4 grid for eight specs (2 columns × 4 short rows).
 * Horizontal tiles + accents — avoids the tall “2×8” stacked look.
 */
export function SpecCardGrid({
  items,
  className,
}: {
  items: SpecCardItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      className={cn("grid grid-cols-2 gap-2 sm:gap-2.5", className)}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const accent = SPEC_ACCENTS[index % SPEC_ACCENTS.length];
        return (
          <li
            key={`${item.label}-${item.value}`}
            className={cn(
              "flex min-h-0 items-center gap-2.5 rounded-xl border p-2.5 sm:gap-3 sm:p-3",
              accent.tile,
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
                accent.icon,
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight tracking-tight text-navy tabular-nums sm:text-[0.95rem]">
                {item.value}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-navy/50 sm:text-[11px]">
                {item.label}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Layer 3 — full specs collapsed by default. */
export function CollapsibleSpecs({
  items,
  title = "Full specifications",
  subtitle = "Technical details — expand when you need them",
  className,
  defaultOpen = false,
}: {
  items: SpecCardItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  defaultOpen?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <details
      className={cn(
        "group rounded-[1.5rem] border border-navy/10 bg-white/90 shadow-[0_12px_32px_-24px_rgba(3,27,78,0.4)] open:pb-5 backdrop-blur-sm",
        className,
      )}
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="text-base font-bold tracking-tight text-navy sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-navy/45">{subtitle}</p>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-navy/40 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="px-5 pb-1 sm:px-6">
        <SpecCardGrid items={items} />
      </div>
    </details>
  );
}
