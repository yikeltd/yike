"use client";

import Link from "next/link";
import { Heart, MessageCircle, MapPin, BedDouble, Bath, Phone } from "lucide-react";
import type { Property } from "@/types/database";
import {
  formatPrice,
  formatPhoneForTel,
  isVerifiedAgent,
  listingTypeLabel,
  cn,
} from "@/lib/utils";
import { VerifiedBadge, FeaturedBadge, TrendingBadge, NewListingBadge } from "@/components/ui/badge";
import {
  propertyWhatsAppMessage,
  whatsAppDeepLink,
} from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { useAuth } from "@/components/auth/auth-provider";
import { trackContactClick } from "@/lib/contact-tracking";
import { trackEvent } from "@/lib/analytics";
import { recordEngagementSave } from "@/lib/engagement";
import { listingImageAlt } from "@/lib/image-seo";
import { useEffect, useState } from "react";
import { ListingImage } from "./listing-image";
import { ListingFreshness, getListingFreshness } from "./listing-freshness";
import { AmenityChips } from "./amenity-chips";
import { formatMoveInHint } from "@/lib/rent-breakdown";

export type PropertyCardLayout = "mobile" | "desktop";

export function PropertyCard({
  property,
  layout = "mobile",
  priorityImage = false,
  inline,
}: {
  property: Property;
  layout?: PropertyCardLayout;
  priorityImage?: boolean;
  inline?: boolean;
}) {
  const { guardAction, user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const image = property.media_urls[0] ?? "/placeholder-property.svg";
  const agent = property.agent;
  const verified =
    property.is_verified_listing ||
    (agent && isVerifiedAgent(agent.verification_status));
  const wa = agent?.whatsapp || agent?.phone;
  const tel = agent?.phone || agent?.whatsapp;
  const isDemo = isDemoProperty(property.id);
  const href = `/properties/${property.id}`;

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const moveInHint = formatMoveInHint(property);
  const amenities = property.extras?.amenities ?? [];

  useEffect(() => {
    if (isDemo || !user?.id || !isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", property.id)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [property.id, isDemo, user?.id]);

  async function performSave() {
    if (!user?.id || !isSupabaseConfigured()) return;
    setSaving(true);
    const supabase = createClient();
    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", property.id);
      setSaved(false);
      trackEvent("unsave_listing", {
        listing_id: property.id,
        city: property.city,
        source: "account",
      });
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        property_id: property.id,
      });
      setSaved(true);
      recordEngagementSave();
      trackEvent("save_listing", {
        listing_id: property.id,
        city: property.city,
        source: "account",
      });
    }
    setSaving(false);
  }

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDemo) return;
    guardAction(
      {
        type: "save",
        listingId: property.id,
        redirectPath: `/properties/${property.id}`,
      },
      () => void performSave()
    );
  }

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
  const telUrl = tel ? `tel:${formatPhoneForTel(tel)}` : null;

  function onWhatsAppClick(e: React.MouseEvent) {
    e.preventDefault();
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
          placement: "card",
          agentId: agent?.id,
        });
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
    );
  }

  function onCallClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!telUrl) return;
    guardAction(
      {
        type: "call",
        listingId: property.id,
        redirectPath: `/properties/${property.id}`,
        contactUrl: telUrl,
      },
      () => {
        void trackContactClick({
          propertyId: property.id,
          channel: "call",
          city: property.city,
          listingType: property.listing_type,
          propertyType: property.property_type,
          placement: "card",
          agentId: agent?.id,
        });
        window.location.href = telUrl;
      }
    );
  }

  const freshness = getListingFreshness(
    property.updated_at,
    property.created_at,
    property.views_count
  );

  const badges = (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 lg:left-4 lg:top-4">
      <span className="rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        {listingTypeLabel(property.listing_type)}
      </span>
      {verified && <VerifiedBadge size="sm" />}
      {property.is_featured && <FeaturedBadge />}
      {freshness.tone === "trending" && <TrendingBadge />}
      {freshness.tone === "new" && !property.is_featured && <NewListingBadge />}
    </div>
  );

  const saveBtn = (
    <button
      type="button"
      onClick={toggleSave}
      disabled={saving || isDemo}
      className={cn(
        "pressable absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm lg:right-4 lg:top-4 lg:h-11 lg:w-11",
        saving && "opacity-70"
      )}
      aria-label="Save"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all lg:h-5 lg:w-5",
          saved ? "fill-red-500 text-red-500" : "text-navy"
        )}
      />
    </button>
  );

  const specs =
    (property.bedrooms > 0 || property.bathrooms > 0) && (
      <div className="flex gap-3 text-xs font-semibold text-white/90 lg:text-muted">
        {property.bedrooms > 0 && (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""}
          </span>
        )}
        {property.bathrooms > 0 && (
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );

  const imageAlt = listingImageAlt(property);

  const contactRow = wa && (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={onWhatsAppClick}
        className="pressable flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold lg:min-h-[44px]"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
        Chat on WhatsApp
      </button>
      {tel && (
        <button
          type="button"
          onClick={onCallClick}
          className="pressable flex h-12 min-w-[48px] items-center justify-center rounded-xl bg-surface text-navy lg:h-11 lg:min-w-[44px]"
        >
          <Phone className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (layout === "desktop") {
    return (
      <article className="group card-lift overflow-hidden rounded-2xl bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
        <Link href={href} prefetch={!isDemo} className="block">
          <div className="relative aspect-[5/4] overflow-hidden bg-surface">
            <ListingImage
              src={image}
              alt={imageAlt}
              priority={priorityImage}
              sizes="(max-width: 1280px) 33vw, 420px"
              width={900}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            {badges}
            {saveBtn}
          </div>
        </Link>
        <div className="space-y-3.5 p-5 lg:p-6">
          <Link href={href} prefetch={!isDemo} className="block">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground lg:text-[1.65rem]">
              {price}
            </p>
            {moveInHint && (
              <p className="mt-1 text-xs font-semibold text-gold-dark">
                {moveInHint}
              </p>
            )}
            <p className="mt-2 line-clamp-1 text-[15px] font-semibold leading-snug text-foreground/90">
              {property.title}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
              {property.area}, {property.city}
            </p>
            <ListingFreshness
              updatedAt={property.updated_at}
              createdAt={property.created_at}
              viewsCount={property.views_count}
              className="mt-2.5 block"
            />
            {amenities.length > 0 && (
              <AmenityChips
                amenities={amenities}
                max={3}
                className="mt-3"
              />
            )}
          </Link>
          {specs && (
            <div className="flex gap-4 text-xs font-semibold text-muted">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" />
                  {property.bedrooms} beds
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  {property.bathrooms} baths
                </span>
              )}
            </div>
          )}
          {contactRow}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "card-lift overflow-hidden rounded-[1.25rem] bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
        inline ? "" : "mx-2.5 lg:mx-0"
      )}
    >
      <Link href={href} prefetch={!isDemo} className="block pressable">
        <div className="relative aspect-[5/6] overflow-hidden bg-surface sm:aspect-[4/5]">
          <ListingImage
            src={image}
            alt={imageAlt}
            priority={priorityImage}
            sizes="100vw"
            width={1080}
          />
          <div className="gradient-scrim pointer-events-none absolute inset-0" />
          {badges}
          {saveBtn}
          <div className="absolute bottom-0 left-0 right-0 z-10 space-y-2 p-4 pb-5">
            <p className="text-[clamp(1.5rem,6vw,1.85rem)] font-bold leading-none tracking-tight text-white tabular-nums">
              {price}
            </p>
            {moveInHint && (
              <p className="text-xs font-semibold text-gold-light">
                {moveInHint}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white/95">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="line-clamp-1">
                {property.area}, {property.city}
              </span>
            </p>
            <p className="line-clamp-1 text-[13px] font-medium text-white/80">
              {property.title}
            </p>
            {amenities.length > 0 && (
              <AmenityChips amenities={amenities} max={2} size="sm" />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {specs}
              <ListingFreshness
                updatedAt={property.updated_at}
                createdAt={property.created_at}
                viewsCount={property.views_count}
                dark
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </Link>
      {contactRow && <div className="p-4 pt-3">{contactRow}</div>}
    </article>
  );
}

/** @deprecated use PropertyCard */
export const ListingCard = PropertyCard;
