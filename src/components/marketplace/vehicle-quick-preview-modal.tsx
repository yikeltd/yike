"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  Gauge,
  Settings2,
  Fuel,
  Calendar,
} from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, isVerifiedAgent } from "@/lib/utils";
import { listingPath } from "@/lib/marketplace/listing-path";
import { VehicleTrustIndicators } from "./vehicle-trust-indicators";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

export function VehicleQuickPreviewModal({
  vehicle,
  onClose,
}: {
  vehicle: Property;
  onClose: () => void;
}) {
  const { guardAction } = useAuth();
  const photos = vehicle.media_urls || [];
  const [activePhoto, setActivePhoto] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  const price = formatPrice(Number(vehicle.price));
  const href = listingPath(vehicle);
  const agent = vehicle.agent;
  const verified =
    vehicle.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);

  async function handleWhatsApp() {
    if (!agent?.id) return;
    setChatLoading(true);
    const result = await trackLeadAndRedirect({
      listingId: vehicle.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: typeof window !== "undefined" ? window.location.pathname : href,
      placement: "card",
      agentName: agent.full_name ?? "Dealer",
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
        redirectPath: href,
      },
      () => void handleWhatsApp()
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in slide-in-from-bottom-6 duration-200">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#031B4E] px-2 py-0.5 text-[10px] font-black uppercase text-gold">
              Vehicle Preview
            </span>
            {verified && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* GALLERY PREVIEW */}
        <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
          {photos.length > 0 ? (
            <Image
              src={photos[activePhoto]}
              alt={vehicle.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40 text-xs">
              No photos available
            </div>
          )}

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              {activePhoto + 1} / {photos.length}
            </div>
          )}

          {/* Prev/Next buttons */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-xl font-black text-navy dark:text-gold tracking-tight">
              {price}
            </p>
            <h3 className="text-sm font-bold text-navy dark:text-white mt-0.5 line-clamp-2">
              {vehicle.title}
            </h3>
            <p className="flex items-center gap-1 text-xs font-semibold text-navy/60 dark:text-white/60 mt-1">
              <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>
                {[vehicle.area, vehicle.city, vehicle.state]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
          </div>

          {/* AUTOMOTIVE SPECS */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] text-navy/50 dark:text-white/50 block">Year</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-gold" />
                {vehicle.year || "-"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] text-navy/50 dark:text-white/50 block">Mileage</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5 truncate">
                <Gauge className="h-3 w-3 text-gold" />
                {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : "-"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] text-navy/50 dark:text-white/50 block">Gear</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5 capitalize truncate">
                <Settings2 className="h-3 w-3 text-gold" />
                {vehicle.transmission || "Auto"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] text-navy/50 dark:text-white/50 block">Fuel</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5 capitalize truncate">
                <Fuel className="h-3 w-3 text-gold" />
                {vehicle.fuel_type || "Petrol"}
              </span>
            </div>
          </div>

          {/* TRUST BADGES */}
          <VehicleTrustIndicators vehicle={vehicle} />
        </div>

        {/* ACTION FOOTER */}
        <div className="border-t border-slate-100 dark:border-white/10 p-3 bg-slate-50 dark:bg-navy-light flex items-center gap-2">
          {agent?.id && (
            <button
              type="button"
              onClick={onChatClick}
              disabled={chatLoading}
              className="pressable flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-[#031B4E] dark:border-gold py-2.5 text-xs font-black text-navy dark:text-gold bg-white dark:bg-transparent hover:bg-slate-100"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Lead</span>
            </button>
          )}

          <Link
            href={href}
            onClick={onClose}
            className="pressable flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-2.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90"
          >
            <span>Full Vehicle Page</span>
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
