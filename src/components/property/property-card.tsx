"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Eye,
  Share2,
  ShieldCheck,
  Award,
  User,
  Clock,
} from "lucide-react";
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
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { trackEvent } from "@/lib/analytics";
import { recordEngagementSave } from "@/lib/engagement";
import { trackSavedListing } from "@/lib/browse-preferences";
import { listingImageAlt } from "@/lib/image-seo";
import { ListingImage } from "./listing-image";
import { listingCardImage } from "@/lib/listing-gallery-images";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingDistanceLabel } from "@/components/marketplace/listing-distance-label";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { isGuestFavorite, toggleGuestFavorite } from "@/lib/guest-favorites";
import { logFeaturedAnalyticsEvent } from "@/lib/featured-promotions/analytics-client";
import {
  PlacementBadge,
  featuredPlacementChrome,
} from "@/components/marketplace/placement-badge";
import { resolvePlacementKind } from "@/lib/marketplace/placement";
import { PropertyQuickPreviewModal } from "./property-quick-preview-modal";

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
  variant?: PropertyCardVariant;
}) {
  const isBrowse = variant === "browse";
  const { guardAction, user, isListingSaved, setListingSaved } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [quickPreviewOpen, setQuickPreviewOpen] = useState(false);

  const image = optimizeListingImageUrl(
    listingCardImage(property),
    layout === "desktop" ? 360 : 320
  );
  const agent = property.agent;
  const verified =
    property.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);
  const hasAgent = !!agent?.id;
  const isDemo = isDemoProperty(property.id);
  const href = listingPath(property);
  const featuredActive = isFeaturedActive(property);
  const placement = resolvePlacementKind(property);
  const parking = hasParking(property);

  const sellerAvatar = agent?.avatar_url;
  const sellerName = agent?.company_name || agent?.full_name || "Agent";

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

  function openQuickPreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setQuickPreviewOpen(true);
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

  return (
    <>
      <article
        className={cn(
          "group card-lift relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-elevated shadow-card ring-1 ring-black/[0.04] dark:ring-white/[0.08]",
          inline ? "" : ""
        )}
      >
        <Link
          href={href}
          prefetch={!isDemo}
          className="block"
          onClick={handleFeaturedNavigate}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-surface">
            <ListingImage
              src={image}
              alt={imageAlt}
              priority={priorityImage}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
              width={480}
              className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-4rem)] flex-wrap gap-1">
              <span className="rounded-md bg-navy/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                {listingTypeLabel(property.listing_type)}
              </span>
              {placement ? (
                <PlacementBadge kind={placement} compact />
              ) : null}
              {verified ? (
                <span
                  className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm"
                  title="Verified"
                >
                  ✓ Verified
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        {/* OVERLAY ACTION BUTTONS: HEART & QUICK PREVIEW */}
        <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex gap-1">
          <button
            type="button"
            onClick={openQuickPreview}
            className="pointer-events-auto pressable flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-navy shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
            title="Quick Preview"
          >
            <Eye className="h-3.5 w-3.5 text-navy/80" />
          </button>
          <button
            type="button"
            onClick={toggleSave}
            disabled={saving || isDemo}
            className={cn(
              "pointer-events-auto pressable flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition-transform hover:scale-105",
              saving && "opacity-70"
            )}
            aria-label={saved ? "Unsave listing" : "Save listing"}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-transform active:scale-125",
                saved ? "fill-red-500 text-red-500" : "text-navy/70"
              )}
            />
          </button>
        </div>

        {/* CARD DETAILS */}
        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
          <Link
            href={href}
            prefetch={!isDemo}
            className="block min-w-0 space-y-1"
            onClick={handleFeaturedNavigate}
          >
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-sm font-black tabular-nums leading-tight tracking-tight text-foreground sm:text-base">
                {price}
              </p>
              <span className="text-[9px] font-bold text-gold-dark dark:text-gold flex items-center gap-0.5">
                <Award className="h-2.5 w-2.5" />
                4.8★
              </span>
            </div>

            <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground/90 sm:text-[13px]">
              {property.title}
            </p>

            <p className="flex items-center gap-0.5 text-[10px] font-medium text-muted sm:text-[11px]">
              <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
              <span className="line-clamp-1">{locationLabel}</span>
            </p>

            {attrs.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-muted pt-0.5">
                {attrs.slice(0, 3).map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-0.5">
                    <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </Link>

          {/* AGENT FOOTER & WHATSAPP BUTTON */}
          <div className="mt-2.5 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 text-[10px] text-muted">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[#031B4E] text-white flex items-center justify-center font-bold text-[8px]">
                {sellerAvatar ? (
                  <Image src={sellerAvatar} alt={sellerName} fill className="object-cover" />
                ) : (
                  <User className="h-3 w-3 text-white" />
                )}
              </div>
              <span className="truncate font-medium text-foreground/80 max-w-[80px]">
                {sellerName}
              </span>
            </div>

            {hasAgent && !isDemo && (
              <button
                type="button"
                onClick={onChatClick}
                disabled={chatLoading}
                className="pressable flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold hover:bg-emerald-100"
              >
                <MessageCircle className="h-2.5 w-2.5" />
                <span>Chat</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* QUICK PREVIEW MODAL */}
      {quickPreviewOpen && (
        <PropertyQuickPreviewModal
          property={property}
          onClose={() => setQuickPreviewOpen(false)}
        />
      )}
    </>
  );
}

/** @deprecated use PropertyCard */
export const ListingCard = PropertyCard;
