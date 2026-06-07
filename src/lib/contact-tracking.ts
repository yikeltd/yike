"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { trackEvent } from "@/lib/analytics";
import { trackListingInteraction } from "@/lib/browse-preferences";

export type ContactChannel = "whatsapp" | "call";

export type ContactPlacement =
  | "card"
  | "detail"
  | "sticky"
  | "browse"
  | "share"
  | "agent_card";

export type ContactTrackInput = {
  propertyId: string;
  channel: ContactChannel;
  city: string;
  area?: string;
  listingType: string;
  propertyType?: string | null;
  placement: ContactPlacement;
  agentId?: string | null;
};

/** Track WhatsApp/call clicks — analytics + aggregate DB counter. */
export async function trackContactClick(input: ContactTrackInput) {
  const {
    propertyId,
    channel,
    city,
    area,
    listingType,
    propertyType,
    placement,
    agentId,
  } = input;

  trackEvent(channel === "whatsapp" ? "whatsapp_click" : "call_click", {
    listing_id: propertyId,
    city,
    listing_type: listingType,
    property_type: propertyType ?? "unknown",
    placement,
    agent_id: agentId ?? undefined,
  });

  trackListingInteraction({
    id: propertyId,
    city,
    area,
    listingType,
    propertyType,
  });

  if (!isSupabaseConfigured() || isDemoProperty(propertyId)) return;

  const supabase = createClient();
  await supabase.rpc("increment_contact_clicks", {
    property_id: propertyId,
  });

  void fetch("/api/analytics/listing-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingId: propertyId,
      eventType: channel === "whatsapp" ? "whatsapp_click" : "call_click",
      city,
      metadata: { placement, listingType, propertyType },
    }),
  });
}
