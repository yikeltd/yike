"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  openWhatsAppLead,
  trackLeadAndRedirect,
  type TrackLeadResult,
} from "@/lib/leads/client";
import type { ContactPlacement } from "@/lib/contact-tracking";
import { useAuth } from "@/components/auth/auth-provider";
import {
  CallConfirmSheet,
  CallWhatsAppFallbackSheet,
} from "./call-routing-sheets";
import { recentContactNotice } from "@/lib/recently-contacted";
import type { PaymentPeriod, ListingType } from "@/types/database";

interface ContactButtonsProps {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  listingType: ListingType;
  propertyType?: string | null;
  bedrooms?: number;
  agentId: string;
  agentName: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  phone?: string | null;
  whatsapp?: string | null;
  layout?: "card" | "detail";
  placement?: ContactPlacement;
}

export function ContactButtons({
  propertyId,
  title,
  area,
  city,
  listingType,
  propertyType,
  bedrooms,
  agentId,
  agentName,
  price,
  paymentPeriod,
  phone,
  whatsapp,
  layout = "detail",
  placement = "detail",
}: ContactButtonsProps) {
  const { guardAction } = useAuth();
  const [loading, setLoading] = useState<"whatsapp" | "call" | null>(null);
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null);
  const [listingNotice, setListingNotice] = useState<string | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [callResult, setCallResult] = useState<TrackLeadResult | null>(null);

  useEffect(() => {
    const notice = recentContactNotice(propertyId);
    if (notice) setListingNotice(notice);
  }, [propertyId]);

  const sourcePage =
    typeof window !== "undefined" ? window.location.pathname : `/properties/${propertyId}`;

  async function runLead(leadType: "whatsapp" | "call") {
    setLoading(leadType);
    const result = await trackLeadAndRedirect({
      listingId: propertyId,
      agentId,
      leadType,
      sourcePage,
      placement,
      agentName,
      title,
      area,
      city,
      price,
      paymentPeriod,
      listingType,
      bedrooms,
      propertyType,
      whatsapp,
      phone,
    });
    setLoading(null);

    if (result.cooldown) {
      setCooldownMsg(result.error ?? null);
      return result;
    }

    if (result.listingNotice) {
      setListingNotice(result.listingNotice);
    }

    if (leadType === "whatsapp" && result.ok && result.redirectUrl) {
      openWhatsAppLead(result);
      return result;
    }

    if (leadType === "call" && result.ok) {
      setCallResult(result);
      if (result.callAllowed && result.redirectUrl) {
        setConfirmOpen(true);
      } else if (result.redirectUrl) {
        setFallbackOpen(true);
      }
      return result;
    }

    return result;
  }

  function onWhatsAppClick(e: React.MouseEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "whatsapp",
        listingId: propertyId,
        redirectPath: `/properties/${propertyId}`,
      },
      () => void runLead("whatsapp")
    );
  }

  function onCallClick(e: React.MouseEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "call",
        listingId: propertyId,
        redirectPath: `/properties/${propertyId}`,
      },
      () => void runLead("call")
    );
  }

  function handleFallbackWhatsApp() {
    if (!callResult) return;
    openWhatsAppLead(callResult);
    setFallbackOpen(false);
  }

  function handleConfirmCall() {
    if (!callResult?.redirectUrl) return;
    void fetch("/api/leads/call-opened", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yikeReference: callResult.yikeReference }),
    }).catch(() => undefined);
    window.location.href = callResult.redirectUrl;
    setConfirmOpen(false);
  }

  function handleConfirmWhatsApp() {
    if (!callResult) return;
    openWhatsAppLead(callResult);
    setConfirmOpen(false);
  }

  return (
    <>
      {cooldownMsg && (
        <p className="mb-2 rounded-lg border border-navy/10 bg-surface px-3 py-2 text-xs leading-snug text-navy">
          {cooldownMsg}
        </p>
      )}
      {listingNotice && !cooldownMsg && (
        <p className="mb-2 text-[11px] font-medium leading-snug text-muted">
          {listingNotice}
        </p>
      )}
      <div
        className={cn(
          "flex gap-2",
          layout === "detail" && "grid grid-cols-[1fr_auto]"
        )}
      >
        <button
          type="button"
          onClick={onWhatsAppClick}
          disabled={loading === "whatsapp"}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-navy shadow-glow-gold disabled:opacity-70"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          {loading === "whatsapp" ? "Opening…" : "Chat on WhatsApp"}
        </button>
        <button
          type="button"
          onClick={onCallClick}
          disabled={loading === "call"}
          className="pressable flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface text-navy disabled:opacity-70"
          aria-label="Call agent"
        >
          <Phone className="h-5 w-5" />
        </button>
      </div>
      <CallWhatsAppFallbackSheet
        open={fallbackOpen}
        onClose={() => setFallbackOpen(false)}
        onContinueWhatsApp={handleFallbackWhatsApp}
        loading={loading === "whatsapp"}
      />
      <CallConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onCallNow={handleConfirmCall}
        onContinueWhatsApp={handleConfirmWhatsApp}
        propertyTitle={title}
        agentName={agentName}
        loading={loading === "whatsapp"}
      />
    </>
  );
}
