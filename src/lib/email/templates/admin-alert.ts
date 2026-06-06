import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildAdminAlertEmailHtml(params: {
  subject: string;
  body: string;
}): string {
  const body = escapeHtml(params.body).replace(/\n/g, "<br />");

  return buildEmailLayout({
    preheader: params.subject,
    headline: escapeHtml(params.subject),
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:14px;color:#64748b;">Internal admin notification from Yike.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:18px 20px;font-size:15px;line-height:1.6;color:#031B4E;">
            ${body}
          </td>
        </tr>
      </table>
    `,
  });
}
