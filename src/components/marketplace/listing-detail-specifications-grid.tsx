import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ListingDetailSpecItem = {
  label: string;
  value: string;
};

const labelClass =
  "text-[11px] font-semibold leading-snug text-navy/55 break-words [overflow-wrap:anywhere] dark:text-white/55";

const valueClass =
  "mt-0.5 text-sm font-bold leading-snug text-navy break-words [overflow-wrap:anywhere] dark:text-white";

/** Compact responsive spec grid — 1 column on narrow viewports, 2 columns from 480px+. */
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
    <dl
      className={cn(
        "listing-detail-spec-grid grid w-full max-w-full grid-cols-1 gap-x-6 gap-y-3 min-[480px]:grid-cols-2 min-[480px]:gap-y-3",
        className,
      )}
      data-testid={testId}
    >
      {items.map((spec, index) => (
        <div key={`${spec.label}-${index}`} className="min-w-0">
          <dt className={labelClass}>{spec.label}</dt>
          <dd className={valueClass}>{spec.value}</dd>
        </div>
      ))}
    </dl>
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
        "w-full max-w-full space-y-3 overflow-hidden rounded-2xl border border-navy/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-navy sm:p-5",
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
