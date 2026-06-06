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
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Your email is verified. You&apos;re all set to explore real listings across Nigeria —
        swipe homes like a feed, save favourites, and contact verified agents on WhatsApp.
      </p>
    `,
    cta: { label: "Explore listings", href: SITE_URL },
  });
}
