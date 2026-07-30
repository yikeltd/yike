"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  BedDouble,
  Bath,
  Home,
  ShieldCheck,
  Building,
  Maximize2,
  Zap,
  Droplets,
  Car,
  Tv,
  Wifi,
  Waves,
  Sun,
  Calculator,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn, isVerifiedAgent } from "@/lib/utils";
import { DynamicWatermark } from "@/components/ui/dynamic-watermark";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ShareButton } from "@/components/property/listing-share-menu";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { buildMotionSlides } from "@/lib/media/items";
import { PropertyGalleryModal } from "./property-gallery-modal";
import { PropertyTrustIndicators } from "./property-trust-indicators";
import { AgentContactCard } from "./agent-contact-card";
import { PropertyCard } from "./property-card";
import { PropertyNegotiationModal } from "./property-negotiation-modal";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

const AMENITY_ICONS: Record<string, typeof Zap> = {
  power: Zap,
  generator: Zap,
  solar: Sun,
  water: Droplets,
  parking: Car,
  security: ShieldCheck,
  pool: Waves,
  swimming: Waves,
  wifi: Wifi,
  internet: Wifi,
  tv: Tv,
};

function getAmenityIcon(amenityName: string) {
  const lower = amenityName.toLowerCase();
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Home;
}

export function PropertyDetailExperience({
  property,
  similarListings = [],
  ownerBanner,
}: {
  property: Property;
  similarListings?: Property[];
  ownerBanner?: React.ReactNode;
}) {
  const router = useRouter();
  const { guardAction } = useAuth();
  const slides = buildMotionSlides(property);
  const photos = slides.map((s) => s.url);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenGalleryOpen, setFullscreenGalleryOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const agent = property.agent;
  const verified =
    property.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);

  const listingPrice = Number(property.price);
  const priceFormatted = formatPrice(
    listingPrice,
    property.payment_period,
    property.listing_type
  );

  const monthlyEstimate =
    property.listing_type === "rent"
      ? formatPrice(Math.round(listingPrice / 12))
      : formatPrice(Math.round(listingPrice / 120));

  const cleanLocation = [property.area, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  const shareUrl = listingAbsoluteUrl(property);
  const mainPhoto =
    photos[activePhotoIndex] ||
    photos[0] ||
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&fit=crop";

  const defaultAmenities = [
    "24/7 Gated Security",
    "Standby Generator",
    "Treated Water Supply",
    "Ample Car Parking",
    "CCTV Surveillance",
    "Boys Quarter (BQ)",
    "Fully Fitted Kitchen",
    "Balcony Views",
  ];

  const propertyAmenities =
    property.extras?.amenities && Array.isArray(property.extras.amenities)
      ? property.extras.amenities.map(String)
      : defaultAmenities;

  const extrasObj = (property.extras as Record<string, unknown> | null) || {};

  const propertyHighlights = [
    { label: "Listing Type", value: property.listing_type === "rent" ? "For Rent" : "For Sale", icon: Building },
    { label: "Bedrooms", value: property.bedrooms ? `${property.bedrooms} Beds` : "3 Beds", icon: BedDouble },
    { label: "Bathrooms", value: property.bathrooms ? `${property.bathrooms} Baths` : "3 Baths", icon: Bath },
    { label: "Property Type", value: property.property_type ? property.property_type.replace(/_/g, " ") : "House", icon: Home },
  ];

  const detailedSpecs = [
    { label: "Title Document", value: (extrasObj.title as string) || "Governor's Consent" },
    { label: "Condition", value: (extrasObj.condition as string) || "Brand New" },
    { label: "Furnishing", value: (extrasObj.furnishing as string) || "Semi-Furnished" },
    { label: "Service Charge", value: extrasObj.service_charge ? String(extrasObj.service_charge) : "₦350,000 / year" },
    { label: "Caution Deposit", value: (extrasObj.caution as string) || "10%" },
    { label: "Legal & Agency Fee", value: extrasObj.legal_fee ? String(extrasObj.legal_fee) : "10% / 10%" },
  ];

  async function handleWhatsAppDirect() {
    if (!agent?.id) return;
    setChatLoading(true);
    const href = typeof window !== "undefined" ? window.location.pathname : `/properties/${property.id}`;
    const result = await trackLeadAndRedirect({
      listingId: property.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "sticky",
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

  function onStickyChatClick(e: React.MouseEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "whatsapp",
        listingId: property.id,
        redirectPath: `/properties/${property.id}`,
      },
      () => void handleWhatsAppDirect()
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-32 lg:pb-12 select-none">
      {ownerBanner}

      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all active:scale-95 hover:bg-white/20"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-wider text-gold">
          PROPERTY DETAILS
        </h1>

        <div className="flex items-center gap-2">
          <ListingSaveButton
            listingId={property.id}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
          />
          <ShareButton
            title={property.title}
            text={property.title}
            url={shareUrl}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
          />
        </div>
      </header>

      {/* MAIN CONTAINER: 2-COLUMN ON DESKTOP */}
      <div className="mx-auto max-w-6xl px-3.5 pt-4 lg:px-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT MAIN COLUMN */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* 1. HERO GALLERY */}
            <section className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl bg-navy overflow-hidden shadow-2xl group border border-navy/10 dark:border-white/10">
              <Image
                src={mainPhoto}
                alt={property.title}
                fill
                priority
                onClick={() => setFullscreenGalleryOpen(true)}
                className="object-cover cursor-pointer transition-transform duration-500 group-hover:scale-102"
              />

              <DynamicWatermark className="opacity-[0.06]" />

              {/* Status Badge */}
              <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                <span className="rounded-xl bg-[#031B4E]/90 px-3 py-1 text-[11px] font-black uppercase text-gold backdrop-blur-md shadow-sm border border-white/10">
                  {property.listing_type === "rent" ? "For Rent" : "For Sale"}
                </span>
                {verified && (
                  <span className="flex items-center gap-1 rounded-xl bg-emerald-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>

              {/* Photo Counter Pill & Fullscreen Trigger */}
              <button
                type="button"
                onClick={() => setFullscreenGalleryOpen(true)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/10 hover:bg-black/90 transition-all"
              >
                <Maximize2 className="h-3.5 w-3.5 text-gold" />
                <span>
                  {activePhotoIndex + 1} / {photos.length || 1}
                </span>
              </button>
            </section>

            {/* THUMBNAIL STRIP */}
            {photos.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {photos.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={cn(
                      "relative h-16 w-22 shrink-0 overflow-hidden rounded-2xl border-2 transition-all active:scale-95",
                      activePhotoIndex === idx
                        ? "border-gold ring-2 ring-gold/40 scale-102 opacity-100"
                        : "border-transparent opacity-65 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* 2. SUMMARY & HIGHLIGHTS */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-navy dark:text-white leading-snug max-w-xl">
                    {property.title}
                  </h1>
                  <span className="rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-gold px-3 py-1 text-xs font-extrabold shrink-0">
                    {extrasObj.condition ? String(extrasObj.condition) : "Verified Listing"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <p className="text-2xl sm:text-3xl font-black text-gold-dark dark:text-gold tracking-tight">
                    {priceFormatted}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCalculatorOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-navy/70 dark:text-white/70 hover:bg-slate-200"
                  >
                    <Calculator className="h-3.5 w-3.5 text-gold-dark dark:text-gold" />
                    <span>Est. {monthlyEstimate}/mo</span>
                  </button>
                </div>

                {calculatorOpen && (
                  <div className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3.5 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 animate-in fade-in duration-200">
                    <p className="font-bold">Estimated Cost Breakdown:</p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Asking price: {priceFormatted}. Estimated monthly breakdown: {monthlyEstimate}/month. Service charge & caution fee may apply depending on agreement.
                    </p>
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 dark:text-white/60 pt-3">
                  <MapPin className="h-4 w-4 text-gold shrink-0" />
                  <span>{cleanLocation}</span>
                </p>
              </div>

              {/* HIGHLIGHTS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                {propertyHighlights.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-navy/50 dark:text-white/50">
                        <Icon className="h-3 w-3 text-gold" />
                        {item.label}
                      </span>
                      <span className="text-xs font-black text-navy dark:text-white mt-1 truncate">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* TRUST BADGES SECTION */}
              <PropertyTrustIndicators listing={property} className="pt-2 border-t border-slate-100 dark:border-white/10" />
            </div>

            {/* 3. DESCRIPTION */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
                Property Description
              </h3>
              <p
                className={cn(
                  "text-xs sm:text-sm text-navy/80 dark:text-white/80 leading-relaxed whitespace-pre-line",
                  !descriptionExpanded && "line-clamp-4"
                )}
              >
                {property.description ||
                  `Spacious, newly built property located in the serene neighbourhood of ${property.area || "Lekki"}, ${property.city || "Lagos"}. Built to modern specifications with 24/7 security, treated water, and dedicated parking.`}
              </p>
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="text-xs font-bold text-gold-dark dark:text-gold hover:underline pt-1 block"
              >
                {descriptionExpanded ? "Show Less ▲" : "Read Full Description ▼"}
              </button>
            </div>

            {/* 4. AMENITIES & FEATURES */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
                Amenities & Features
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {propertyAmenities.map((amenity, i) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-2.5 text-xs font-bold text-navy/90 dark:text-white/90"
                    >
                      <Icon className="h-4 w-4 text-gold shrink-0" />
                      <span className="truncate">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. DETAILED SPECS */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
                  Property Specifications
                </h3>
                <button
                  type="button"
                  onClick={() => setSpecsExpanded((v) => !v)}
                  className="text-xs font-bold text-gold-dark dark:text-gold hover:underline"
                >
                  {specsExpanded ? "Show Less ▲" : "View All Specs ▼"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {detailedSpecs.slice(0, specsExpanded ? detailedSpecs.length : 4).map((spec, i) => (
                  <div
                    key={i}
                    className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                  >
                    <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                      {spec.label}
                    </span>
                    <span className="text-xs font-black text-navy dark:text-white mt-0.5 truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. MAP SECTION */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold" />
                  Location & Neighborhood
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Exact location disclosed after contact
                </span>
              </div>

              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&fit=crop"
                  alt="Location Map Preview"
                  fill
                  className="object-cover brightness-[0.8]"
                />
                <div className="absolute inset-0 bg-navy/20 backdrop-blur-[1px]" />
                <div className="relative z-10 text-center px-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#031B4E] text-white px-4 py-2 text-xs font-black shadow-lg border border-gold/40">
                    <MapPin className="h-4 w-4 text-gold" />
                    {cleanLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* 7. SIMILAR PROPERTIES */}
            {similarListings.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white">
                  Similar Properties You May Like
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similarListings.map((p) => (
                    <PropertyCard key={p.id} property={p} layout="desktop" />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN (DESKTOP STICKY SIDEBAR) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            <AgentContactCard listing={property} />
          </div>

        </div>
      </div>

      {/* 8. STICKY MOBILE ACTIONS BAR (ALWAYS VISIBLE ON MOBILE) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-navy/95 border-t border-navy/10 dark:border-white/10 backdrop-blur-md p-3 shadow-2xl">
        <div className="mx-auto max-w-xl grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onStickyChatClick}
            disabled={chatLoading}
            className="pressable flex items-center justify-center gap-2 rounded-2xl border-2 border-[#031B4E] dark:border-gold bg-white dark:bg-transparent py-3 text-xs font-black text-navy dark:text-gold hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4 text-navy dark:text-gold" />
            <span>{chatLoading ? "OPENING..." : "WHATSAPP CHAT"}</span>
          </button>

          <button
            type="button"
            onClick={() => setNegotiationOpen(true)}
            className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy hover:bg-gold-light shadow-md"
          >
            <TrendingUp className="h-4 w-4 text-navy" />
            <span>START NEGOTIATION</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN GALLERY MODAL */}
      {fullscreenGalleryOpen && (
        <PropertyGalleryModal
          photos={photos}
          initialIndex={activePhotoIndex}
          title={property.title}
          onClose={() => setFullscreenGalleryOpen(false)}
        />
      )}

      {/* NEGOTIATION MODAL */}
      {negotiationOpen && (
        <PropertyNegotiationModal
          property={property}
          onClose={() => setNegotiationOpen(false)}
        />
      )}
    </div>
  );
}
