import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { EMAIL_LOGO_PATH, emailTokens as t } from "./tokens";

/** Fintech-style navy gradient header — centered logo, gold accent bar. */
export function buildEmailHeader(): string {
  const logoUrl = `${SITE_URL}${EMAIL_LOGO_PATH}`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td class="email-header" style="background:linear-gradient(145deg, ${t.navy} 0%, ${t.navyDark} 100%);padding:32px 28px 28px;font-family:${t.fontFamily};text-align:center;">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
            <img src="${logoUrl}" width="56" height="56" alt="${SITE_NAME}" class="email-logo" style="display:block;margin:0 auto;border:0;border-radius:14px;" />
          </a>
          <p class="email-tagline" style="margin:16px 0 0;font-size:14px;font-weight:700;line-height:1.5;color:${t.gold};max-width:340px;margin-left:auto;margin-right:auto;">
            ${SITE_TAGLINE}
          </p>
          <table role="presentation" width="52" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0;">
            <tr>
              <td style="height:3px;background:${t.gold};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim();
}
