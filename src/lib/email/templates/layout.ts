import {
  buildCtaButton,
  buildDarkModeStyles,
  buildEmailFooter,
  buildEmailHeader,
  buildFallbackLink,
  buildSupportSection,
  emailTokens as t,
} from "@/lib/email/components";

export type EmailLayoutParams = {
  /** Shown in inbox preview (hidden in body). */
  preheader?: string;
  /** Main headline below the header. */
  headline: string;
  /** Inner HTML for the message body (already safe or escaped). */
  bodyHtml: string;
  /** Optional primary CTA. */
  cta?: { label: string; href: string };
  /** Optional secondary plain link below CTA. */
  fallbackLink?: { label: string; href: string };
  /** Center the headline (verification + welcome emails). */
  headlineAlign?: "left" | "center";
  /** Show support contact block above footer. */
  showSupport?: boolean;
};

/** Branded Yike transactional email shell — premium, mobile-first, dark-mode aware. */
export function buildEmailLayout(params: EmailLayoutParams): string {
  const preheader = params.preheader ?? "";
  const headlineAlign = params.headlineAlign ?? "left";
  const showSupport = params.showSupport ?? true;

  const ctaBlock = params.cta
    ? buildCtaButton({
        label: params.cta.label,
        href: params.cta.href,
        align: headlineAlign,
      })
    : "";

  const fallbackBlock = params.fallbackLink
    ? buildFallbackLink({
        label: params.fallbackLink.label,
        href: params.fallbackLink.href,
        align: headlineAlign,
      })
    : "";

  const supportBlock = showSupport ? buildSupportSection() : "";

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${params.headline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    ${buildDarkModeStyles()}
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background:${t.surface};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background:${t.surface};padding:20px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-shell" width="${t.maxWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${t.maxWidth}px;width:100%;background:${t.white};border-radius:16px;overflow:hidden;border:1px solid ${t.border};">

          <tr>
            <td class="email-header-cell">
              ${buildEmailHeader()}
            </td>
          </tr>

          <tr>
            <td class="email-body-pad" style="padding:0 28px 32px;font-family:${t.fontFamily};">
              <h1 class="email-headline" style="margin:0 0 20px;font-size:26px;font-weight:800;color:${t.navy};letter-spacing:-0.5px;line-height:1.2;text-align:${headlineAlign};">
                ${params.headline}
              </h1>
              <div class="email-content" style="font-size:17px;line-height:1.65;color:${t.textBody};">
                ${params.bodyHtml}
              </div>
              ${ctaBlock}
              ${fallbackBlock}
              ${supportBlock}
            </td>
          </tr>

          <tr>
            <td>
              ${buildEmailFooter()}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
