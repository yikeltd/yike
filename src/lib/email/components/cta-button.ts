import { emailTokens as t } from "./tokens";

export type CtaButtonParams = {
  label: string;
  href: string;
  align?: "left" | "center";
};

export function buildCtaButton(params: CtaButtonParams): string {
  const align = params.align ?? "center";
  const margin = align === "center" ? "28px auto 0" : "28px 0 0";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:${margin};">
      <tr>
        <td align="center" class="email-cta" style="border-radius:10px;background:${t.gold};">
          <a href="${params.href}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:16px 32px;font-family:${t.fontFamily};font-size:16px;font-weight:700;color:${t.navy};text-decoration:none;border-radius:10px;mso-padding-alt:0;">
            ${params.label}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function buildFallbackLink(params: {
  label: string;
  href: string;
  align?: "left" | "center";
}): string {
  const align = params.align ?? "center";

  return `
    <p class="email-muted" style="margin:20px 0 0;font-family:${t.fontFamily};font-size:13px;line-height:1.6;color:${t.muted};word-break:break-all;text-align:${align};">
      ${params.label}<br />
      <a href="${params.href}" class="email-link" style="color:${t.goldDark};text-decoration:underline;">${params.href}</a>
    </p>
  `.trim();
}
