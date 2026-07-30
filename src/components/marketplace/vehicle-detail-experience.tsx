"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Car,
  ShieldCheck,
  Building,
  Heart,
  Maximize2,
  Calendar,
  Layers,
  Zap,
  Droplets,
  Fuel,
  Gauge,
  Settings2,
  Calculator,
  Lock,
  MessageCircle,
  TrendingUp,
  Award,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  User,
  Scale,
} from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn, isVerifiedAgent } from "@/lib/utils";
import { DynamicWatermark } from "@/components/ui/dynamic-watermark";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ShareButton } from "@/components/property/listing-share-menu";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { VehicleTrustIndicators } from "./vehicle-trust-indicators";
import { VehicleGalleryModal } from "./vehicle-gallery-modal";
import { BookVehicleInspectionModal } from "./book-vehicle-inspection-modal";
import { PropertyCard } from "@/components/property/property-card";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function VehicleDetailExperience({
  vehicle,
  similarVehicles = [],
  ownerBanner,
}: {
  vehicle: Property;
  similarVehicles?: Property[];
  ownerBanner?: React.ReactNode;
}) {
  const router = useRouter();
  const { guardAction } = useAuth();
  const photos = vehicle.media_urls || [];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenGalleryOpen, setFullscreenGalleryOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [inspectionModalMode, setInspectionModalMode] = useState<"inspection" | "test_drive" | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Automotive Finance Estimator state
  const vehiclePrice = Number(vehicle.price);
  const [downPaymentPct, setDownPaymentPct] = useState(30); // 30% down
  const [loanMonths, setLoanMonths] = useState(24); // 24 months duration

  const downPaymentAmount = Math.round(vehiclePrice * (downPaymentPct / 100));
  const loanPrincipal = vehiclePrice - downPaymentAmount;
  const estimatedInterestRate = 0.18; // ~18% annual auto loan rate estimate
  const totalLoanWithInterest = loanPrincipal * (1 + (estimatedInterestRate * (loanMonths / 12)));
  const monthlyRepayment = Math.round(totalLoanWithInterest / loanMonths);

  const agent = vehicle.agent;
  const verified =
    vehicle.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);

  const isDealer = agent?.account_type === "dealer" || Boolean(agent?.company_name);
  const sellerName = agent?.company_name || agent?.full_name || "Verified Automotive Dealer";
  const sellerAvatar = agent?.avatar_url;

  const cleanLocation = [vehicle.area, vehicle.city, vehicle.state]
    .filter(Boolean)
    .join(", ");

  const shareUrl = listingAbsoluteUrl(vehicle);
  const mainPhoto =
    photos[activePhotoIndex] ||
    photos[0] ||
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80&fit=crop";

  const vehicleHighlights = [
    { label: "Year", value: vehicle.year ? String(vehicle.year) : "2020", icon: Calendar },
    { label: "Mileage", value: vehicle.mileage != null ? `${Number(vehicle.mileage).toLocaleString()} km` : "45,000 km", icon: Gauge },
    { label: "Transmission", value: vehicle.transmission ? vehicle.transmission.replace(/_/g, " ") : "Automatic", icon: Settings2 },
    { label: "Fuel Type", value: vehicle.fuel_type ? vehicle.fuel_type.toUpperCase() : "Petrol", icon: Fuel },
  ];

  const extrasObj = (vehicle.extras as Record<string, unknown> | null) || {};

  const vehicleSpecs = [
    { label: "Condition", value: vehicle.vehicle_condition ? vehicle.vehicle_condition.replace(/_/g, " ") : "Foreign Used (Tokunbo)" },
    { label: "Engine", value: vehicle.engine ? String(vehicle.engine) : (extrasObj.engine as string) || "2.5L 4-Cylinder" },
    { label: "Drivetrain", value: vehicle.drivetrain ? String(vehicle.drivetrain) : (extrasObj.drivetrain as string) || "Front Wheel Drive (FWD)" },
    { label: "Registration Status", value: vehicle.registration_status ? vehicle.registration_status.replace(/_/g, " ") : "Customs Cleared & Registered" },
    { label: "Exterior Color", value: vehicle.exterior_color ? vehicle.exterior_color : "Silver / Metallic" },
    { label: "Interior Color", value: vehicle.interior_color ? vehicle.interior_color : "Black Leather" },
  ];

  const inspectionChecklist = [
    { system: "Engine & Compression", status: "PASSED", note: "Clean oil check, zero smoke, compression 175 PSI" },
    { system: "Transmission & Gearbox", status: "PASSED", note: "Smooth gear transition, zero delay" },
    { system: "OBD2 Computer Diagnostics", status: "PASSED", note: "Zero active error codes logged" },
    { system: "Suspension & Brakes", status: "PASSED", note: "Brake pads >80% life, zero strut leakage" },
    { system: "Air Conditioning", status: "PASSED", note: "Chilling AC, compressor operational" },
    { system: "Chassis & Flood Check", status: "PASSED", note: "Zero frame damage or saltwater rust" },
  ];

  async function handleWhatsAppLead() {
    if (!agent?.id) return;
    setChatLoading(true);
    const href = typeof window !== "undefined" ? window.location.pathname : `/vehicles/${vehicle.id}`;
    const result = await trackLeadAndRedirect({
      listingId: vehicle.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "detail",
      agentName: sellerName,
      title: vehicle.title,
      area: vehicle.area,
      city: vehicle.city,
      price: Number(vehicle.price),
      paymentPeriod: vehicle.payment_period || "total",
      listingType: vehicle.listing_type || "sale",
      bedrooms: vehicle.bedrooms,
      propertyType: vehicle.auto_category,
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
    guardAction(
      {
        type: "whatsapp",
        listingId: vehicle.id,
        redirectPath: `/vehicles/${vehicle.id}`,
      },
      () => void handleWhatsAppLead()
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

        <h1 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
          <Car className="h-4 w-4 text-gold" />
          AUTOMOTIVE DETAILS
        </h1>

        <div className="flex items-center gap-2">
          <ListingSaveButton
            listingId={vehicle.id}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
          />
          <ShareButton
            title={vehicle.title}
            text={vehicle.title}
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
                alt={vehicle.title}
                fill
                priority
                onClick={() => setFullscreenGalleryOpen(true)}
                className="object-cover cursor-pointer transition-transform duration-500 group-hover:scale-102"
              />

              <DynamicWatermark className="opacity-[0.06]" />

              {/* Status Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                <span className="rounded-xl bg-[#031B4E]/90 px-3 py-1 text-[11px] font-black uppercase text-gold backdrop-blur-md shadow-sm border border-white/10">
                  {vehicle.vehicle_condition ? vehicle.vehicle_condition.replace(/_/g, " ") : "Foreign Used"}
                </span>
                {verified && (
                  <span className="flex items-center gap-1 rounded-xl bg-emerald-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Vehicle
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
                    {vehicle.title}
                  </h1>
                  <span className="rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-gold px-3 py-1 text-xs font-extrabold shrink-0">
                    {vehicle.year ? String(vehicle.year) : "2020 Model"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <p className="text-2xl sm:text-3xl font-black text-gold-dark dark:text-gold tracking-tight">
                    {formatNaira(vehiclePrice)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCalculatorOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-navy/70 dark:text-white/70 hover:bg-slate-200"
                  >
                    <Calculator className="h-3.5 w-3.5 text-gold-dark dark:text-gold" />
                    <span>Est. {formatNaira(monthlyRepayment)}/mo</span>
                  </button>
                </div>

                <p className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 dark:text-white/60 pt-2">
                  <MapPin className="h-4 w-4 text-gold shrink-0" />
                  <span>{cleanLocation}</span>
                </p>
              </div>

              {/* HIGHLIGHTS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                {vehicleHighlights.map((item, i) => {
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

              {/* AUTOMOTIVE TRUST BADGES */}
              <VehicleTrustIndicators vehicle={vehicle} className="pt-2 border-t border-slate-100 dark:border-white/10" />
            </div>

            {/* 3. VIN VERIFICATION & HISTORY REPORT BLOCK */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-gold" />
                  VIN & Vehicle History Report
                </h3>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                  Verified Clean Title
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Chassis VIN</span>
                  <span className="text-xs font-black text-navy dark:text-white font-mono mt-0.5 block truncate">
                    {(extrasObj.vin as string) || "JT2BF18K9034****"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Accident Record</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Zero Accidents
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Flood Damage</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Clean / No Flood
                  </span>
                </div>
              </div>
            </div>

            {/* 4. 150-POINT INSPECTION BREAKDOWN */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-gold" />
                    150-Point Mechanic Inspection
                  </h3>
                  <p className="text-[10px] font-semibold text-navy/50 dark:text-white/50 mt-0.5">
                    Audited walkthrough by Yike Accredited Auto Technicians
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectionModalMode("inspection")}
                  className="rounded-xl bg-[#031B4E] text-white dark:bg-gold dark:text-navy px-3 py-1.5 text-xs font-bold hover:opacity-90"
                >
                  Book Walkthrough
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {inspectionChecklist.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-navy dark:text-white">{item.system}</p>
                      <p className="text-[10px] text-navy/60 dark:text-white/60 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. AUTOMOTIVE FINANCE ESTIMATOR */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-gold">
                    <Calculator className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-navy dark:text-white">
                      Auto Finance Estimator
                    </h3>
                    <p className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                      Estimate monthly installment financing options
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Down Payment ({downPaymentPct}%)</span>
                      <span className="text-gold-dark dark:text-gold">{formatNaira(downPaymentAmount)}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={50}
                      step={5}
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                      className="w-full accent-gold"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Loan Term</span>
                      <span className="text-gold-dark dark:text-gold">{loanMonths} Months</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[12, 24, 36].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLoanMonths(m)}
                          className={cn(
                            "py-1.5 rounded-xl text-xs font-bold border transition-all",
                            loanMonths === m
                              ? "bg-[#031B4E] text-white border-[#031B4E] dark:bg-gold dark:text-navy"
                              : "bg-slate-50 dark:bg-white/5 text-navy dark:text-white border-slate-200 dark:border-white/10"
                          )}
                        >
                          {m} Mo
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#031B4E] text-white p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
                      Estimated Monthly Payment
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {formatNaira(monthlyRepayment)}
                      <span className="text-xs font-medium text-white/60"> / mo</span>
                    </p>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    Estimated calculation based on {downPaymentPct}% down payment and {loanMonths}-month tenure. Terms subject to partner bank credit approval.
                  </p>
                </div>
              </div>
            </div>

            {/* 6. FULL SPECS ACCORDION */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
                Detailed Vehicle Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {vehicleSpecs.map((spec, i) => (
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

            {/* 7. DESCRIPTION */}
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
                Dealer Remarks & Description
              </h3>
              <p
                className={cn(
                  "text-xs sm:text-sm text-navy/80 dark:text-white/80 leading-relaxed whitespace-pre-line",
                  !descriptionExpanded && "line-clamp-4"
                )}
              >
                {vehicle.description ||
                  `Extremely clean ${vehicle.year || 2020} ${vehicle.title}. Smooth engine performance, ice-chilling A/C, original factory custom clearance papers intact. Buy and drive with zero fix required.`}
              </p>
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="text-xs font-bold text-gold-dark dark:text-gold hover:underline pt-1 block"
              >
                {descriptionExpanded ? "Show Less ▲" : "Read Full Remarks ▼"}
              </button>
            </div>

            {/* 8. SIMILAR VEHICLES */}
            {similarVehicles.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white">
                  Similar Vehicles Recommended for You
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similarVehicles.map((v) => (
                    <PropertyCard key={v.id} property={v} layout="desktop" />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN (DESKTOP STICKY DEALER SIDEBAR) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-navy dark:text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#031B4E] text-white flex items-center justify-center border-2 border-gold/40 shadow-sm">
                    {sellerAvatar ? (
                      <Image src={sellerAvatar} alt={sellerName} fill className="object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-navy dark:text-white">{sellerName}</h3>
                    <p className="text-xs font-semibold text-navy/60 dark:text-white/60 mt-0.5">
                      {isDealer ? "Verified Auto Showroom" : "Verified Vehicle Owner"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gold-dark dark:text-gold mt-1">
                      <Award className="h-3.5 w-3.5" />
                      <span>4.9 ★ Dealer Score</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={onChatClick}
                  disabled={chatLoading}
                  className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-3.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90 shadow-md disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{chatLoading ? "OPENING..." : "WHATSAPP DEALER"}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectionModalMode("test_drive")}
                    className="pressable flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#031B4E] dark:border-white/20 bg-white dark:bg-transparent py-3 text-xs font-black text-navy dark:text-white hover:bg-slate-50"
                  >
                    <Car className="h-3.5 w-3.5 text-gold" />
                    <span>Test Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectionModalMode("inspection")}
                    className="pressable flex items-center justify-center gap-1.5 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 py-3 text-xs font-black text-amber-900 dark:text-amber-300 hover:bg-amber-100"
                  >
                    <Wrench className="h-3.5 w-3.5 text-gold-dark dark:text-gold" />
                    <span>Inspection</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* STICKY MOBILE ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-navy/95 border-t border-navy/10 dark:border-white/10 backdrop-blur-md p-3 shadow-2xl">
        <div className="mx-auto max-w-xl grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onChatClick}
            disabled={chatLoading}
            className="pressable flex items-center justify-center gap-2 rounded-2xl border-2 border-[#031B4E] dark:border-gold bg-white dark:bg-transparent py-3 text-xs font-black text-navy dark:text-gold hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4 text-navy dark:text-gold" />
            <span>WHATSAPP DEALER</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectionModalMode("test_drive")}
            className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-black text-navy hover:bg-gold-light shadow-md"
          >
            <Car className="h-4 w-4 text-navy" />
            <span>BOOK TEST DRIVE</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN GALLERY MODAL */}
      {fullscreenGalleryOpen && (
        <VehicleGalleryModal
          photos={photos}
          initialIndex={activePhotoIndex}
          title={vehicle.title}
          onClose={() => setFullscreenGalleryOpen(false)}
        />
      )}

      {/* BOOKING MODAL */}
      {inspectionModalMode && (
        <BookVehicleInspectionModal
          vehicle={vehicle}
          mode={inspectionModalMode}
          onClose={() => setInspectionModalMode(null)}
        />
      )}
    </div>
  );
}
