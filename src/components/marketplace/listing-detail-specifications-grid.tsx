import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ListingDetailPanel, ListingDetailSectionHeading } from "./listing-detail-panel";

export type ListingDetailSpecItem = {
  label: string;
  value: string;
};

const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide leading-snug text-muted break-words [overflow-wrap:anywhere]";

const valueClass =
  "mt-1 text-sm font-bold leading-snug text-navy break-words [overflow-wrap:anywhere] dark:text-white";

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
        "listing-detail-spec-grid grid w-full max-w-full grid-cols-1 gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-x-4 min-[480px]:gap-y-2",
        className,
      )}
      data-testid={testId}
    >
      {items.map((spec, index) => (
        <div key={`${spec.label}-${index}`} className="yike-spec-cell min-w-0">
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
    <ListingDetailPanel
      className={cn(className, shellClassName)}
      data-testid="listing-detail-specifications-section"
      aria-label={title}
    >
      <ListingDetailSectionHeading title={title} action={headerAction} className="mb-3" />
      <ListingDetailSpecificationsGrid items={items} />
    </ListingDetailPanel>
  );
}
