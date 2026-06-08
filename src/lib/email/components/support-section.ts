import { COMPANY_EMAIL } from "@/lib/constants";
import { emailTokens as t } from "./tokens";

export function buildSupportSection(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-support" style="margin:28px 0 0;">
      <tr>
        <td style="padding:18px 0 0;border-top:1px solid ${t.border};font-family:${t.fontFamily};text-align:center;">
          <p class="email-text" style="margin:0 0 6px;font-size:15px;font-weight:600;color:${t.textBody};">Need help?</p>
          <p class="email-secondary" style="margin:0;font-size:15px;line-height:1.5;color:${t.textSecondary};">
            <a href="mailto:${COMPANY_EMAIL}" class="email-link" style="color:${t.navy};font-weight:600;text-decoration:underline;">${COMPANY_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
