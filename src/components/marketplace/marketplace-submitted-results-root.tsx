import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wrapper for submitted browse results — listings-first, minimal top spacing. */
export function MarketplaceSubmittedResultsRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("pt-1", className)}
      data-testid="marketplace-submitted-results"
    >
      {children}
    </div>
  );
}
