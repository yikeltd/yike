import {
  buildAlertBlock,
  buildOtpBlock,
  emailDisclaimer,
  emailGreeting,
  emailParagraph,
} from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export type EmailOtpPurpose = "signup" | "login" | "sensitive";

const HEADLINES: Record<EmailOtpPurpose, string> = {
  signup: "Verify your Yike account",
  login: "Your Yike sign-in code",
  sensitive: "Confirm this action",
};

export const EMAIL_OTP_SUBJECTS: Record<EmailOtpPurpose, string> = {
  signup: "Verify your Yike account",
  login: "Your Yike sign-in code",
  sensitive: "Your Yike verification code",
};

/** Map auth OTP purposes to email template variants. */
export function mapAuthOtpPurpose(
  purpose: "signup" | "login" | "email_verify" | "password_reset"
): EmailOtpPurpose {
  if (purpose === "login") return "login";
  if (purpose === "password_reset") return "sensitive";
  return "signup";
}

export function buildEmailOtpHtml(params: {
  fullName: string;
  code: string;
  purpose?: EmailOtpPurpose;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const code = escapeHtml(params.code);
  const purpose = params.purpose ?? "signup";
  const headline = HEADLINES[purpose];

  return buildEmailLayout({
    preheader: `${code} is your Yike verification code`,
    headline,
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph("Enter this code to continue. It expires in 10 minutes.")}
      ${buildOtpBlock(code)}
      ${buildAlertBlock({
        title: "Keep this code private",
        body: "Yike will never ask for your code by phone or WhatsApp. If you didn&apos;t request this, ignore this email.",
        tone: "info",
      })}
      ${emailDisclaimer("Sent securely from Yike — Nigeria&apos;s trust-first housing marketplace.")}
    `,
    showSupport: true,
  });
}
