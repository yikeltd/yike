import { COMPANY_EMAIL } from "@/lib/constants";
import { emailTokens as t } from "./tokens";

export function buildSupportSection(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-support" style="margin:32px 0 0;">
      <tr>
        <td align="center" style="padding:20px 0 0;border-top:1px solid ${t.border};font-family:${t.fontFamily};">
          <p class="email-muted" style="margin:0;font-size:13px;line-height:1.5;color:${t.muted};">
            Questions?&nbsp;
            <a href="mailto:${COMPANY_EMAIL}" class="email-link" style="color:${t.navy};font-weight:600;text-decoration:underline;">${COMPANY_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
