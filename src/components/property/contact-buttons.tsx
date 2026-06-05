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

interface ContactButtonsProps {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  listingType: string;
  propertyType?: string | null;
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
  agentId,
  phone,
  whatsapp,
  layout = "detail",
  placement = "detail",
}: ContactButtonsProps) {
  const wa = whatsapp || phone;
  const tel = phone || whatsapp;

  function onWhatsAppClick() {
    void trackContactClick({
      propertyId,
      channel: "whatsapp",
      city,
      listingType,
      propertyType,
      placement,
      agentId,
    });
  }

  function onCallClick() {
    void trackContactClick({
      propertyId,
      channel: "call",
      city,
      listingType,
      propertyType,
      placement,
      agentId,
    });
  }

  if (!wa && !tel) return null;

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "detail" && "grid grid-cols-[1fr_auto]"
      )}
      onClick={(e) => e.preventDefault()}
    >
      {wa && (
        <a
          href={whatsAppDeepLink(
            wa,
            propertyWhatsAppMessage(title, area, city, propertyId)
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsAppClick}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-navy shadow-glow-gold"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          Chat on WhatsApp
        </a>
      )}
      {tel && (
        <a
          href={`tel:${formatPhoneForTel(tel)}`}
          onClick={onCallClick}
          className="pressable flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface text-navy"
          aria-label="Call agent"
        >
          <Phone className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
