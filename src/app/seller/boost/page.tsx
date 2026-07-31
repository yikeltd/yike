import type { Metadata } from "next";
import { ListingPromotionsEngine } from "@/components/seller/listing-promotions-engine";

export const metadata: Metadata = {
  title: "Listing Promotions & Boost Engine | Yike Seller",
  description: "Amplify buyer visibility, feature your property or vehicle, and get up to 25x lead reach.",
};

export default function SellerBoostPage() {
  return (
    <main>
      <ListingPromotionsEngine />
    </main>
  );
}
