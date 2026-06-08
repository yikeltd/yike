import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { EMAIL_LOGO_PATH, emailTokens as t } from "./tokens";

/** Clean, readable header — logo + wordmark, no heavy gradient block. */
export function buildEmailHeader(): string {
  const logoUrl = `${SITE_URL}${EMAIL_LOGO_PATH}`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td class="email-header" style="padding:32px 28px 24px;font-family:${t.fontFamily};">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <img src="${logoUrl}" width="36" height="36" alt="${SITE_NAME}" class="email-logo" style="display:block;border:0;border-radius:8px;" />
                </td>
                <td valign="middle">
                  <span class="email-brand" style="font-size:20px;font-weight:800;color:${t.navy};letter-spacing:-0.3px;line-height:1;">${SITE_NAME}</span>
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}
