"use client";

import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  propertyWhatsAppMessage,
  whatsAppDeepLink,
} from "@/lib/whatsapp";
import { formatPhoneForTel } from "@/lib/utils";
import {
  trackContactClick,
  type ContactPlacement,
} from "@/lib/contact-tracking";
import { useAuth } from "@/components/auth/auth-provider";

interface ContactButtonsProps {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  listingType: string;
  propertyType?: string | null;
  bedrooms?: number;
  agentId?: string | null;
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
  phone,
  whatsapp,
  layout = "detail",
  placement = "detail",
}: ContactButtonsProps) {
  const { guardAction } = useAuth();
  const wa = whatsapp || phone;
  const tel = phone || whatsapp;

  const waUrl =
    wa &&
    whatsAppDeepLink(
      wa,
      propertyWhatsAppMessage(title, area, city, propertyId, {
        bedrooms,
        propertyType,
        listingType,
      })
    );
  const telUrl = tel ? `tel:${formatPhoneForTel(tel)}` : null;

  function onWhatsAppClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!waUrl) return;
    guardAction(
      {
        type: "whatsapp",
        listingId: propertyId,
        redirectPath: `/properties/${propertyId}`,
        contactUrl: waUrl,
      },
      () => {
        void trackContactClick({
          propertyId,
          channel: "whatsapp",
          city,
          area,
          listingType,
          propertyType,
          placement,
          agentId,
        });
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
    );
  }

  function onCallClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!telUrl) return;
    guardAction(
      {
        type: "call",
        listingId: propertyId,
        redirectPath: `/properties/${propertyId}`,
        contactUrl: telUrl,
      },
      () => {
        void trackContactClick({
          propertyId,
          channel: "call",
          city,
          area,
          listingType,
          propertyType,
          placement,
          agentId,
        });
        window.location.href = telUrl;
      }
    );
  }

  if (!wa && !tel) return null;

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "detail" && "grid grid-cols-[1fr_auto]"
      )}
    >
      {wa && (
        <button
          type="button"
          onClick={onWhatsAppClick}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-navy shadow-glow-gold"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          Chat on WhatsApp
        </button>
      )}
      {tel && (
        <button
          type="button"
          onClick={onCallClick}
          className="pressable flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface text-navy"
          aria-label="Call agent"
        >
          <Phone className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
