"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackLeadAndRedirect } from "@/lib/leads/client";
import type { ContactPlacement } from "@/lib/contact-tracking";
import { useAuth } from "@/components/auth/auth-provider";
import {
  CallSafetyModal,
  hasSeenContactSafety,
  markContactSafetySeen,
} from "./contact-safety-modal";
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
  showSafetyHint?: boolean;
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
  showSafetyHint = true,
}: ContactButtonsProps) {
  const { guardAction } = useAuth();
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [loading, setLoading] = useState<"whatsapp" | "call" | null>(null);
  const [showHint, setShowHint] = useState(
    showSafetyHint && !hasSeenContactSafety()
  );

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

    if (result.ok && result.redirectUrl) {
      markContactSafetySeen();
      setShowHint(false);
      if (leadType === "whatsapp") {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = result.redirectUrl;
      }
      return;
    }
  }

  function onWhatsAppClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!whatsapp && !phone) return;
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
    if (!phone && !whatsapp) return;
    guardAction(
      {
        type: "call",
        listingId: propertyId,
        redirectPath: `/properties/${propertyId}`,
      },
      () => setCallModalOpen(true)
    );
  }

  function confirmCall() {
    setCallModalOpen(false);
    void runLead("call");
  }

  if (!phone && !whatsapp) return null;

  return (
    <>
      {showHint && (
        <p className="mb-2 text-[11px] font-medium leading-snug text-amber-800 dark:text-amber-200">
          Never pay inspection fees before seeing the property.
        </p>
      )}
      <div
        className={cn(
          "flex gap-2",
          layout === "detail" && "grid grid-cols-[1fr_auto]"
        )}
      >
        {(whatsapp || phone) && (
          <button
            type="button"
            onClick={onWhatsAppClick}
            disabled={loading === "whatsapp"}
            className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-navy shadow-glow-gold disabled:opacity-70"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            {loading === "whatsapp" ? "Opening…" : "Chat on WhatsApp"}
          </button>
        )}
        {(phone || whatsapp) && (
          <button
            type="button"
            onClick={onCallClick}
            disabled={loading === "call"}
            className="pressable flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface text-navy disabled:opacity-70"
            aria-label="Call agent"
          >
            <Phone className="h-5 w-5" />
          </button>
        )}
      </div>
      <CallSafetyModal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        onConfirm={confirmCall}
      />
    </>
  );
}
