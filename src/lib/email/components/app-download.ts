import { SITE_URL } from "@/lib/constants";

const PLAY_BADGE = `${SITE_URL}/email/badges/google-play.png`;
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.yike.app";

/** Google Play badge only — compact footer CTA. */
export function buildAppDownloadRow(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto 0;">
      <tr>
        <td align="center">
          <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
            <img src="${PLAY_BADGE}" width="155" height="60" alt="Get it on Google Play" style="display:block;border:0;height:auto;max-width:155px;" />
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}
