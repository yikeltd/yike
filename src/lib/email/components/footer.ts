import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { buildSocialLinks } from "./social-links";
import { emailTokens as t } from "./tokens";

export function buildEmailFooter(): string {
  const year = new Date().getFullYear();

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td class="email-footer" style="padding:24px 28px 32px;border-top:1px solid ${t.border};font-family:${t.fontFamily};text-align:center;background:${t.surfaceRaised};">
          <div style="margin-bottom:16px;">${buildSocialLinks()}</div>

          <p class="email-muted" style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${t.muted};">
            <a href="mailto:hello@yike.ng" class="email-link" style="color:${t.textSecondary};text-decoration:underline;">hello@yike.ng</a>
          </p>

          <p class="email-muted" style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${t.muted};">
            <a href="${SITE_URL}/privacy" class="email-link" style="color:${t.muted};text-decoration:underline;">Privacy</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}/terms" class="email-link" style="color:${t.muted};text-decoration:underline;">Terms</a>
          </p>

          <p class="email-muted" style="margin:0;font-size:12px;line-height:1.5;color:${t.muted};">
            &copy; ${year} ${SITE_NAME}
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
