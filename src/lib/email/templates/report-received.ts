import { emailDisclaimer, emailGreeting, emailParagraph } from "@/lib/email/components";
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
      ${emailGreeting(name)}
      ${emailParagraph(
        `Thanks for reporting <strong>${title}</strong>. Our moderation team will review it and take action if needed.`
      )}
      ${emailDisclaimer("We may not reply to every report, but serious issues are prioritised.")}
    `,
    cta: { label: "Browse listings", href: SITE_URL },
  });
}
