import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ListingDetailSpecItem = {
  label: string;
  value: string;
};

const cellClass =
  "min-w-0 flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5";

const labelClass =
  "text-[10px] font-semibold leading-snug text-navy/50 break-words [overflow-wrap:anywhere] dark:text-white/50";

const valueClass =
  "mt-0.5 text-xs font-black leading-snug text-navy break-words [overflow-wrap:anywhere] dark:text-white";

/** Compact responsive spec grid — 1 column mobile, 2 columns from sm+. */
export function ListingDetailSpecificationsGrid({
  items,
  className,
  "data-testid": testId = "listing-detail-specifications-grid",
}: {
  items: readonly ListingDetailSpecItem[];
  className?: string;
  "data-testid"?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid w-full max-w-full grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3",
        className,
      )}
      data-testid={testId}
    >
      {items.map((spec, index) => (
        <div key={`${spec.label}-${index}`} className={cellClass}>
          <span className={labelClass}>{spec.label}</span>
          <span className={valueClass}>{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ListingDetailSpecificationsSection({
  title,
  items,
  headerAction,
  className,
  shellClassName,
}: {
  title: string;
  items: readonly ListingDetailSpecItem[];
  headerAction?: ReactNode;
  className?: string;
  shellClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      className={cn(
        "w-full max-w-full space-y-3 overflow-hidden rounded-3xl border border-navy/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-navy",
        shellClassName,
        className,
      )}
      data-testid="listing-detail-specifications-section"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
          {title}
        </h3>
        {headerAction}
      </div>
      <ListingDetailSpecificationsGrid items={items} />
    </section>
  );
}
