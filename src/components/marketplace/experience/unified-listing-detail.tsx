"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  MapPin,
  Car,
  Fuel,
  Gauge,
  Palette,
  BedDouble,
  Bath,
  Home,
  ShieldCheck,
  Star,
  Phone,
  MessageCircle,
  ChevronDown,
  Building,
  CheckCircle2,
} from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn } from "@/lib/utils";
import { DynamicWatermark } from "@/components/ui/dynamic-watermark";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ShareButton } from "@/components/property/listing-share-menu";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { isTrustVerified } from "@/lib/hub-filters";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { buildMotionSlides } from "@/lib/media/items";

type Props = {
  listing: Property;
  similarListings?: Property[];
  ownerBanner?: React.ReactNode;
};

export function UnifiedListingDetail({ listing, ownerBanner }: Props) {
  const router = useRouter();
  const isVehicle = normalizeAssetType(listing.asset_type) === "VEHICLE";
  const slides = buildMotionSlides(listing);
  const photos = slides.map((s) => s.url);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const priceFormatted = formatPrice(
    Number(listing.price),
    listing.payment_period,
    listing.listing_type
  );

  const verified = isTrustVerified(listing);
  const agent = listing.agent;
  const sellerName = agent?.company_name || agent?.full_name || "Verified Seller";
  const sellerLogo = agent?.avatar_url || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&q=80&fit=crop";
  const sellerCity = listing.city || "Nigeria";
  const whatsappNumber = agent?.whatsapp || agent?.phone || "2348000000000";
  const phoneNumber = agent?.phone || agent?.whatsapp || "2348000000000";

  const cleanLocation = [listing.area, listing.city, listing.state]
    .filter(Boolean)
    .join(", ");

  const shareUrl = listingAbsoluteUrl(listing);

  // EXACTLY 5 EQUAL QUICK SPECIFICATION CARDS
  const vehicleSpecs = [
    { label: "Mileage", value: listing.mileage != null ? `${Number(listing.mileage).toLocaleString()} km` : "Low km", icon: Gauge },
    { label: "Fuel", value: listing.fuel_type ? listing.fuel_type.toUpperCase() : "Petrol", icon: Fuel },
    { label: "Transmission", value: listing.transmission ? listing.transmission.replace(/_/g, " ") : "Automatic", icon: Car },
    { label: "Year", value: listing.year ? String(listing.year) : "2020+", icon: Home },
    { label: "Condition", value: listing.vehicle_condition ? listing.vehicle_condition.replace(/_/g, " ") : "Foreign Used", icon: ShieldCheck },
  ];

  const propertySpecs = [
    { label: "Bedrooms", value: listing.bedrooms != null ? `${listing.bedrooms} Beds` : "3 Beds", icon: BedDouble },
    { label: "Bathrooms", value: listing.bathrooms != null ? `${listing.bathrooms} Baths` : "3 Baths", icon: Bath },
    { label: "Property Type", value: listing.property_type ? listing.property_type.replace(/_/g, " ") : "Apartment", icon: Home },
    { label: "Listing Type", value: listing.listing_type === "rent" ? "For Rent" : "For Sale", icon: Building },
    { label: "Security", value: "Verified Gated", icon: ShieldCheck },
  ];

  const quickSpecs = isVehicle ? vehicleSpecs : propertySpecs;

  // TWO-COLUMN STRUCTURED SPECIFICATION GRID
  const detailsGrid = isVehicle
    ? [
        { label: "Make", value: listing.make || "Toyota" },
        { label: "Model", value: listing.model || "Camry" },
        { label: "Year", value: listing.year ? String(listing.year) : "2019" },
        { label: "Mileage", value: listing.mileage != null ? `${Number(listing.mileage).toLocaleString()} km` : "N/A" },
        { label: "Fuel Type", value: listing.fuel_type ? listing.fuel_type.toUpperCase() : "Petrol" },
        { label: "Transmission", value: listing.transmission ? listing.transmission.replace(/_/g, " ") : "Automatic" },
        { label: "Condition", value: listing.vehicle_condition ? listing.vehicle_condition.replace(/_/g, " ") : "Foreign Used" },
        { label: "Location", value: cleanLocation },
      ]
    : [
        { label: "Property Type", value: listing.property_type ? listing.property_type.replace(/_/g, " ") : "Flat" },
        { label: "Listing Type", value: listing.listing_type === "rent" ? "For Rent" : "For Sale" },
        { label: "Bedrooms", value: listing.bedrooms != null ? String(listing.bedrooms) : "N/A" },
        { label: "Bathrooms", value: listing.bathrooms != null ? String(listing.bathrooms) : "N/A" },
        { label: "Payment Period", value: listing.payment_period || "Yearly" },
        { label: "State", value: listing.state || "Lagos" },
        { label: "City", value: listing.city || "Lagos" },
        { label: "Area", value: listing.area || "Mainland" },
      ];

  const mainPhoto = photos[activePhotoIndex] || photos[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&fit=crop";

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] pb-28">
      {ownerBanner}

      {/* 1. FULL-WIDTH HERO IMAGE WITH DYNAMIC USERNAME WATERMARK */}
      <section className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-navy overflow-hidden">
        <Image
          src={mainPhoto}
          alt={listing.title}
          fill
          priority
          className="object-cover"
        />

        {/* DYNAMIC USERNAME WATERMARK OVERLAY (NO BRAND LOGO INSIDE HERO) */}
        <DynamicWatermark />

        {/* TOP OVERLAY: BACK BUTTON (LEFT), SHARE & WISHLIST BUTTONS (RIGHT) */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-navy/70 via-navy/30 to-transparent">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md shadow-md transition-all active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2">
            <ShareButton
              title={listing.title}
              text={listing.title}
              url={shareUrl}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md shadow-md transition-all active:scale-95"
            />
            <ListingSaveButton
              listingId={listing.id}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md shadow-md transition-all active:scale-95"
            />
          </div>
        </div>

        {/* PHOTO COUNTER OVERLAY */}
        <div className="absolute bottom-3 right-3 z-20 rounded-full bg-navy/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm border border-white/10">
          {activePhotoIndex + 1} / {photos.length || 1}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-3.5 pt-3 space-y-4">
        {/* 2. IMAGE GALLERY STRIP */}
        {photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {photos.slice(0, 6).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  activePhotoIndex === idx ? "border-gold ring-2 ring-gold/30" : "border-transparent opacity-75"
                )}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                <DynamicWatermark className="opacity-[0.05]" />
                {idx === 5 && photos.length > 6 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-navy/70 text-xs font-black text-white backdrop-blur-xs">
                    +{photos.length - 6}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {/* 3. LISTING BADGES */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-black uppercase text-navy shadow-xs">
            {listing.listing_type === "rent" ? "FOR RENT" : "FOR SALE"}
          </span>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified</span>
            </span>
          ) : null}
          {listing.is_featured ? (
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-navy shadow-xs">
              Featured
            </span>
          ) : null}
          <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy/80">
            {isVehicle ? "Vehicle" : "Property"}
          </span>
        </div>

        {/* 4. PRICE */}
        <div>
          <h1 className="text-2xl font-black text-navy sm:text-3xl tracking-tight leading-none">
            {priceFormatted}
          </h1>
        </div>

        {/* 5. TITLE */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-navy/90 line-clamp-2 leading-snug">
            {listing.title}
          </h2>
        </div>

        {/* 6. LOCATION (NO MAP PREVIEW / NO GOOGLE MAPS BUTTON) */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-navy/60">
          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
          <span>{cleanLocation}</span>
        </div>

        {/* 7. QUICK SPECIFICATIONS (EXACTLY 5 EQUAL CARDS) */}
        <div className="grid grid-cols-5 gap-1.5 py-1">
          {quickSpecs.map((spec, i) => {
            const Icon = spec.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-navy/10 shadow-xs text-center min-h-[68px]"
              >
                <Icon className="h-4 w-4 text-gold mb-1 shrink-0" />
                <span className="text-[9px] font-medium text-navy/50 block leading-tight truncate w-full">
                  {spec.label}
                </span>
                <span className="text-[11px] font-black text-navy leading-tight truncate w-full mt-0.5">
                  {spec.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* 8. DEALER / AGENT CARD */}
        <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-navy/10 bg-slate-100">
                <Image src={sellerLogo} alt={sellerName} fill className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-black text-navy">{sellerName}</h3>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-navy/60">
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>4.9</span>
                  </span>
                  <span>•</span>
                  <span>{sellerCity}</span>
                  <span>•</span>
                  <span className="font-bold text-navy">14 listings</span>
                </div>
              </div>
            </div>

            <Link
              href={agent ? `/agent/${agent.id}` : "/search"}
              className="shrink-0 rounded-xl bg-navy/5 border border-navy/15 px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy/10 transition-all"
            >
              View Store →
            </Link>
          </div>
        </div>

        {/* 9. DESCRIPTION */}
        {listing.description ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-xs space-y-1.5">
            <h3 className="text-xs font-black uppercase text-navy/60 tracking-wider">Description</h3>
            <p className={cn("text-xs text-navy/80 leading-relaxed", !descriptionExpanded && "line-clamp-4")}>
              {listing.description}
            </p>
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline pt-0.5"
            >
              <span>{descriptionExpanded ? "Show less" : "Read more"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", descriptionExpanded && "rotate-180")} />
            </button>
          </div>
        ) : null}

        {/* 10. DETAILS SECTION (TWO-COLUMN STRUCTURED GRID) */}
        <div className="rounded-2xl border border-navy/10 bg-white p-3.5 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-navy/60 tracking-wider">Specifications & Details</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {detailsGrid.map((item, idx) => (
              <div key={idx} className="flex flex-col p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-navy/50">{item.label}</span>
                <span className="text-xs font-bold text-navy mt-0.5 capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 11. STICKY BOTTOM ACTION BAR (EXACTLY TWO BUTTONS: CALL SELLER & CHAT SELLER) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-navy/10 backdrop-blur-md p-3 shadow-lg">
        <div className="mx-auto max-w-4xl grid grid-cols-2 gap-2.5">
          <a
            href={`tel:${phoneNumber}`}
            className="pressable flex items-center justify-center gap-2 rounded-2xl border border-navy/20 bg-navy/5 py-3 text-xs font-bold text-navy hover:bg-navy/10 active:scale-[0.98] transition-all"
          >
            <Phone className="h-4 w-4 text-navy" />
            <span>Call Seller</span>
          </a>

          <a
            href={`https://wa.me/${whatsappNumber.replace(/\+/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in your listing on Yike: ${listing.title}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat Seller</span>
          </a>
        </div>
      </div>
    </div>
  );
}
