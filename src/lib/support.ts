import { YIKE_SUPPORT_WHATSAPP } from "@/lib/constants";
import { yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { whatsAppDeepLink } from "@/lib/whatsapp";

export const YIKE_SUPPORT_DEFAULT_MESSAGE = "Hi Yike, I need support.";

/** Official Yike support WhatsApp (env override → gateway config → default). */
export function getYikeSupportWhatsAppNumber(): string {
  return (
    process.env.NEXT_PUBLIC_YIKE_SUPPORT_WHATSAPP?.trim() ||
    process.env.YIKE_SUPPORT_WHATSAPP?.trim() ||
    yikeWhatsAppNumber() ||
    YIKE_SUPPORT_WHATSAPP
  );
}

export function getYikeSupportWhatsAppUrl(
  message: string = YIKE_SUPPORT_DEFAULT_MESSAGE
): string {
  return whatsAppDeepLink(getYikeSupportWhatsAppNumber(), message);
}

/** Open support chat — native WhatsApp on mobile/TWA when available. */
export function openYikeSupportWhatsApp(
  message: string = YIKE_SUPPORT_DEFAULT_MESSAGE,
  options?: { preferSameTab?: boolean }
): void {
  const url = getYikeSupportWhatsAppUrl(message);
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (options?.preferSameTab || mobile) {
    window.location.assign(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
