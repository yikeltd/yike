import { emailTokens as t } from "./tokens";

export function buildInfoCard(params: {
  label?: string;
  content: string;
}): string {
  const label = params.label
    ? `<strong class="email-text" style="display:block;margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${t.navy};">${params.label}</strong>`
    : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-card" style="margin:4px 0 20px;background:${t.surfaceRaised};border-radius:12px;border:1px solid ${t.border};border-left:3px solid ${t.gold};">
      <tr>
        <td style="padding:18px 20px;font-family:${t.fontFamily};font-size:16px;line-height:1.6;color:${t.textBody};">
          ${label}
          <span class="email-text">${params.content}</span>
        </td>
      </tr>
    </table>
  `.trim();
}
