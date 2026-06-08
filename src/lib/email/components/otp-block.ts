import { emailTokens as t } from "./tokens";

/** Display OTP as one string — never per-digit boxes (avoids copy-one-by-one confusion). */
export function formatOtpForDisplay(code: string): string {
  const clean = code.replace(/\s/g, "");
  return clean;
}

/** Fintech-grade OTP — single selectable code, one clear copy action. */
export function buildOtpBlock(code: string): string {
  const display = formatOtpForDisplay(code);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-otp-shell" style="margin:4px 0 28px;border-radius:16px;overflow:hidden;border:1px solid ${t.border};background:${t.white};">
      <tr>
        <td style="height:4px;background:linear-gradient(90deg, ${t.gold} 0%, ${t.goldDark} 100%);font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td align="center" style="padding:28px 24px 24px;font-family:${t.fontFamily};">
          <p class="email-muted" style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${t.textSecondary};">
            Verification code
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-otp-field" style="background:${t.surfaceRaised};border:1px solid ${t.border};border-radius:14px;">
            <tr>
              <td align="center" style="padding:22px 20px;">
                <p class="email-otp-code" style="margin:0;font-family:${t.fontMono};font-size:40px;font-weight:700;line-height:1.1;color:${t.navy};letter-spacing:0.06em;word-break:keep-all;white-space:nowrap;">
                  ${display}
                </p>
              </td>
            </tr>
          </table>

          <p class="email-secondary" style="margin:14px 0 0;font-size:14px;line-height:1.5;color:${t.textSecondary};">
            Select and copy the full code above
          </p>
          <p class="email-muted" style="margin:6px 0 0;font-size:13px;line-height:1.45;color:${t.muted};">
            Expires in 10 minutes
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}
