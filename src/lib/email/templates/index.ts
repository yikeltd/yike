import { buildAdminAlertEmailHtml } from "./admin-alert";
import { buildVerificationEmailHtml } from "./verification";
import { buildWelcomeEmailHtml } from "./welcome";

export { buildEmailLayout } from "./layout";
export { buildVerificationEmailHtml } from "./verification";
export { buildWelcomeEmailHtml } from "./welcome";
export { buildAdminAlertEmailHtml } from "./admin-alert";
export { escapeHtml } from "./utils";

/** Sample data for previews and design QA. */
export const EMAIL_PREVIEW_SAMPLES = {
  verification: {
    fullName: "Ada Okafor",
    verifyUrl: "https://yike.ng/auth/callback?token=sample-verify-link",
  },
  welcome: {
    fullName: "Ada Okafor",
  },
  adminAlert: {
    subject: "New listing flagged for review",
    body: "Listing #a1b2c3 in Enugu was reported twice for suspected duplicate photos.\n\nReview in admin: /lex/auth/listings",
  },
} as const;

export function buildAllEmailPreviews(): Array<{ id: string; name: string; subject: string; html: string }> {
  const { verification, welcome, adminAlert } = EMAIL_PREVIEW_SAMPLES;

  return [
    {
      id: "email_verification",
      name: "Email verification",
      subject: "Verify your Yike account",
      html: buildVerificationEmailHtml(verification),
    },
    {
      id: "welcome",
      name: "Welcome",
      subject: "Welcome to Yike",
      html: buildWelcomeEmailHtml(welcome),
    },
    {
      id: "admin_alert",
      name: "Admin alert",
      subject: adminAlert.subject,
      html: buildAdminAlertEmailHtml(adminAlert),
    },
  ];
}
