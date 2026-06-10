"use client";

import { MessageCircle } from "lucide-react";
import { useDesktopWeb } from "@/hooks/use-desktop-web";
import {
  YIKE_SUPPORT_PHONE_DISPLAY,
  YIKE_SUPPORT_WHATSAPP,
} from "@/lib/constants";

const ADMIN_WHATSAPP_URL = `https://wa.me/${YIKE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(
  "Hello Yike admin, I need help."
)}`;

export function DesktopWhatsappAdminButton() {
  const desktopWeb = useDesktopWeb();

  if (!desktopWeb) return null;

  return (
    <a
      href={ADMIN_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full border border-white/30 bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(3,27,78,0.24)] transition-transform hover:-translate-y-0.5 lg:flex"
      aria-label="Chat with Yike admin on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span>Admin WhatsApp</span>
      <span className="sr-only">{YIKE_SUPPORT_PHONE_DISPLAY}</span>
    </a>
  );
}
