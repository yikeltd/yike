import {
  buildInfoCard,
  emailGreeting,
  emailParagraph,
  emailSecondary,
} from "@/lib/email/components";
import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildListingSubmittedEmailHtml(params: {
  fullName: string;
  listingTitle: string;
  city: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const title = escapeHtml(params.listingTitle);
  const city = escapeHtml(params.city);

  return buildEmailLayout({
    preheader: "Your listing is pending review on Yike.",
    headline: "Listing submitted",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        `Your listing <strong>${title}</strong> in ${city} was submitted and is now in review.`
      )}
      ${emailSecondary("Most listings go live within a few hours.")}
    `,
    cta: { label: "Manage listings", href: `${SITE_URL}/agent/listings` },
  });
}

export function buildListingApprovedEmailHtml(params: {
  fullName: string;
  listingTitle: string;
  listingUrl: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const title = escapeHtml(params.listingTitle);

  return buildEmailLayout({
    preheader: "Your Yike listing is now live.",
    headline: "Listing is live",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        `<strong>${title}</strong> is now live on Yike. Renters and buyers can browse, save, and reach you on WhatsApp.`
      )}
    `,
    cta: { label: "View listing", href: params.listingUrl },
  });
}

export function buildListingRejectedEmailHtml(params: {
  fullName: string;
  listingTitle: string;
  reason?: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const title = escapeHtml(params.listingTitle);
  const reason = escapeHtml(
    params.reason?.trim() ||
      "The listing did not meet our quality or trust guidelines. Check photos, pricing, and description."
  );

  return buildEmailLayout({
    preheader: "Your listing needs changes before it can go live.",
    headline: "Listing needs changes",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(`We couldn&apos;t approve <strong>${title}</strong> yet.`)}
      ${buildInfoCard({ label: "What to fix", content: reason })}
      ${emailSecondary("Update your listing and resubmit when ready.")}
    `,
    cta: { label: "Edit listing", href: `${SITE_URL}/agent/listings` },
  });
}
