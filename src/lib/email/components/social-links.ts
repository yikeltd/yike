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

/** Minimal monochrome social row — compact, not cluttered. */
export function buildSocialLinks(): string {
  const cells = SOCIAL_ORDER.map((key) => {
    const href = SOCIAL_LINKS[key];
    const label = SOCIAL_LABELS[key];
    const iconUrl = `${SITE_URL}/email/social/${key}.png`;

    return `
      <td align="center" style="padding:0 5px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" title="${label}" style="text-decoration:none;display:inline-block;opacity:0.7;">
          <img src="${iconUrl}" width="22" height="22" alt="${label}" style="display:block;border:0;border-radius:50%;" />
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

export function buildSocialLinksWithLabel(): string {
  return `
    <p class="email-muted" style="margin:0 0 10px;font-family:${t.fontFamily};font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${t.muted};">
      Follow Yike
    </p>
    ${buildSocialLinks()}
  `.trim();
}
