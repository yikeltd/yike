"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { trackEvent } from "@/lib/analytics";

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

  if (!isSupabaseConfigured() || isDemoProperty(propertyId)) return;

  const supabase = createClient();
  await supabase.rpc("increment_contact_clicks", {
    property_id: propertyId,
  });
}
