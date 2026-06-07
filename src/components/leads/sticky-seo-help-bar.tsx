"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function StickySeoHelpBar({
  label,
  whatsAppUrl,
}: {
  label: string;
  whatsAppUrl: string;
}) {
  if (!whatsAppUrl) return null;

  return (
    <div className="fixed inset-x-0 bottom-[var(--bottom-nav-stack)] z-30 mx-auto max-w-lg px-3 lg:bottom-6">
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent("seo_whatsapp_help", { label: label.slice(0, 80) })
        }
        className="pressable flex items-center gap-3 rounded-2xl border border-gold/25 bg-white/95 px-4 py-3 shadow-float-lg backdrop-blur-sm"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
          <MessageCircle className="h-5 w-5 text-gold-dark" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-navy">{label}</span>
          <span className="block text-xs text-muted">
            Chat verified agents on WhatsApp
          </span>
        </span>
      </a>
    </div>
  );
}
