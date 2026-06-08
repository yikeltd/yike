import { emailTokens as t } from "./tokens";

export type AlertTone = "info" | "warning" | "success";

const TONE_ACCENT: Record<AlertTone, string> = {
  info: t.navy,
  warning: t.warning,
  success: t.success,
};

/** Trust callout — left accent bar, calm fintech tone. */
export function buildAlertBlock(params: {
  title: string;
  body: string;
  tone?: AlertTone;
}): string {
  const tone = params.tone ?? "info";
  const accent = TONE_ACCENT[tone];

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-alert" style="margin:24px 0 0;background:${t.surfaceRaised};border-radius:12px;border:1px solid ${t.border};">
      <tr>
        <td width="4" style="background:${accent};border-radius:12px 0 0 12px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:14px 16px;font-family:${t.fontFamily};">
          <p class="email-text" style="margin:0 0 4px;font-size:14px;font-weight:700;color:${t.navy};">${params.title}</p>
          <p class="email-secondary" style="margin:0;font-size:14px;line-height:1.55;color:${t.textSecondary};">${params.body}</p>
        </td>
      </tr>
    </table>
  `.trim();
}
