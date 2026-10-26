"use client";

import { SellerMessageCallActions } from "@/components/marketplace/seller-message-call-actions";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { cn } from "@/lib/utils";

/** Message / Call CTAs directly under the listing gallery on detail pages. */
export function ListingDetailGalleryContact({
  listingId,
  assetType,
  sellerId,
  sellerName,
  className,
}: {
  listingId: string;
  assetType: MarketplaceAssetType;
  sellerId: string;
  sellerName: string;
  className?: string;
}) {
  return (
    <div
      className={cn("yike-panel p-3 sm:p-4", className)}
      data-testid="listing-detail-gallery-contact"
    >
      <SellerMessageCallActions
        listingId={listingId}
        assetType={assetType}
        sellerId={sellerId}
        sellerName={sellerName}
        variant="gallery-inline"
      />
    </div>
  );
}
