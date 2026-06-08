import {
  buildAlertBlock,
  emailDisclaimer,
  emailGreeting,
  emailParagraph,
} from "@/lib/email/components";
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
      ${emailGreeting(name)}
      ${emailParagraph("We received a request to reset your Yike password. Tap below to choose a new one.")}
      ${buildAlertBlock({
        title: "Didn&apos;t request this?",
        body: "Your password stays the same. You can ignore this email.",
        tone: "warning",
      })}
      ${emailDisclaimer("This link expires for your security.")}
    `,
    cta: { label: "Reset password", href: params.resetUrl },
    fallbackLink: {
      label: "Button not working? Copy this link:",
      href: params.resetUrl,
    },
  });
}
