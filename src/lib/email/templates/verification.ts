import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildVerificationEmailHtml(params: {
  fullName: string;
  verifyUrl: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Verify your email to finish setting up your Yike account.",
    headline: "Verify your email",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Thanks for joining Yike — Nigeria&apos;s trust-first housing marketplace.
        Tap the button below to verify your email and unlock browsing, saving homes, and listing property.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        This link expires for your security. If you didn&apos;t create a Yike account, you can safely ignore this email.
      </p>
    `,
    cta: { label: "Verify my email", href: params.verifyUrl },
    fallbackLink: {
      label: "Button not working? Copy and paste this link:",
      href: params.verifyUrl,
    },
  });
}
