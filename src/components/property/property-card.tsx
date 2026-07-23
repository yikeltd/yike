"use client";

import Link from "next/link";
import { Heart, MessageCircle, MapPin, BedDouble, Bath, Car } from "lucide-react";
import type { Property } from "@/types/database";
import {
  formatPrice,
  isVerifiedAgent,
  listingTypeLabel,
  cn,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { useAuth } from "@/components/auth/auth-provider";
import {
  openWhatsAppLead,
  trackLeadAndRedirect,
} from "@/lib/leads/client";
import { trackEvent } from "@/lib/analytics";
import { recordEngagementSave } from "@/lib/engagement";
import { trackSavedListing } from "@/lib/browse-preferences";
import { listingImageAlt } from "@/lib/image-seo";
import { useEffect, useState } from "react";
import { ListingImage } from "./listing-image";
import { listingCardImage } from "@/lib/listing-gallery-images";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingDistanceLabel } from "@/components/marketplace/listing-distance-label";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { isFeaturedActive } from "@/lib/agent-tiers";
import {
  isGuestFavorite,
  toggleGuestFavorite,
} from "@/lib/guest-favorites";
import { logFeaturedAnalyticsEvent } from "@/lib/featured-promotions/analytics-client";
import {
  deriveSellerBuyerBadge,
  SELLER_BUYER_BADGE_LABELS,
} from "@/lib/seller-trust";

export type PropertyCardLayout = "mobile" | "desktop";
export type PropertyCardVariant = "default" | "browse";

function hasParking(property: Property): boolean {
  const amenities = property.extras?.amenities ?? [];
  return amenities.some((a) => /park/i.test(String(a)));
}

export function PropertyCard({
  property,
  layout = "mobile",
  priorityImage = false,
  inline,
  trackFeaturedAnalytics = false,
  variant = "default",
}: {
  property: Property;
  layout?: PropertyCardLayout;
  priorityImage?: boolean;
  inline?: boolean;
  trackFeaturedAnalytics?: boolean;
  /** Browse = inventory-first poster card (home rails). */
  variant?: PropertyCardVariant;
}) {
  const isBrowse = variant === "browse";
  const { guardAction, user, isListingSaved, setListingSaved } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const image = optimizeListingImageUrl(
    listingCardImage(property),
    layout === "desktop" ? 360 : 320
  );
  const agent = property.agent;
  const verified =
    property.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);
  const sellerBadge = agent ? deriveSellerBuyerBadge(agent) : null;
  const sellerBadgeLabel = sellerBadge
    ? SELLER_BUYER_BADGE_LABELS[sellerBadge]
    : null;
  const hasAgent = !!agent?.id;
  const isDemo = isDemoProperty(property.id);
  const href = listingPath(property);
  const featuredActive = isFeaturedActive(property);
  const parking = hasParking(property);

  useEffect(() => {
    if (!trackFeaturedAnalytics || !featuredActive || isDemo) return;
    logFeaturedAnalyticsEvent(property.id, "featured_impression");
  }, [trackFeaturedAnalytics, featuredActive, isDemo, property.id]);

  function handleFeaturedNavigate() {
    if (trackFeaturedAnalytics && featuredActive && !isDemo) {
      logFeaturedAnalyticsEvent(property.id, "featured_click");
    }
  }

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  useEffect(() => {
    if (isDemo) return;
    if (!user?.id) {
      setSaved(isGuestFavorite(property.id));
      return;
    }
    setSaved(isListingSaved(property.id));
  }, [property.id, isDemo, user?.id, isListingSaved]);

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
      setListingSaved(property.id, false);
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
        source: "account",
      });
      void fetch("/api/listing-leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: "save",
          listingId: property.id,
          sellerId: property.agent_id,
          listingTitle: property.title,
          sourcePage:
            typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
    }
    setSaving(false);
  }

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDemo) return;

    if (!user?.id) {
      const nowSaved = toggleGuestFavorite(property.id);
      setSaved(nowSaved);
      if (nowSaved) {
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
          source: "guest",
        });
      } else {
        trackEvent("unsave_listing", {
          listing_id: property.id,
          city: property.city,
          source: "guest",
        });
      }
      return;
    }

    guardAction(
      {
        type: "save",
        listingId: property.id,
        redirectPath: href,
      },
      () => void performSave()
    );
  }

  const sourcePage =
    typeof window !== "undefined" ? window.location.pathname : href;

  async function runWhatsApp() {
    if (!agent?.id) return;
    setChatLoading(true);
    const result = await trackLeadAndRedirect({
      listingId: property.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage,
      placement: "card",
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
    setChatLoading(false);
    if (result.ok && result.redirectUrl) {
      openWhatsAppLead(result);
    }
  }

  function onChatClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    guardAction(
      {
        type: "whatsapp",
        listingId: property.id,
        redirectPath: href,
      },
      () => void runWhatsApp()
    );
  }

  const imageAlt = listingImageAlt(property);
  const locationLabel = [property.area, property.city].filter(Boolean).join(", ");

  const attrs: { icon: typeof BedDouble; label: string }[] = [];
  if (property.bedrooms > 0) {
    attrs.push({
      icon: BedDouble,
      label: `${property.bedrooms} bd`,
    });
  }
  if (property.bathrooms > 0) {
    attrs.push({
      icon: Bath,
      label: `${property.bathrooms} ba`,
    });
  }
  if (parking) {
    attrs.push({ icon: Car, label: "Park" });
  }

  /* Inventory-first browse poster — photo · price · title · pin · verified */
  if (isBrowse) {
    return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-transparent">
        <Link
          href={href}
          prefetch={!isDemo}
          className="block"
          onClick={handleFeaturedNavigate}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-xl bg-navy/5",
              BROWSE_THUMB_ASPECT,
            )}
          >
            <ListingImage
              src={image}
              alt={imageAlt}
              priority={priorityImage}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
              width={480}
              className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            {isDemo ? (
              <span className="absolute left-1.5 top-1.5 z-10 rounded bg-navy px-1.5 py-0.5 text-[9px] font-bold text-gold">
                DEMO
              </span>
            ) : null}
          </div>
        </Link>

        {!isDemo ? (
          <div className="pointer-events-none absolute right-1.5 top-1.5 z-10">
            <button
              type="button"
              onClick={toggleSave}
              disabled={saving}
              className={cn(
                "pointer-events-auto pressable flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-[2px] transition-opacity",
                saving && "opacity-70",
                !saved && "opacity-80 group-hover:opacity-100",
              )}
              aria-label={saved ? "Unsave listing" : "Save listing"}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5",
                  saved ? "fill-red-500 text-red-500" : "text-white",
                )}
              />
            </button>
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-0 pt-1.5">
          <Link
            href={href}
            prefetch={!isDemo}
            className="block min-w-0"
            onClick={handleFeaturedNavigate}
          >
            <p className="text-[13px] font-bold tabular-nums leading-tight tracking-tight text-navy sm:text-sm">
              {price}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-snug text-navy sm:text-[12px]">
              {property.title}
            </p>
            {locationLabel ? (
              <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-navy/50">
                <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
                <span className="line-clamp-1">{locationLabel}</span>
                <ListingDistanceLabel
                  city={property.city}
                  state={property.state}
                  className="ml-auto shrink-0 tabular-nums text-navy/40"
                />
              </p>
            ) : null}
            {sellerBadgeLabel ? (
              <p
                className={cn(
                  "mt-0.5 text-[9px] font-bold uppercase tracking-wide",
                  sellerBadge === "verified_seller"
                    ? "text-emerald-700"
                    : sellerBadge === "verification_pending"
                      ? "text-amber-800"
                      : "text-navy/45"
                )}
              >
                {sellerBadge === "verified_seller"
                  ? "✓ Verified"
                  : sellerBadge === "verification_pending"
                    ? "⏳ Pending"
                    : "Unverified"}
              </p>
            ) : verified ? (
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                Verified
              </p>
            ) : null}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group card-lift relative flex h-full flex-col overflow-hidden rounded-xl bg-elevated shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
        inline ? "" : ""
      )}
    >
      <Link
        href={href}
        prefetch={!isDemo}
        className="block"
        onClick={handleFeaturedNavigate}
      >
        {/* Image ~50–55% of card — fixed aspect for consistent row height */}
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          <ListingImage
            src={image}
            alt={imageAlt}
            priority={priorityImage}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
            width={480}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-2.75rem)] flex-wrap gap-1">
            <span className="rounded bg-navy/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {listingTypeLabel(property.listing_type)}
            </span>
            {verified ? (
              <span
                className="rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm"
                title="Verified"
              >
                ✓
              </span>
            ) : null}
            {featuredActive ? (
              <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-navy">
                Feat
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Compact overlay CTAs — primary conversion stays on detail */}
      <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex gap-0.5">
        <button
          type="button"
          onClick={toggleSave}
          disabled={saving || isDemo}
          className={cn(
            "pointer-events-auto pressable flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm",
            saving && "opacity-70"
          )}
          aria-label={saved ? "Unsave listing" : "Save listing"}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5",
              saved ? "fill-red-500 text-red-500" : "text-navy/70"
            )}
          />
        </button>
        {hasAgent && !isDemo ? (
          <button
            type="button"
            onClick={onChatClick}
            disabled={chatLoading}
            className="pointer-events-auto pressable flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm disabled:opacity-70"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 text-navy/70" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2 sm:px-2 sm:pb-2 sm:pt-1.5">
        <Link
          href={href}
          prefetch={!isDemo}
          className="block min-w-0"
          onClick={handleFeaturedNavigate}
        >
          <p className="text-sm font-bold tabular-nums leading-tight tracking-tight text-foreground sm:text-[15px]">
            {price}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-foreground/90 sm:text-[13px]">
            {property.title}
          </p>
          <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-muted sm:text-[11px]">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
            <span className="line-clamp-1">{locationLabel}</span>
          </p>
          {attrs.length > 0 ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-muted sm:text-[11px]">
              {attrs.slice(0, 3).map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-0.5">
                  <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  {label}
                </span>
              ))}
            </p>
          ) : null}
        </Link>
      </div>
    </article>
  );
}

/** @deprecated use PropertyCard */
export const ListingCard = PropertyCard;
