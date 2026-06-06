"use client";

import Link from "next/link";
import { Heart, MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { recordEngagementSave } from "@/lib/engagement";
import type { Property } from "@/types/database";
import { formatPrice, listingTypeLabel } from "@/lib/utils";
import { ListingImage } from "@/components/property/listing-image";
import { VerifiedBadge } from "@/components/ui/badge";
import { isTrustVerified } from "@/lib/hub-filters";
import {
  propertyWhatsAppMessage,
  whatsAppDeepLink,
} from "@/lib/whatsapp";
import { AmenityChips } from "@/components/property/amenity-chips";
import { trackContactClick } from "@/lib/contact-tracking";
import { listingImageAlt } from "@/lib/image-seo";
import { formatMoveInHint } from "@/lib/rent-breakdown";

export function BrowseSlide({
  property,
  priority,
  showSwipeHint,
  horizontal,
}: {
  property: Property;
  priority?: boolean;
  showSwipeHint?: boolean;
  horizontal?: boolean;
}) {
  const { guardAction } = useAuth();
  const image = property.media_urls[0] ?? "/placeholder-property.svg";
  const agent = property.agent;
  const wa = agent?.whatsapp || agent?.phone;
  const waUrl =
    wa &&
    whatsAppDeepLink(
      wa,
      propertyWhatsAppMessage(
        property.title,
        property.area,
        property.city,
        property.id
      )
    );
  const verified = isTrustVerified(property);
  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const moveIn = formatMoveInHint(property);
  const amenities = property.extras?.amenities ?? [];

  return (
    <article className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-navy-dark">
      <Link href={`/properties/${property.id}`} className="absolute inset-0 z-0">
        <ListingImage
          src={image}
          alt={listingImageAlt(property)}
          priority={priority}
          sizes="100vw"
          width={1080}
        />
      </Link>
      <div className="gradient-scrim pointer-events-none absolute inset-0 z-[1]" />

      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {listingTypeLabel(property.listing_type)}
          </span>
          {verified && <VerifiedBadge size="sm" />}
        </div>
      </div>

      {showSwipeHint && (
        <div className="absolute left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center justify-center gap-1 text-white/80 animate-pulse-soft pointer-events-none">
          {horizontal ? (
            <>
              <span className="text-xs font-semibold">Swipe left to skip · right to save</span>
            </>
          ) : (
            <>
              <ChevronRight className="h-6 w-6 rotate-[-90deg]" />
              <span className="text-xs font-semibold">Swipe for next home</span>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 space-y-3 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-[clamp(1.6rem,7vw,2rem)] font-bold leading-none tracking-tight text-white tabular-nums">
            {price}
          </p>
          {moveIn && (
            <p className="mt-1 text-xs font-semibold text-gold-light">{moveIn}</p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white/95">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
            {property.area}, {property.city}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-white/85">
            {property.title}
          </p>
          {amenities.length > 0 && (
            <AmenityChips amenities={amenities} max={3} size="sm" className="mt-2" />
          )}
        </div>

        {wa && horizontal ? (
          <button
            type="button"
            className="pressable flex h-11 w-11 items-center justify-center self-end rounded-full bg-gold/95 text-navy shadow-glow-gold"
            aria-label="WhatsApp agent"
            onClick={(e) => {
              e.stopPropagation();
              if (!waUrl) return;
              guardAction(
                {
                  type: "whatsapp",
                  listingId: property.id,
                  redirectPath: `/properties/${property.id}`,
                  contactUrl: waUrl,
                },
                () => {
                  void trackContactClick({
                    propertyId: property.id,
                    channel: "whatsapp",
                    city: property.city,
                    listingType: property.listing_type,
                    propertyType: property.property_type,
                    placement: "browse",
                    agentId: agent?.id,
                  });
                  window.open(waUrl, "_blank", "noopener,noreferrer");
                }
              );
            }}
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          </button>
        ) : wa ? (
          <div className="flex gap-2.5">
            <button
              type="button"
              className="pressable flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold"
              onClick={(e) => {
                e.stopPropagation();
                if (!waUrl) return;
                guardAction(
                  {
                    type: "whatsapp",
                    listingId: property.id,
                    redirectPath: `/properties/${property.id}`,
                    contactUrl: waUrl,
                  },
                  () => {
                    void trackContactClick({
                      propertyId: property.id,
                      channel: "whatsapp",
                      city: property.city,
                      listingType: property.listing_type,
                      propertyType: property.property_type,
                      placement: "browse",
                      agentId: agent?.id,
                    });
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }
                );
              }}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
              Chat on WhatsApp
            </button>
            <button
              type="button"
              className="pressable flex h-12 min-w-[48px] items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                guardAction(
                  {
                    type: "save",
                    listingId: property.id,
                    redirectPath: `/properties/${property.id}`,
                  },
                  async () => {
                    if (!isSupabaseConfigured()) return;
                    const supabase = createClient();
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase.from("favorites").upsert(
                      { user_id: user.id, property_id: property.id },
                      { onConflict: "user_id,property_id", ignoreDuplicates: true }
                    );
                    recordEngagementSave();
                  }
                );
              }}
              aria-label="Save listing"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
