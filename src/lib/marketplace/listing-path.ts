import type { AssetType, Property } from "@/types/database";
import { propertyPath, propertyAbsoluteUrl } from "@/lib/property-url";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { SITE_URL } from "@/lib/constants";

/** Canonical public path for any marketplace listing (Property or Vehicle). */
export function listingPath(
  listing: Pick<Property, "id" | "slug"> & {
    asset_type?: AssetType | string | null;
  },
): string {
  const asset = normalizeAssetType(listing.asset_type);
  if (asset === "VEHICLE") {
    return `/vehicles/${listing.slug || listing.id}`;
  }
  return propertyPath(listing);
}

export function listingAbsoluteUrl(
  listing: Pick<Property, "id" | "slug"> & {
    asset_type?: AssetType | string | null;
  },
): string {
  const path = listingPath(listing);
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export function listingEditPath(
  listing: Pick<Property, "id"> & { asset_type?: AssetType | string | null },
): string {
  if (normalizeAssetType(listing.asset_type) === "VEHICLE") {
    return `/agent/listings/${listing.id}/edit`;
  }
  return `/agent/listings/${listing.id}/edit`;
}

export { propertyPath, propertyAbsoluteUrl };
