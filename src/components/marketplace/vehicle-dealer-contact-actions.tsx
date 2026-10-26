"use client";

import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { SellerMessageCallActions } from "@/components/marketplace/seller-message-call-actions";

type Props = {
  listingId: string;
  sellerId: string;
  sellerName: string;
  className?: string;
  variant?: "sidebar" | "gallery-inline";
};

/** @deprecated Use SellerMessageCallActions — kept for import stability. */
export function VehicleDealerContactActions(props: Props) {
  return (
    <SellerMessageCallActions
      {...props}
      assetType={"VEHICLE" satisfies MarketplaceAssetType}
      variant={props.variant}
    />
  );
}
