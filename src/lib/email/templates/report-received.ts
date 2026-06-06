import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildReportReceivedEmailHtml(params: {
  reporterName: string;
  listingTitle: string;
}): string {
  const name = escapeHtml(params.reporterName || "there");
  const title = escapeHtml(params.listingTitle);

  return buildEmailLayout({
    preheader: "We received your listing report on Yike.",
    headline: "Report received",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Thanks for reporting <strong>${title}</strong>. Our moderation team will review it and take
        action if the listing breaks our trust rules.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        We may not reply to every report, but serious issues are prioritised.
      </p>
    `,
    cta: { label: "Browse listings", href: SITE_URL },
  });
}
