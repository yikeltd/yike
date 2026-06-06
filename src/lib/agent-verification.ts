import { YIKE_SUPPORT_WHATSAPP } from "@/lib/constants";
import type { AgentVerification, VerificationCallStatus } from "@/types/database";
import { whatsAppDeepLink } from "@/lib/whatsapp";

export const VERIFICATION_CALL_METHOD = "whatsapp" as const;
export const VERIFICATION_WHATSAPP_NUMBER = YIKE_SUPPORT_WHATSAPP;

export const AGENT_VERIFICATION_CALL_MESSAGE =
  "Your verification call will happen on WhatsApp. Please be available on your registered WhatsApp number at the scheduled time.";

export function verificationCallStatusLabel(status?: VerificationCallStatus | null): string {
  switch (status) {
    case "scheduled":
      return "WhatsApp call scheduled";
    case "completed":
      return "WhatsApp call completed";
    case "missed":
      return "WhatsApp call missed";
    case "failed":
      return "WhatsApp call failed";
    default:
      return "Not scheduled";
  }
}

export function formatVerificationCallTime(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function yikeVerificationWhatsAppLink(message?: string): string {
  const defaultMsg =
    "Hi Yike, I submitted my agent verification and I'm ready for my WhatsApp verification call.";
  return whatsAppDeepLink(VERIFICATION_WHATSAPP_NUMBER, message ?? defaultMsg);
}

export function agentVerificationCallInstructions(
  verification?: Pick<
    AgentVerification,
    "verification_call_status" | "verification_call_time" | "verification_whatsapp_number"
  > | null
): { title: string; body: string; showWhatsAppLink: boolean } {
  const status = verification?.verification_call_status ?? "not_scheduled";
  const when = formatVerificationCallTime(verification?.verification_call_time);
  const number = verification?.verification_whatsapp_number ?? VERIFICATION_WHATSAPP_NUMBER;

  if (status === "scheduled" && when) {
    return {
      title: "WhatsApp verification call scheduled",
      body: `${AGENT_VERIFICATION_CALL_MESSAGE} Scheduled for ${when}. Yike will call you from WhatsApp (+${number}).`,
      showWhatsAppLink: true,
    };
  }

  if (status === "completed") {
    return {
      title: "Verification call completed",
      body: "Your WhatsApp verification call is done. We're completing the final review — you'll hear from us soon.",
      showWhatsAppLink: false,
    };
  }

  if (status === "missed") {
    return {
      title: "Missed verification call",
      body: `We couldn't reach you on WhatsApp at the scheduled time. Message Yike on +${number} to reschedule.`,
      showWhatsAppLink: true,
    };
  }

  if (status === "failed") {
    return {
      title: "Verification call issue",
      body: `There was a problem with the WhatsApp call. Contact Yike on +${number} or wait for our team to follow up.`,
      showWhatsAppLink: true,
    };
  }

  return {
    title: "Under review",
    body: `${AGENT_VERIFICATION_CALL_MESSAGE} Our team will schedule a short WhatsApp video call after reviewing your documents.`,
    showWhatsAppLink: false,
  };
}
