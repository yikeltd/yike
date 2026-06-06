import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildPasswordResetEmailHtml(params: {
  fullName: string;
  resetUrl: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Reset your Yike password securely.",
    headline: "Reset your password",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        We received a request to reset your Yike password. Tap the button below to choose a new one.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        If you didn&apos;t ask for this, you can ignore this email — your password won&apos;t change.
      </p>
    `,
    cta: { label: "Reset password", href: params.resetUrl },
    fallbackLink: {
      label: "Button not working? Copy and paste this link:",
      href: params.resetUrl,
    },
  });
}
