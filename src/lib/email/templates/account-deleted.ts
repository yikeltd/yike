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
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Your Yike account and profile data have been permanently deleted as requested.
        Active listings tied to your account are no longer visible on the marketplace.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        If you didn&apos;t request this, contact us immediately at hello@yike.ng.
      </p>
    `,
  });
}
