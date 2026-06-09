import { SITE_URL } from "@/lib/constants";
import type { AdPlacement } from "@/types/database";
import { escapeHtml } from "../templates/utils";
import { emailTokens as t } from "./tokens";

export type EmailAdInput = Pick<
  AdPlacement,
  "title" | "image_url" | "link_url" | "alt_text"
>;

/** Compact in-fold promo chip — sits under headline, ~52px tall. */
export function buildEmailAdBlock(ad: EmailAdInput): string {
  const imageUrl = ad.image_url?.trim();
  if (!imageUrl) return "";

  const title = ad.title?.trim() || ad.alt_text?.trim() || "Learn more on Yike";
  const linkUrl = ad.link_url?.trim() || SITE_URL;
  const alt = escapeHtml(ad.alt_text?.trim() || title);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-ad" style="margin:0 0 18px;background:${t.surfaceRaised};border:1px solid ${t.border};border-radius:12px;">
      <tr>
        <td style="padding:0;font-family:${t.fontFamily};">
          <a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="52" valign="middle" style="padding:8px 0 8px 10px;">
                  <img src="${escapeHtml(imageUrl)}" width="40" height="40" alt="${alt}" style="display:block;width:40px;height:40px;border:0;border-radius:10px;object-fit:cover;" />
                </td>
                <td valign="middle" style="padding:8px 10px 8px 8px;">
                  <p class="email-muted" style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${t.muted};line-height:1.2;">
                    Sponsored
                  </p>
                  <p class="email-text" style="margin:0;font-size:13px;font-weight:700;line-height:1.35;color:${t.navy};">
                    ${escapeHtml(title)}
                  </p>
                </td>
                <td width="28" valign="middle" align="right" style="padding:8px 12px 8px 0;font-size:18px;font-weight:700;color:${t.gold};line-height:1;">
                  &rsaquo;
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

/** Preview sample when no live ad is configured in /lex/auth/ads. */
export function buildSampleEmailAdHtml(): string {
  return buildEmailAdBlock({
    title: "List your property free",
    image_url: `${SITE_URL}/images/logo.webp`,
    link_url: `${SITE_URL}/list-property`,
    alt_text: "List on Yike",
  });
}
