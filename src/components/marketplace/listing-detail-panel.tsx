import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Section title with optional gold rule — YDS listing detail hierarchy. */
export function ListingDetailSectionHeading({
  title,
  action,
  leadingIcon,
  className,
}: {
  title: string;
  action?: ReactNode;
  leadingIcon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h3 className="yike-section-heading flex min-w-0 items-center gap-2">
        <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-gold" aria-hidden />
        {leadingIcon}
        <span className="truncate">{title}</span>
      </h3>
      {action}
    </div>
  );
}

/** Elevated panel on warm page canvas — shared listing detail surfaces. */
export function ListingDetailPanel({
  title,
  headerAction,
  children,
  className,
  "data-testid": testId,
  "aria-label": ariaLabel,
}: {
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      className={cn("yike-panel w-full max-w-full overflow-hidden p-4 sm:p-5", className)}
      data-testid={testId}
      aria-label={ariaLabel ?? title}
    >
      {title ? (
        <ListingDetailSectionHeading title={title} action={headerAction} className="mb-3" />
      ) : null}
      {children}
    </section>
  );
}
