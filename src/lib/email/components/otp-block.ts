import { emailTokens as t } from "./tokens";

/** Premium bank-app style OTP display with spaced digits. */
export function buildOtpBlock(code: string): string {
  const digits = code.replace(/\s/g, "").split("");
  const digitCells = digits
    .map(
      (digit) => `
      <td align="center" style="padding:0 4px;">
        <span class="email-otp-digit" style="display:inline-block;min-width:40px;padding:12px 8px;font-family:${t.fontMono};font-size:32px;font-weight:700;line-height:1;color:${t.navy};letter-spacing:0;text-align:center;">${digit}</span>
      </td>
    `
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-otp-shell" style="margin:8px 0 24px;background:${t.surfaceRaised};border:1px solid ${t.border};border-radius:14px;">
      <tr>
        <td align="center" style="padding:28px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>${digitCells}</tr>
          </table>
          <p class="email-muted" style="margin:16px 0 0;font-family:${t.fontFamily};font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.textSecondary};">
            Your secure code
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
