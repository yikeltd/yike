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
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Your listing <strong>${title}</strong> in ${city} was submitted successfully and is pending
        review. Most listings go live within a few hours.
      </p>
    `,
    cta: { label: "Manage my listings", href: `${SITE_URL}/agent/listings` },
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
    headline: "Listing approved",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        <strong>${title}</strong> is now live on Yike. Renters and buyers can browse, save, and
        contact you on WhatsApp.
      </p>
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
    headline: "Listing not approved",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        We couldn&apos;t approve <strong>${title}</strong> yet.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.55;color:#334155;">
            <strong style="color:#031B4E;">Reason:</strong> ${reason}
          </td>
        </tr>
      </table>
    `,
    cta: { label: "Edit listing", href: `${SITE_URL}/agent/listings` },
  });
}
