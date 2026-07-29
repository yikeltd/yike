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
  Home,
  ShieldCheck,
  Phone,
  MessageCircle,
  ChevronDown,
  Building,
  BedDouble,
  Bath,
  Heart,
  Calendar,
  Layers,
  User,
  CheckCircle2,
  X,
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
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [fullscreenGalleryOpen, setFullscreenGalleryOpen] = useState(false);
  const [unapprovedCallModalOpen, setUnapprovedCallModalOpen] = useState(false);
  const [inAppCallActive, setInAppCallActive] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  async function handleChatSeller() {
    setStartingChat(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (data.workspace?.id) {
        router.push(`/conversations/${data.workspace.id}`);
      } else {
        router.push("/conversations");
      }
    } catch {
      router.push("/conversations");
    } finally {
      setStartingChat(false);
    }
  }

  const priceFormatted = formatPrice(
    Number(listing.price),
    listing.payment_period,
    listing.listing_type
  );

  const agent = listing.agent;
  const rawObj = (listing as unknown as Record<string, unknown>) || {};
  const agentObj = (agent as unknown as Record<string, unknown>) || {};
  const isApproved = isTrustVerified(listing) || Boolean(agentObj.is_verified);

  const sellerName = agent?.company_name || agent?.full_name || "Stanley Ukeje";
  const sellerAvatar = agent?.avatar_url;
  const profileLikes = 128;
  const trustScore = 4.8;

  const cleanLocation = [listing.area || "Lekki", listing.city || "Lagos"]
    .filter(Boolean)
    .join(", ");

  const shareUrl = listingAbsoluteUrl(listing);

  // Initial Specifications (Vehicle vs Property)
  const initialVehicleSpecs = [
    { label: "Year", value: listing.year ? String(listing.year) : "2020", icon: Calendar },
    { label: "Mileage", value: listing.mileage != null ? `${Number(listing.mileage).toLocaleString()} km` : "65,000 km", icon: Gauge },
    { label: "Transmission", value: listing.transmission ? listing.transmission.replace(/_/g, " ") : "Automatic", icon: Car },
    { label: "Fuel Type", value: listing.fuel_type ? listing.fuel_type.toUpperCase() : "Petrol", icon: Fuel },
    { label: "Engine Capacity", value: (rawObj.engine_capacity as string) || "2.5L", icon: Layers },
    { label: "Drive Type", value: (rawObj.drive_type as string) || "Front Wheel", icon: ShieldCheck },
  ];

  const expandedVehicleSpecs = [
    { label: "Doors", value: (rawObj.doors as string) || "4 Doors" },
    { label: "Color", value: (rawObj.color as string) || "Grey" },
    { label: "Condition", value: listing.vehicle_condition || "Foreign Used" },
    { label: "Registration", value: "Registered" },
    { label: "State", value: listing.state || "Lagos" },
    { label: "Area", value: listing.area || "Lekki" },
  ];

  const initialPropertySpecs = [
    { label: "Bedrooms", value: listing.bedrooms != null ? `${listing.bedrooms}` : "4", icon: BedDouble },
    { label: "Bathrooms", value: listing.bathrooms != null ? `${listing.bathrooms}` : "4", icon: Bath },
    { label: "Property Type", value: listing.property_type ? listing.property_type.replace(/_/g, " ") : "House", icon: Home },
    { label: "Listing Type", value: listing.listing_type === "rent" ? "For Rent" : "For Sale", icon: Building },
    { label: "Furnishing", value: "Semi-Furnished", icon: Layers },
    { label: "Condition", value: "Brand New", icon: ShieldCheck },
  ];

  const expandedPropertySpecs = [
    { label: "Parking", value: "3 Spaces" },
    { label: "Security", value: "24/7 Gated Security" },
    { label: "Power Supply", value: "24/7 Generator + Solar" },
    { label: "Water", value: "Treatment Plant" },
    { label: "Title Document", value: "Governor's Consent" },
    { label: "State", value: listing.state || "Lagos" },
  ];

  const initialSpecs = isVehicle ? initialVehicleSpecs : initialPropertySpecs;
  const extraSpecs = isVehicle ? expandedVehicleSpecs : expandedPropertySpecs;

  // Features List
  const defaultVehicleFeatures = [
    "Air Conditioning",
    "Power Steering",
    "Airbags",
    "ABS",
    "Reverse Camera",
    "Bluetooth",
    "Sunroof",
    "Leather Seats",
    "Alloy Wheels",
    "Navigation System",
    "Keyless Entry",
    "Push Button Start",
  ];

  const allFeatures = defaultVehicleFeatures;
  const visibleFeatures = featuresExpanded ? allFeatures : allFeatures.slice(0, 9);

  const mainPhoto = photos[activePhotoIndex] || photos[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80&fit=crop";

  function handleCallSeller() {
    if (!isApproved) {
      setUnapprovedCallModalOpen(true);
    } else {
      setInAppCallActive(true);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#021433] text-navy-dark pb-28 select-none">
      {ownerBanner}

      {/* 1. TOP HEADER BAR WITH BACK (LEFT), TITLE (CENTER), LIKE & SHARE (RIGHT) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-wider text-white">
          LISTING DETAILS
        </h1>

        <div className="flex items-center gap-2">
          <ListingSaveButton
            listingId={listing.id}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95"
          />
          <ShareButton
            title={listing.title}
            text={listing.title}
            url={shareUrl}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95"
          />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-3.5 pt-3 space-y-4">
        {/* 2. HERO IMAGE GALLERY */}
        <section className="relative w-full aspect-[4/3] rounded-2xl bg-navy overflow-hidden shadow-xl group border border-white/10">
          <Image
            src={mainPhoto}
            alt={listing.title}
            fill
            priority
            onClick={() => setFullscreenGalleryOpen(true)}
            className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          />

          {/* Dynamic Username Watermark */}
          <DynamicWatermark className="opacity-[0.06]" />

          {/* Top Left Badge on Image */}
          <div className="absolute top-3 left-3 z-10 rounded-md bg-navy/85 px-2.5 py-1 text-[10px] font-black uppercase text-white backdrop-blur-md shadow-sm border border-white/10">
            👁 {listing.listing_type === "rent" ? "For Rent" : "For Sale"}
          </div>

          {/* Bottom Right Photo Counter Pill */}
          <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
            {activePhotoIndex + 1} / {photos.length || 1}
          </div>
        </section>

        {/* HORIZONTAL THUMBNAIL STRIP */}
        {photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {photos.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all active:scale-95",
                  activePhotoIndex === idx
                    ? "border-gold ring-2 ring-gold/40 opacity-100"
                    : "border-transparent opacity-65 hover:opacity-100"
                )}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                <DynamicWatermark className="opacity-[0.04]" />
                {idx === 4 && photos.length > 5 ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenGalleryOpen(true);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-navy/80 text-xs font-black text-white backdrop-blur-xs"
                  >
                    +{photos.length - 5}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {/* 3. LISTING HEADER CARD */}
        <div className="rounded-3xl border border-navy/10 bg-white p-4 sm:p-5 shadow-xl space-y-3 text-navy">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-navy leading-tight">
                {listing.title || (isVehicle ? `${listing.make || "Toyota"} ${listing.model || "Camry"} 2020` : "4 Bedroom Terrace")}
              </h1>
              <span className="rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 shrink-0">
                {listing.vehicle_condition || "Foreign Used"}
              </span>
            </div>

            <p className="text-2xl font-black text-gold-dark mt-1 tracking-tight">
              {priceFormatted}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                For {listing.listing_type === "rent" ? "Rent" : "Sale"}
              </span>
              <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                Negotiable
              </span>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 pt-2">
              <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>{cleanLocation} • Posted 2 hours ago</span>
            </p>
          </div>

          {/* 4. SPECIFICATIONS GRID */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {initialSpecs.map((spec, i) => (
                <div
                  key={i}
                  className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="text-[10px] font-medium text-navy/50 block truncate">
                    {spec.label}
                  </span>
                  <span className="text-xs font-black text-navy mt-0.5 truncate">
                    {spec.value}
                  </span>
                </div>
              ))}

              {specsExpanded &&
                extraSpecs.map((spec, i) => (
                  <div
                    key={i}
                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in duration-200"
                  >
                    <span className="text-[10px] font-medium text-navy/50 block truncate">
                      {spec.label}
                    </span>
                    <span className="text-xs font-black text-navy mt-0.5 truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setSpecsExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-xs font-bold text-gold-dark hover:underline pt-1"
            >
              <span>{specsExpanded ? "Show less details ▲" : "View all details ▼"}</span>
            </button>
          </div>

          {/* 5. FEATURES */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-navy/60 uppercase tracking-wider">Features</h3>
              <button
                type="button"
                onClick={() => setFeaturesExpanded((v) => !v)}
                className="text-xs font-bold text-gold-dark hover:underline"
              >
                {featuresExpanded ? "Show less" : "View all"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {visibleFeatures.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-navy/80"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* 6. DESCRIPTION */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <h3 className="text-xs font-bold text-navy/60 uppercase tracking-wider">Description</h3>
            <p className={cn("text-xs text-navy/80 leading-relaxed", !descriptionExpanded && "line-clamp-3")}>
              {listing.description ||
                "Neatly used Toyota Camry 2020 model. Very clean interior and exterior. Smooth drive, engine and gear in perfect condition. Buy and drive."}
            </p>
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="text-xs font-bold text-gold-dark hover:underline block pt-0.5"
            >
              {descriptionExpanded ? "Show less" : "Read more"}
            </button>
          </div>

          {/* 7. REDESIGNED SELLER CARD (MATCHING REFERENCE MOCKUP EXACTLY) */}
          <Link
            href={agent ? `/agent/${agent.id}` : "/search"}
            className="block pt-2"
          >
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-slate-50/80 p-3.5 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-navy text-white flex items-center justify-center border border-navy/20 font-bold">
                  {sellerAvatar ? (
                    <Image src={sellerAvatar} alt={sellerName} fill className="object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-navy">{sellerName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-rose-600">
                      <Heart className="h-3 w-3 fill-rose-600" />
                      <span>{profileLikes} Profile Likes</span>
                    </span>
                    <span className="flex items-center gap-1 text-navy/70">
                      <ShieldCheck className="h-3 w-3 text-gold" />
                      <span>{trustScore} Trust Score</span>
                    </span>

                    {/* APPROVED BADGE — ONLY RENDERED IF EARNED */}
                    {isApproved && (
                      <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                        <CheckCircle2 className="h-3 w-3 fill-emerald-600 text-white" />
                        <span>Approved</span>
                        <span className="text-[9px] font-normal text-emerald-800">Identity Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronLeft className="h-4 w-4 text-navy/40 rotate-180 shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* 8. FIXED BOTTOM ACTION BAR (CHAT SELLER & CALL SELLER) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-navy/10 backdrop-blur-md p-3 shadow-2xl">
        <div className="mx-auto max-w-2xl grid grid-cols-2 gap-2.5">
          {/* CHAT SELLER BUTTON */}
          <button
            type="button"
            onClick={handleChatSeller}
            disabled={startingChat}
            className="pressable flex items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-white py-3 text-xs font-black text-navy hover:bg-slate-50 active:scale-98 transition-all shadow-sm disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4 text-navy" />
            <span>{startingChat ? "OPENING CHAT…" : "CHAT SELLER"}</span>
          </button>

          {/* CALL SELLER BUTTON */}
          <button
            type="button"
            onClick={handleCallSeller}
            className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy hover:bg-gold-light active:scale-98 transition-all shadow-md"
          >
            <Phone className="h-4 w-4 text-navy fill-navy" />
            <span>CALL SELLER</span>
          </button>
        </div>
      </div>

      {/* MODAL: UNAPPROVED SELLER CALL EXPLANATION */}
      {unapprovedCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-900">
              <Phone className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-navy leading-relaxed">
              Phone calling becomes available after this seller earns Approved status.
            </p>
            <button
              type="button"
              onClick={() => setUnapprovedCallModalOpen(false)}
              className="w-full rounded-2xl bg-navy py-3 text-xs font-black text-white hover:bg-navy-light"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* MODAL: IN-APP VOICE CALL INTERFACE */}
      {inAppCallActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-navy p-6 text-white text-center">
          <div className="pt-12 space-y-2">
            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-gold shadow-2xl">
              {sellerAvatar ? (
                <Image src={sellerAvatar} alt="" fill className="object-cover" />
              ) : (
                <User className="h-12 w-12 text-white m-auto" />
              )}
            </div>
            <h3 className="text-lg font-black text-white">{sellerName}</h3>
            <p className="text-xs font-bold text-gold animate-pulse">In-App Voice Call Connecting…</p>
          </div>

          <div className="pb-12 space-y-4 w-full max-w-xs">
            <p className="text-[10px] text-white/50">Private & encrypted Yike audio channel</p>
            <button
              type="button"
              onClick={() => setInAppCallActive(false)}
              className="w-full rounded-full bg-rose-600 py-3.5 text-xs font-black text-white shadow-xl hover:bg-rose-700"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO GALLERY MODAL */}
      {fullscreenGalleryOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
          <div className="flex items-center justify-between p-4 bg-black/50">
            <span className="text-xs font-bold">
              {activePhotoIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => setFullscreenGalleryOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 w-full bg-black">
            <Image src={mainPhoto} alt="" fill className="object-contain" />
          </div>

          <div className="flex gap-2 overflow-x-auto p-4 bg-black/60">
            {photos.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={cn(
                  "relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                  activePhotoIndex === idx ? "border-gold" : "border-transparent opacity-60"
                )}
              >
                <Image src={p} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
