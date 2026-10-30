import type { ReactNode } from "react";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import type { MarketplaceCategoryHeaderProps } from "@/components/marketplace/category-header";

/** Initial browse only — vertical tabs + discovery search (not on submitted results). */
export function MarketplaceBrowseDiscoverySection({
  vertical,
  title,
  children,
}: {
  vertical: MarketplaceCategoryHeaderProps["vertical"];
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="space-y-3 px-3 pt-4 lg:px-6 xl:px-8"
      data-testid="marketplace-browse-discovery-section"
    >
      <MarketplaceCategoryHeader vertical={vertical} title={title} className="mb-2" />
      {children}
    </div>
  );
}
