import { emailSecondary, emailGreeting, emailParagraph } from "@/lib/email/components";
import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildCareerApplicationReceivedEmailHtml(params: {
  fullName: string;
  jobTitle: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const role = escapeHtml(params.jobTitle);

  return buildEmailLayout({
    preheader: "We received your application — our team will review it soon.",
    headline: "Application received",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        `Thanks for applying to <strong>${role}</strong> at Yike. Our team will review your application and contact you if shortlisted.`
      )}
      ${emailSecondary("Keep an eye on your inbox — we move fast when we find a great fit.")}
    `,
    cta: { label: "Explore Yike", href: SITE_URL },
  });
}
