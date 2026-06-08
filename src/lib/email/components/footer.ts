import {
  COMPANY_DISPLAY_NAME,
  COMPANY_EMAIL,
  COMPANY_RC,
  SITE_NAME,
  SITE_URL,
} from "@/lib/constants";
import { buildAppDownloadRow } from "./app-download";
import { buildSocialLinksWithLabel } from "./social-links";
import { emailTokens as t } from "./tokens";

/** Dark navy fintech footer — social, app download, trust copy, legal. */
export function buildEmailFooter(): string {
  const year = new Date().getFullYear();

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td class="email-footer email-footer-dark" bgcolor="${t.navyDark}" style="background-color:${t.navyDark};background-image:linear-gradient(180deg, ${t.navyDark} 0%, #010d1f 100%);padding:32px 28px 28px;border-top:1px solid rgba(228,181,71,0.15);font-family:${t.fontFamily};text-align:center;color:#94a3b8;">
          <div>${buildSocialLinksWithLabel({ variant: "dark", iconSize: 28 })}</div>

          <p class="email-footer-label" style="margin:22px 0 0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${t.gold};">
            Get the app
          </p>
          ${buildAppDownloadRow()}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
            <tr>
              <td style="border-top:1px solid rgba(255,255,255,0.1);font-size:0;line-height:0;height:1px;">&nbsp;</td>
            </tr>
          </table>

          <p class="email-footer-legal" style="margin:16px 0 0;font-size:11px;line-height:1.65;color:#94a3b8;">
            &copy; ${year} ${SITE_NAME}. All rights reserved.<br />
            ${COMPANY_DISPLAY_NAME} &middot; ${COMPANY_RC}
          </p>

          <p class="email-footer-links" style="margin:10px 0 0;font-size:11px;line-height:1.6;color:${t.gold};">
            <a href="${SITE_URL}/privacy" class="email-link" style="color:${t.gold};text-decoration:underline;">Privacy</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}/terms" class="email-link" style="color:${t.gold};text-decoration:underline;">Terms</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:${COMPANY_EMAIL}" class="email-link" style="color:${t.gold};text-decoration:underline;">${COMPANY_EMAIL}</a>
          </p>

          <p class="email-footer-note" style="margin:10px 0 0;font-size:10px;line-height:1.5;color:#64748b;">
            You received this because you have a ${SITE_NAME} account or requested a notification.
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
