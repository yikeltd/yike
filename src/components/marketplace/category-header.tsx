"use client";

import { MarketplaceVerticalSwitcher } from "@/components/marketplace/vertical-switcher";
import { cn } from "@/lib/utils";

export type MarketplaceCategoryHeaderProps = {
  vertical: "property" | "vehicle";
  title: string;
  /** @deprecated Marketing taglines removed — kept optional for call-site compatibility. */
  tagline?: string;
  className?: string;
};

/** Search-first category chrome — centered Vehicles / Property toggle. */
export function MarketplaceCategoryHeader({
  vertical,
  title,
  className,
}: MarketplaceCategoryHeaderProps) {
  return (
    <header className={cn("mb-3", className)}>
      <div className="flex items-center justify-center">
        <MarketplaceVerticalSwitcher active={vertical} />
      </div>
      <h1 className="sr-only">{title}</h1>
    </header>
  );
}
