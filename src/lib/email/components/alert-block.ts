import { emailTokens as t } from "./tokens";

export type AlertTone = "info" | "warning" | "success";

const TONE_STYLES: Record<AlertTone, { bg: string; border: string; accent: string }> = {
  info: { bg: "#eff6ff", border: "#bfdbfe", accent: t.navy },
  warning: { bg: "#fffbeb", border: "#fde68a", accent: t.warning },
  success: { bg: "#ecfdf5", border: "#a7f3d0", accent: t.success },
};

/** Trust / security callout — subtle, not alarmist. */
export function buildAlertBlock(params: {
  title: string;
  body: string;
  tone?: AlertTone;
}): string {
  const tone = params.tone ?? "info";
  const style = TONE_STYLES[tone];

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-alert" style="margin:20px 0;background:${style.bg};border-radius:12px;border:1px solid ${style.border};">
      <tr>
        <td style="padding:16px 18px;font-family:${t.fontFamily};">
          <p class="email-text" style="margin:0 0 4px;font-size:14px;font-weight:700;color:${style.accent};">${params.title}</p>
          <p class="email-secondary" style="margin:0;font-size:14px;line-height:1.55;color:${t.textSecondary};">${params.body}</p>
        </td>
      </tr>
    </table>
  `.trim();
}
