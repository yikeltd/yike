import { emailDisclaimer, emailGreeting, emailParagraph } from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildAccountDeletedEmailHtml(params: {
  fullName: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Your Yike account has been deleted.",
    headline: "Account deleted",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        "Your Yike account and profile data have been permanently deleted. Active listings tied to your account are no longer visible."
      )}
      ${emailDisclaimer("If you didn&apos;t request this, contact hello@yike.ng immediately.")}
    `,
  });
}
