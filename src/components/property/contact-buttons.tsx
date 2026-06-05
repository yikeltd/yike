"use client";

import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  propertyWhatsAppMessage,
  whatsAppDeepLink,
} from "@/lib/whatsapp";
import { formatPhoneForTel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ContactButtonsProps {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  phone?: string | null;
  whatsapp?: string | null;
  layout?: "card" | "detail";
}

export function ContactButtons({
  propertyId,
  title,
  area,
  city,
  phone,
  whatsapp,
  layout = "detail",
}: ContactButtonsProps) {
  const wa = whatsapp || phone;
  const tel = phone || whatsapp;

  async function trackClick() {
    const supabase = createClient();
    await supabase.rpc("increment_contact_clicks", {
      property_id: propertyId,
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
          onClick={trackClick}
          className="pressable flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-navy shadow-glow-gold"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          WhatsApp
        </a>
      )}
      {tel && (
        <a
          href={`tel:${formatPhoneForTel(tel)}`}
          onClick={trackClick}
          className="pressable flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface text-navy"
          aria-label="Call"
        >
          <Phone className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
