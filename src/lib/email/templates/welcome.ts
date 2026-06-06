import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildWelcomeEmailHtml(params: { fullName: string }): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Your email is verified — start browsing real homes on Yike.",
    headline: "Welcome to Yike",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Your email is verified. You&apos;re all set to explore real listings across Nigeria —
        swipe homes like a feed, save favourites, and contact verified agents on WhatsApp.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 0;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.55;color:#334155;">
            <strong style="color:#031B4E;">Stay safe:</strong> Never pay inspection fees before viewing.
            Meet at the property, verify documents, and keep payments on your terms.
          </td>
        </tr>
      </table>
    `,
    cta: { label: "Explore listings", href: SITE_URL },
  });
}
