"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, isVerifiedAgent } from "@/lib/utils";
import { listingPath } from "@/lib/marketplace/listing-path";
import { buildMotionSlides } from "@/lib/media/items";
import { PropertyTrustIndicators } from "./property-trust-indicators";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

export function PropertyQuickPreviewModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const { guardAction } = useAuth();
  const slides = buildMotionSlides(property);
  const photos = slides.map((s) => s.url);
  const [activePhoto, setActivePhoto] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const href = listingPath(property);
  const agent = property.agent;
  const verified =
    property.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);

  async function handleWhatsApp() {
    if (!agent?.id) return;
    setChatLoading(true);
    const result = await trackLeadAndRedirect({
      listingId: property.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: typeof window !== "undefined" ? window.location.pathname : href,
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
    guardAction(
      {
        type: "whatsapp",
        listingId: property.id,
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
              Quick Preview
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
              alt={property.title}
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
              {property.title}
            </h3>
            <p className="flex items-center gap-1 text-xs font-semibold text-navy/60 dark:text-white/60 mt-1">
              <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>
                {[property.area, property.city, property.state]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
          </div>

          {/* SPECS */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[10px] text-navy/50 dark:text-white/50 block">Bedrooms</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5">
                <BedDouble className="h-3.5 w-3.5 text-gold" />
                {property.bedrooms || "-"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[10px] text-navy/50 dark:text-white/50 block">Bathrooms</span>
              <span className="font-black text-navy dark:text-white flex items-center gap-1 mt-0.5">
                <Bath className="h-3.5 w-3.5 text-gold" />
                {property.bathrooms || "-"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[10px] text-navy/50 dark:text-white/50 block">Type</span>
              <span className="font-black text-navy dark:text-white truncate block mt-0.5 capitalize">
                {property.property_type ? property.property_type.replace(/_/g, " ") : "House"}
              </span>
            </div>
          </div>

          {/* TRUST BADGES */}
          <PropertyTrustIndicators listing={property} />
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
            <span>Full Details Page</span>
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
