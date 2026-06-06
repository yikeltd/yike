import { SITE_NAME, SITE_TAGLINE, SITE_URL, SOCIAL_LINKS } from "@/lib/constants";
import { brand } from "@/lib/design/tokens";

const NAVY = "#031B4E";
const NAVY_DARK = "#021428";
const GOLD = "#E4B547";
const GOLD_DARK = "#c99a2e";
const MUTED = "#64748b";
const SURFACE = "#f4f6f9";
const WHITE = "#ffffff";

const LOGO_URL = `${SITE_URL}${brand.logo}`;

type EmailSocialKey = Exclude<keyof typeof SOCIAL_LINKS, "linkedin">;

const SOCIAL_ORDER: EmailSocialKey[] = [
  "tiktok",
  "x",
  "youtube",
  "instagram",
  "facebook",
];

const SOCIAL_LABELS: Record<EmailSocialKey, string> = {
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
};

export type EmailLayoutParams = {
  /** Shown in inbox preview (hidden in body). */
  preheader?: string;
  /** Main headline below the header bar. */
  headline: string;
  /** Inner HTML for the message body (already safe or escaped). */
  bodyHtml: string;
  /** Optional primary CTA. */
  cta?: { label: string; href: string };
  /** Optional secondary plain link below CTA. */
  fallbackLink?: { label: string; href: string };
  /** Center the headline (verification + welcome emails). */
  headlineAlign?: "left" | "center";
};

function socialIconsRow(): string {
  const cells = SOCIAL_ORDER.map((key) => {
    const href = SOCIAL_LINKS[key];
    const label = SOCIAL_LABELS[key];
    const iconUrl = `${SITE_URL}/email/social/${key}.png`;
    return `
      <td align="center" style="padding:0 6px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" title="${label}" style="text-decoration:none;display:inline-block;">
          <img src="${iconUrl}" width="28" height="28" alt="${label}" style="display:block;border:0;border-radius:50%;" />
        </a>
      </td>
    `;
  }).join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>${cells}</tr>
    </table>
  `;
}

/** Branded Yike transactional email shell — table layout for client compatibility. */
export function buildEmailLayout(params: EmailLayoutParams): string {
  const preheader = params.preheader ?? "";
  const year = new Date().getFullYear();
  const headlineAlign = params.headlineAlign ?? "left";

  const ctaBlock = params.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${headlineAlign === "center" ? "center" : "left"}" style="margin:28px ${headlineAlign === "center" ? "auto" : "0"} 0;">
        <tr>
          <td align="center" style="border-radius:12px;background:${GOLD};">
            <a href="${params.cta.href}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:12px;">
              ${params.cta.label}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const fallbackBlock = params.fallbackLink
    ? `
      <p style="margin:20px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;text-align:${headlineAlign};">
        ${params.fallbackLink.label}<br />
        <a href="${params.fallbackLink.href}" style="color:${GOLD_DARK};text-decoration:underline;">${params.fallbackLink.href}</a>
      </p>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
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
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body-pad { padding: 24px 20px !important; }
      .email-footer-pad { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${SURFACE};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%);padding:28px 24px 24px;text-align:center;">
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <img src="${LOGO_URL}" width="56" height="56" alt="${SITE_NAME}" style="display:block;margin:0 auto;border:0;border-radius:12px;" />
              </a>
              <p style="margin:14px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;color:rgba(228,181,71,0.95);line-height:1.4;">
                ${SITE_TAGLINE}
              </p>
              <table role="presentation" width="48" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0;">
                <tr><td style="height:3px;background:${GOLD};border-radius:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body-pad" style="padding:32px 36px 8px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${NAVY};letter-spacing:-0.4px;line-height:1.25;text-align:${headlineAlign};">
                ${params.headline}
              </h1>
              <div style="font-size:16px;line-height:1.65;color:#334155;">
                ${params.bodyHtml}
              </div>
              ${ctaBlock}
              ${fallbackBlock}
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-pad" style="background:${NAVY_DARK};padding:32px 36px 28px;text-align:center;">
              <img src="${LOGO_URL}" width="40" height="40" alt="${SITE_NAME}" style="display:block;margin:0 auto;border:0;border-radius:10px;opacity:0.95;" />

              <p style="margin:16px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(228,181,71,0.9);">
                Follow ${SITE_NAME}
              </p>
              <div style="margin-top:12px;">${socialIconsRow()}</div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
                <tr><td style="border-top:1px solid rgba(255,255,255,0.12);font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>

              <p style="margin:16px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.45);">
                © ${year} ${SITE_NAME}. All rights reserved.<br />
                <a href="${SITE_URL}/privacy" style="color:rgba(228,181,71,0.85);text-decoration:underline;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}/terms" style="color:rgba(228,181,71,0.85);text-decoration:underline;">Terms</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@yike.ng" style="color:rgba(228,181,71,0.85);text-decoration:underline;">hello@yike.ng</a>
              </p>
              <p style="margin:10px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:10px;line-height:1.5;color:rgba(255,255,255,0.35);">
                You received this email because you have a ${SITE_NAME} account or requested a notification.
              </p>
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
