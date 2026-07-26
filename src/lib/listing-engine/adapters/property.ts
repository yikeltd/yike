/**
 * Property submission adapter — maps engine values to the payload shape
 * `ListingForm` posts to `/api/agent/listings/create` (see
 * src/components/agent/listing-form.tsx `executeSubmit`). Minimal viable
 * parity: server-managed fields (agent_id, status, listing_plan, moderation
 * flags, pricing intelligence) stay owned by the existing route, not this
 * adapter.
 */
import { isCommercialProperty, isLandProperty } from "@/lib/listing-field-rules";
import type { ListingValues } from "../types";

export type PropertyPayload = Record<string, unknown>;

export function valuesToPropertyPayload(
  values: ListingValues,
  opts: { listingId?: string; mediaUrls?: string[]; mediaItems?: unknown[] } = {}
): PropertyPayload {
  const propertyType = String(values.property_type ?? "");
  const noRoomCounts = isLandProperty(propertyType) || isCommercialProperty(propertyType);
  const amenities = Array.isArray(values.amenities) ? (values.amenities as string[]) : [];
  const mediaUrls =
    opts.mediaUrls ?? (Array.isArray(values.media_urls) ? (values.media_urls as string[]) : []);
  const mediaItems =
    opts.mediaItems ?? (Array.isArray(values.media_items) ? values.media_items : []);

  return {
    listingId: opts.listingId,
    title: values.title,
    description: values.description || null,
    listing_type: values.listing_type,
    property_type: values.property_type,
    bedrooms: noRoomCounts ? 0 : Number(values.bedrooms || 0),
    bathrooms: noRoomCounts ? 0 : Number(values.bathrooms || 0),
    toilets: noRoomCounts ? 0 : Number(values.toilets || 0),
    price: Number(values.price || 0),
    payment_period: values.payment_period,
    state: values.state,
    city: values.city,
    area: values.area,
    address_hint: values.address_hint || null,
    landmark: values.landmark || null,
    media_urls: mediaUrls,
    media_items: mediaItems,
    video_url: values.video_url || null,
    extras: { amenities: amenities.length > 0 ? amenities : undefined },
  };
}
