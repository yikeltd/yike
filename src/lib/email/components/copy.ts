import { emailTokens as t } from "./tokens";

const { fontFamily, textBody, textSecondary, muted } = t;

type CopyAlign = { align?: "left" | "center" };

/** Greeting line — "Hi Ada," */
export function emailGreeting(name: string, options?: CopyAlign): string {
  const align = options?.align ?? "left";
  return `<p class="email-text" style="margin:0 0 16px;font-family:${fontFamily};font-size:17px;line-height:1.6;color:${textBody};text-align:${align};">Hi ${name},</p>`;
}

/** Primary body paragraph. */
export function emailParagraph(html: string, options?: CopyAlign): string {
  const align = options?.align ?? "left";
  return `<p class="email-text" style="margin:0 0 8px;font-family:${fontFamily};font-size:16px;line-height:1.6;color:${textBody};text-align:${align};">${html}</p>`;
}

/** Secondary supporting text — readable, not tiny. */
export function emailSecondary(html: string): string {
  return `<p class="email-secondary" style="margin:0 0 16px;font-family:${fontFamily};font-size:15px;line-height:1.6;color:${textSecondary};">${html}</p>`;
}

/** Security / disclaimer note at bottom of message. */
export function emailDisclaimer(html: string): string {
  return `<p class="email-muted" style="margin:0;font-family:${fontFamily};font-size:14px;line-height:1.55;color:${muted};">${html}</p>`;
}
