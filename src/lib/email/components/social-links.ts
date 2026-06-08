import { SITE_URL, SOCIAL_LINKS } from "@/lib/constants";
import { emailTokens as t } from "./tokens";

type EmailSocialKey = keyof typeof SOCIAL_LINKS;

const SOCIAL_ORDER: EmailSocialKey[] = [
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "facebook",
];

const SOCIAL_LABELS: Record<EmailSocialKey, string> = {
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
};

export function buildSocialLinks(options?: {
  iconSize?: number;
  variant?: "light" | "dark";
}): string {
  const iconSize = options?.iconSize ?? 22;
  const variant = options?.variant ?? "light";
  const opacity = variant === "dark" ? "1" : "0.7";

  const cells = SOCIAL_ORDER.map((key) => {
    const href = SOCIAL_LINKS[key];
    const label = SOCIAL_LABELS[key];
    const iconUrl = `${SITE_URL}/email/social/${key}.png`;

    return `
      <td align="center" style="padding:0 ${variant === "dark" ? "6" : "5"}px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" title="${label}" style="text-decoration:none;display:inline-block;opacity:${opacity};">
          <img src="${iconUrl}" width="${iconSize}" height="${iconSize}" alt="${label}" style="display:block;border:0;border-radius:50%;" />
        </a>
      </td>
    `;
  }).join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>${cells}</tr>
    </table>
  `.trim();
}

export function buildSocialLinksWithLabel(options?: {
  iconSize?: number;
  variant?: "light" | "dark";
}): string {
  const variant = options?.variant ?? "light";
  const labelClass = variant === "dark" ? "email-footer-label" : "email-muted";
  const labelColor = variant === "dark" ? t.gold : t.muted;

  return `
    <p class="${labelClass}" style="margin:0 0 12px;font-family:${t.fontFamily};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${labelColor};">
      Follow ${variant === "dark" ? "Yike" : "us"}
    </p>
    ${buildSocialLinks(options)}
  `.trim();
}
