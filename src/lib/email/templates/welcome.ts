import { emailGreeting, emailParagraph } from "@/lib/email/components";
import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildWelcomeEmailHtml(params: { fullName: string }): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Your email is verified — start browsing real homes on Yike.",
    headline: "Welcome to Yike",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        "Your email is verified. Explore real listings, save favourites, and contact verified agents on WhatsApp."
      )}
    `,
    cta: { label: "Explore listings", href: SITE_URL },
  });
}
