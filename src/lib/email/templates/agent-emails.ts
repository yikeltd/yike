import {
  buildInfoCard,
  emailGreeting,
  emailParagraph,
  emailSecondary,
} from "@/lib/email/components";
import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildAgentVerificationSubmittedEmailHtml(params: {
  fullName: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Your agent verification application is under review.",
    headline: "Application received",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        "Thanks for applying to become a verified agent on Yike. Our team will review your documents within 1–2 business days."
      )}
      ${emailSecondary("We&apos;ll email you when approved or if we need anything else.")}
    `,
    cta: { label: "View status", href: `${SITE_URL}/agent/verification` },
  });
}

export function buildAgentVerificationApprovedEmailHtml(params: {
  fullName: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "You're now a verified agent on Yike.",
    headline: "You're verified",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        "Your agent verification was approved. Your verified badge is live and you can post listings on Yike."
      )}
    `,
    cta: { label: "Post a listing", href: `${SITE_URL}/agent/listings/new` },
  });
}

export function buildAgentVerificationRejectedEmailHtml(params: {
  fullName: string;
  reason?: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const reason = escapeHtml(
    params.reason?.trim() || "Your documents did not meet our verification requirements."
  );

  return buildEmailLayout({
    preheader: "Update on your Yike agent verification application.",
    headline: "Application not approved",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph("We reviewed your agent verification but couldn&apos;t approve it this time.")}
      ${buildInfoCard({ label: "Reason", content: reason })}
      ${emailSecondary("Correct your details and resubmit from your verification page.")}
    `,
    cta: { label: "Resubmit verification", href: `${SITE_URL}/agent/verification` },
  });
}
