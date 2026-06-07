"use client";

import Link from "next/link";
import {
  Heart,
  MapPin,
  MessageCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { recordEngagementSave } from "@/lib/engagement";
import { trackSavedListing, type NotInterestedReason } from "@/lib/browse-preferences";
import type { Property } from "@/types/database";
import { formatPrice, listingTypeLabel } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/badge";
import { isTrustVerified } from "@/lib/hub-filters";
import { AmenityChips } from "@/components/property/amenity-chips";
import { trackLeadAndRedirect } from "@/lib/leads/client";
import { formatMoveInHint } from "@/lib/rent-breakdown";
import { MotionSlide } from "@/components/browse/motion-slide";
import {
  trackSwipeListingOpen,
  trackSwipeSave,
  trackSwipeWhatsapp,
} from "@/lib/swipe/analytics";
import { trackEvent } from "@/lib/analytics";
import {
  isGuestFavorite,
  toggleGuestFavorite,
} from "@/lib/guest-favorites";
import { isDemoProperty } from "@/lib/mock-listings";
import { cn } from "@/lib/utils";

function HideSimilarMenu({
  onSelect,
  onDismiss,
}: {
  onSelect: (reason: NotInterestedReason) => void;
  onDismiss: () => void;
}) {
  const options: { reason: NotInterestedReason; label: string }[] = [
    { reason: "wrong_location", label: "Wrong area" },
    { reason: "too_expensive", label: "Too costly" },
    { reason: "not_interested", label: "Not for me" },
  ];

  return (
    <div
      className="absolute right-0 top-10 z-20 min-w-[9.5rem] overflow-hidden rounded-xl bg-navy/95 py-1 shadow-float backdrop-blur-sm"
      role="menu"
    >
      {options.map((opt) => (
        <button
          key={opt.reason}
          type="button"
          role="menuitem"
          className="pressable block w-full px-3 py-2 text-left text-xs font-semibold text-white/90 hover:bg-white/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(opt.reason);
          }}
        >
          {opt.label}
        </button>
      ))}
      <button
        type="button"
        className="pressable block w-full border-t border-white/10 px-3 py-1.5 text-left text-[10px] font-medium text-white/50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
      >
        Cancel
      </button>
    </div>
  );
}

export function BrowseSlide({
  property,
  priority,
  showSwipeHint,
  horizontal,
  isActive = true,
  motionEnabled = true,
  onNotInterested,
}: {
  property: Property;
  priority?: boolean;
  showSwipeHint?: boolean;
  horizontal?: boolean;
  isActive?: boolean;
  motionEnabled?: boolean;
  onNotInterested?: (property: Property, reason: NotInterestedReason) => void;
}) {
  const { guardAction, user, isListingSaved, setListingSaved } = useAuth();
  const [waLoading, setWaLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const agent = property.agent;
  const wa = agent?.whatsapp || agent?.phone;
  const verified = isTrustVerified(property);
  const isDemo = isDemoProperty(property.id);
  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const moveIn = formatMoveInHint(property);
  const amenities = property.extras?.amenities ?? [];

  useEffect(() => {
    if (isDemo) return;
    if (!user?.id) {
      setSaved(isGuestFavorite(property.id));
      return;
    }
    setSaved(isListingSaved(property.id));
  }, [property.id, isDemo, user?.id, isListingSaved]);

  const handleSave = useCallback(() => {
    if (isDemo || saved) return;

    setSaved(true);
    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 480);

    trackSwipeSave({
      listing_id: property.id,
      city: property.city,
      area: property.area,
    });

    if (!user?.id) {
      toggleGuestFavorite(property.id);
      recordEngagementSave();
      trackSavedListing(property.id, {
        city: property.city,
        area: property.area,
        listingType: property.listing_type,
        propertyType: property.property_type,
      });
      trackEvent("save_listing", {
        listing_id: property.id,
        city: property.city,
        source: "swipe_guest",
      });
      return;
    }

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
          data: { user: u },
        } = await supabase.auth.getUser();
        if (!u) return;
        await supabase.from("favorites").upsert(
          { user_id: u.id, property_id: property.id },
          { onConflict: "user_id,property_id", ignoreDuplicates: true }
        );
        setListingSaved(property.id, true);
        recordEngagementSave();
        trackSavedListing(property.id, {
          city: property.city,
          area: property.area,
          listingType: property.listing_type,
          propertyType: property.property_type,
        });
        trackEvent("save_listing", {
          listing_id: property.id,
          city: property.city,
          source: "swipe",
        });
      }
    );
  }, [guardAction, property, user?.id, isDemo, saved]);

  return (
    <article className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-navy-dark">
      <Link
        href={`/properties/${property.id}`}
        className="absolute inset-0 z-0"
        onClick={() =>
          trackSwipeListingOpen({
            listing_id: property.id,
            city: property.city,
            area: property.area,
          })
        }
      >
        <MotionSlide
          property={property}
          isActive={isActive && motionEnabled}
          priority={priority}
        />
      </Link>
      <div className="gradient-scrim pointer-events-none absolute inset-0 z-[1]" />

      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4 pt-[max(3.25rem,env(safe-area-inset-top))]">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {listingTypeLabel(property.listing_type)}
          </span>
          {verified && <VerifiedBadge size="sm" />}
        </div>
        {onNotInterested && (
          <div className="relative">
            <button
              type="button"
              className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-navy/75 text-white/90 backdrop-blur-sm"
              aria-label="Hide similar listings"
              aria-expanded={hideOpen}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setHideOpen((v) => !v);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {hideOpen && (
              <HideSimilarMenu
                onSelect={(reason) => {
                  setHideOpen(false);
                  onNotInterested(property, reason);
                }}
                onDismiss={() => setHideOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {showSwipeHint && (
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center justify-center gap-1 text-white/80 animate-pulse-soft">
          {horizontal ? (
            <span className="text-xs font-semibold">Swipe for next home</span>
          ) : (
            <>
              <ChevronRight className="h-6 w-6 rotate-[-90deg]" />
              <span className="text-xs font-semibold">Swipe for next home</span>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 space-y-3 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="pr-14">
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

        {wa ? (
          <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy shadow-glow-gold"
              aria-label="Chat on WhatsApp"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!wa || !agent?.id) return;
                trackSwipeWhatsapp({
                  listing_id: property.id,
                  city: property.city,
                  area: property.area,
                });
                guardAction(
                  {
                    type: "whatsapp",
                    listingId: property.id,
                    redirectPath: `/properties/${property.id}`,
                  },
                  async () => {
                    setWaLoading(true);
                    const result = await trackLeadAndRedirect({
                      listingId: property.id,
                      agentId: agent.id,
                      leadType: "whatsapp",
                      sourcePage: `/browse`,
                      placement: "browse",
                      agentName: agent.full_name ?? "Agent",
                      title: property.title,
                      area: property.area,
                      city: property.city,
                      price: Number(property.price),
                      paymentPeriod: property.payment_period,
                      listingType: property.listing_type,
                      bedrooms: property.bedrooms,
                      propertyType: property.property_type,
                      whatsapp: agent.whatsapp,
                      phone: agent.phone,
                    });
                    setWaLoading(false);
                    if (result.ok && result.redirectUrl) {
                      window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
                      if (result.handoffUrl) {
                        window.setTimeout(() => {
                          window.location.href = result.handoffUrl!;
                        }, 400);
                      }
                    }
                  }
                );
              }}
              disabled={waLoading}
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={cn(
                "pressable flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 ease-out",
                savePulse && "scale-110",
                saved && "bg-gold/25 text-gold-light"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              aria-label="Save listing"
            >
              <Heart className={cn("h-4 w-4 transition-transform duration-300", saved && "scale-110 fill-current")} />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
