import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { propertyWhatsAppMessage } from "@/lib/whatsapp";
import type { Property } from "@/types/database";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { normalizeAssetType } from "@/lib/marketplace/listings";

export type ListingContactContext = {
  title: string;
  area: string;
  city: string;
  price: number;
  paymentPeriod: string;
  listingType: string;
  bedrooms?: number;
  propertyType?: string | null;
  listingUrl: string;
};

type ListingContactSource = Pick<
  Property,
  | "id"
  | "slug"
  | "title"
  | "area"
  | "city"
  | "price"
  | "payment_period"
  | "listing_type"
  | "bedrooms"
  | "property_type"
  | "asset_type"
>;

export function listingContactContextFromListing(
  listing: ListingContactSource,
  _assetType?: MarketplaceAssetType,
): ListingContactContext {
  return {
    title: listing.title,
    area: listing.area ?? "",
    city: listing.city ?? "",
    price: Number(listing.price ?? 0),
    paymentPeriod: String(listing.payment_period ?? "yearly"),
    listingType: String(listing.listing_type ?? "sale"),
    bedrooms: listing.bedrooms ?? undefined,
    propertyType: listing.property_type ?? null,
    listingUrl: listingAbsoluteUrl(listing),
  };
}

/** @deprecated Use listingContactContextFromListing */
export function listingContactContextFromProperty(
  listing: Property,
  assetType: MarketplaceAssetType,
): ListingContactContext {
  return listingContactContextFromListing(listing, assetType);
}

export function buildListingWhatsAppInquiryMessage(
  assetType: MarketplaceAssetType,
  ctx: ListingContactContext,
): string {
  if (assetType === "PROPERTY") {
    return propertyWhatsAppMessage(ctx.title, ctx.area, ctx.city, ctx.listingUrl, {
      bedrooms: ctx.bedrooms,
      propertyType: ctx.propertyType,
      listingType: ctx.listingType,
    });
  }

  const asset =
    assetType === "VEHICLE"
      ? "vehicle"
      : normalizeAssetType(assetType) === "ELECTRONICS"
        ? "item"
        : "listing";
  const location = [ctx.area, ctx.city].filter(Boolean).join(", ");
  const locPart = location ? ` in ${location}` : "";
  return `Hi, I saw your ${asset} on Yike: ${ctx.title}${locPart}. Is it still available?\n\n${ctx.listingUrl}`;
}
