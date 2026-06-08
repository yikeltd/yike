import {
  buildAlertBlock,
  emailDisclaimer,
  emailGreeting,
  emailParagraph,
} from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildVerificationEmailHtml(params: {
  fullName: string;
  verifyUrl: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Verify your email to finish setting up your Yike account.",
    headline: "Verify your Yike account",
    headlineAlign: "center",
    contentAlign: "center",
    bodyHtml: `
      ${emailGreeting(name, { align: "center" })}
      ${emailParagraph(
        "Thanks for joining Yike. Tap the button below to verify your email and start browsing real homes across Nigeria.",
        { align: "center" }
      )}
      ${buildAlertBlock({
        title: "Secure link",
        body: "This link expires for your security. Only use it if you created a Yike account.",
        tone: "info",
      })}
      ${emailDisclaimer("If you didn&apos;t sign up, you can safely ignore this email.")}
    `,
    cta: { label: "Verify email", href: params.verifyUrl },
    fallbackLink: {
      label: "Button not working? Copy this link:",
      href: params.verifyUrl,
    },
  });
}
