"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { MarketplaceBackButton } from "@/components/marketplace/marketplace-back-button";
import type { Property } from "@/types/database";
import { formatPrice, cn, isVerifiedAgent } from "@/lib/utils";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ShareButton } from "@/components/property/listing-share-menu";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import {
  electronicsCategoryLabel,
  ELECTRONICS_CONDITIONS,
  electronicsWarrantyStatusLabel,
} from "@/lib/marketplace/electronics-specs";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { ListingInquiryActions } from "@/components/marketplace/listing-inquiry-actions";

function nativeContactEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE_NATIVE_CONTACT?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}
import { useAuth } from "@/components/auth/auth-provider";
import { ElectronicsCard } from "./electronics-card";
import { ReportListingForm } from "@/components/property/report-form";

function conditionLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return ELECTRONICS_CONDITIONS.find((c) => c.id === id)?.label ?? id.replace(/_/g, " ");
}

export function ElectronicsDetailExperience({
  listing,
  similar = [],
  ownerBanner,
  browseReturnParam,
}: {
  listing: Property;
  similar?: Property[];
  ownerBanner?: React.ReactNode;
  browseReturnParam?: string | null;
}) {
  const { guardAction } = useAuth();
  const [chatLoading, setChatLoading] = useState(false);
  const photos = listing.media_urls ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const agent = listing.agent;
  const verified =
    listing.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);
  const attrs = (listing.attributes ?? {}) as Record<string, unknown>;
  const shareUrl = listingAbsoluteUrl(listing);
  const mainPhoto = photos[activeIndex] ?? photos[0] ?? "/images/logo.webp";

  const specRows: { label: string; value: string }[] = [
    { label: "Category", value: electronicsCategoryLabel(listing.auto_category) },
    { label: "Brand", value: listing.make ?? "—" },
    { label: "Model", value: listing.model ?? "—" },
    { label: "Condition", value: conditionLabel(listing.condition) },
  ];
  const warrantyStatus = electronicsWarrantyStatusLabel(
    String(attrs.warranty_status ?? ""),
  );
  if (warrantyStatus) {
    specRows.push({ label: "Warranty", value: warrantyStatus });
  }
  if (attrs.warranty_note != null && String(attrs.warranty_note).trim()) {
    specRows.push({ label: "Warranty details", value: String(attrs.warranty_note).trim() });
  }
  if (attrs.warranty_months != null && String(attrs.warranty_months).trim()) {
    specRows.push({
      label: "Warranty (legacy)",
      value: `${String(attrs.warranty_months)} months`,
    });
  }

  for (const [key, label] of [
    ["storage_gb", "Storage"],
    ["ram_gb", "RAM"],
    ["screen_size", "Screen"],
    ["power_kva", "Power (kVA)"],
    ["capacity_liters", "Capacity (L)"],
    ["battery_capacity_ah", "Battery (Ah)"],
  ] as const) {
    if (attrs[key] != null && String(attrs[key]).trim()) {
      specRows.push({ label, value: String(attrs[key]) });
    }
  }

  const location = [listing.area, listing.city, listing.state].filter(Boolean).join(", ");
  const wa = agent?.whatsapp || agent?.phone;
  const sellerName = agent?.company_name || agent?.full_name || "Seller";

  async function handleWhatsAppLead() {
    if (!agent?.id) return;
    setChatLoading(true);
    const href =
      typeof window !== "undefined" ? window.location.pathname : `/electronics/${listing.id}`;
    const result = await trackLeadAndRedirect({
      listingId: listing.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "detail",
      agentName: sellerName,
      title: listing.title,
      area: listing.area,
      city: listing.city,
      price: Number(listing.price),
      paymentPeriod: listing.payment_period || "total",
      listingType: listing.listing_type || "sale",
      propertyType: listing.auto_category,
      whatsapp: agent.whatsapp,
      phone: agent.phone,
    });
    setChatLoading(false);
    if (result.ok && result.redirectUrl) openWhatsAppLead(result);
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-navy/10 bg-white/95 px-3 py-2 backdrop-blur-md">
        <MarketplaceBackButton
          browseReturnParam={browseReturnParam}
          fallback="/electronics"
          variant="overlay"
          className="h-10 w-10 bg-navy/5 text-navy hover:bg-navy/10 backdrop-blur-none"
        />
        <span className="flex-1 truncate text-sm font-bold text-navy">Electronics</span>
        <ListingSaveButton listingId={listing.id} variant="inline" />
        <ShareButton url={shareUrl} title={listing.title} text={listing.title} />
      </div>

      {ownerBanner}

      <div className="relative aspect-[4/3] w-full bg-navy/5">
        <Image src={mainPhoto} alt="" fill className="object-cover" priority sizes="100vw" />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                i === activeIndex ? "border-gold" : "border-transparent",
              )}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
            {electronicsCategoryLabel(listing.auto_category)}
          </p>
          <h1 className="mt-1 text-2xl font-black text-navy">{listing.title}</h1>
          <p className="mt-2 text-2xl font-black text-navy">{formatPrice(Number(listing.price))}</p>
          {verified ? (
            <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-gold-dark">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Verified on Yike
            </p>
          ) : null}
          {location ? (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {location}
            </p>
          ) : null}
        </div>

        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <h2 className="text-sm font-black text-navy">Specifications</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {specRows.map((row) => (
              <div key={row.label} className="rounded-xl bg-surface/80 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{row.label}</dt>
                <dd className="text-sm font-semibold text-navy">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {listing.description ? (
          <section className="rounded-2xl border border-navy/10 bg-white p-4">
            <h2 className="text-sm font-black text-navy">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">
              {listing.description}
            </p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <h2 className="text-sm font-black text-navy">Seller</h2>
          <p className="mt-1 text-sm font-semibold text-navy">
            {agent?.company_name || agent?.full_name || "Seller"}
          </p>
          {nativeContactEnabled() && agent?.id ? (
            <div className="mt-3">
              <ListingInquiryActions
                listingId={listing.id}
                assetType="ELECTRONICS"
                sellerId={agent.id}
                sellerName={agent?.company_name || agent?.full_name || "Seller"}
              />
            </div>
          ) : wa ? (
            <button
              type="button"
              disabled={chatLoading}
              className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-black text-white disabled:opacity-70"
              onClick={() => guardAction({ type: "whatsapp" }, () => void handleWhatsAppLead())}
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {chatLoading ? "Opening…" : "Chat on WhatsApp"}
            </button>
          ) : (
            <p className="mt-2 text-xs text-muted">Contact details available after verification.</p>
          )}
        </section>

        <ReportListingForm propertyId={listing.id} />

        {similar.length > 0 ? (
          <section>
            <h2 className="text-sm font-black text-navy">Similar electronics</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {similar.map((item) => (
                <ElectronicsCard key={item.id} listing={item} variant="compact" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
