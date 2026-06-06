import { SITE_URL } from "@/lib/constants";
import { withEmailAssetOrigin } from "./utils";
import { buildAccountDeletedEmailHtml } from "./account-deleted";
import { buildAdminAlertEmailHtml } from "./admin-alert";
import {
  buildAgentVerificationApprovedEmailHtml,
  buildAgentVerificationRejectedEmailHtml,
  buildAgentVerificationSubmittedEmailHtml,
} from "./agent-emails";
import {
  buildListingApprovedEmailHtml,
  buildListingRejectedEmailHtml,
  buildListingSubmittedEmailHtml,
} from "./listing-emails";
import { buildPasswordResetEmailHtml } from "./password-reset";
import { buildReportReceivedEmailHtml } from "./report-received";
import { buildVerificationEmailHtml } from "./verification";
import { buildWelcomeEmailHtml } from "./welcome";
import { buildCareerApplicationReceivedEmailHtml } from "./career-application";

export { buildEmailLayout } from "./layout";
export { buildVerificationEmailHtml } from "./verification";
export { buildWelcomeEmailHtml } from "./welcome";
export { buildAdminAlertEmailHtml } from "./admin-alert";
export { buildPasswordResetEmailHtml } from "./password-reset";
export {
  buildAgentVerificationSubmittedEmailHtml,
  buildAgentVerificationApprovedEmailHtml,
  buildAgentVerificationRejectedEmailHtml,
} from "./agent-emails";
export {
  buildListingSubmittedEmailHtml,
  buildListingApprovedEmailHtml,
  buildListingRejectedEmailHtml,
} from "./listing-emails";
export { buildAccountDeletedEmailHtml } from "./account-deleted";
export { buildReportReceivedEmailHtml } from "./report-received";
export { buildCareerApplicationReceivedEmailHtml } from "./career-application";
export { escapeHtml, withEmailAssetOrigin } from "./utils";

/** Sample data for previews and design QA. */
export const EMAIL_PREVIEW_SAMPLES = {
  verification: {
    fullName: "Ada Okafor",
    verifyUrl: `${SITE_URL}/auth/callback?token=sample-verify-link`,
  },
  welcome: { fullName: "Ada Okafor" },
  passwordReset: {
    fullName: "Ada Okafor",
    resetUrl: `${SITE_URL}/auth/callback?token=sample-reset-link`,
  },
  accountDeleted: { fullName: "Ada Okafor" },
  agentSubmitted: { fullName: "Chidi Nwosu" },
  agentApproved: { fullName: "Chidi Nwosu" },
  agentRejected: {
    fullName: "Chidi Nwosu",
    reason: "NIN photo was blurry. Please resubmit a clear selfie and valid ID.",
  },
  listingSubmitted: {
    fullName: "Chidi Nwosu",
    listingTitle: "3-Bed Terrace in GRA Enugu",
    city: "Enugu",
  },
  listingApproved: {
    fullName: "Chidi Nwosu",
    listingTitle: "3-Bed Terrace in GRA Enugu",
    listingUrl: `${SITE_URL}/properties/sample-listing-id`,
  },
  listingRejected: {
    fullName: "Chidi Nwosu",
    listingTitle: "3-Bed Terrace in GRA Enugu",
    reason: "Photos appear duplicated from another listing. Upload original images.",
  },
  reportReceived: {
    reporterName: "Ada Okafor",
    listingTitle: "Self Contain in New Haven",
  },
  adminListingReport: {
    subject: "Listing reported — possible scam",
    body: "Listing #a1b2c3 in Enugu was reported twice for suspected duplicate photos.\n\nReview: /lex/auth/listings",
  },
  adminNewListing: {
    subject: "New listing pending review",
    body: "Agent Chidi Nwosu submitted \"3-Bed Terrace in GRA Enugu\" in Enugu.\n\nReview: /lex/auth/listings?status=pending",
  },
  adminNewAgent: {
    subject: "New agent verification application",
    body: "Chidi Nwosu (Enugu) submitted agent verification documents.\n\nReview: /lex/auth/agents",
  },
} as const;

export type EmailPreviewCategory = {
  id: string;
  label: string;
  templates: Array<{ id: string; name: string; subject: string; html: string }>;
};

export function buildAllEmailPreviews(): Array<{
  id: string;
  name: string;
  subject: string;
  html: string;
  category: string;
}> {
  const s = EMAIL_PREVIEW_SAMPLES;

  const categories: EmailPreviewCategory[] = [
    {
      id: "account",
      label: "Account & auth",
      templates: [
        {
          id: "email_verification",
          name: "Email verification",
          subject: "Verify your Yike account",
          html: buildVerificationEmailHtml(s.verification),
        },
        {
          id: "welcome",
          name: "Welcome",
          subject: "Welcome to Yike",
          html: buildWelcomeEmailHtml(s.welcome),
        },
        {
          id: "password_reset",
          name: "Password reset",
          subject: "Reset your Yike password",
          html: buildPasswordResetEmailHtml(s.passwordReset),
        },
        {
          id: "account_deleted",
          name: "Account deleted",
          subject: "Your Yike account was deleted",
          html: buildAccountDeletedEmailHtml(s.accountDeleted),
        },
      ],
    },
    {
      id: "agent",
      label: "Agent verification",
      templates: [
        {
          id: "agent_verification_submitted",
          name: "Application received",
          subject: "We received your agent application",
          html: buildAgentVerificationSubmittedEmailHtml(s.agentSubmitted),
        },
        {
          id: "agent_verification_approved",
          name: "Agent approved",
          subject: "You're a verified Yike agent",
          html: buildAgentVerificationApprovedEmailHtml(s.agentApproved),
        },
        {
          id: "agent_verification_rejected",
          name: "Agent not approved",
          subject: "Update on your agent application",
          html: buildAgentVerificationRejectedEmailHtml(s.agentRejected),
        },
      ],
    },
    {
      id: "listings",
      label: "Listings",
      templates: [
        {
          id: "listing_submitted",
          name: "Listing submitted",
          subject: "Your listing is under review",
          html: buildListingSubmittedEmailHtml(s.listingSubmitted),
        },
        {
          id: "listing_approved",
          name: "Listing approved",
          subject: "Your listing is live on Yike",
          html: buildListingApprovedEmailHtml(s.listingApproved),
        },
        {
          id: "listing_rejected",
          name: "Listing not approved",
          subject: "Your listing needs changes",
          html: buildListingRejectedEmailHtml(s.listingRejected),
        },
        {
          id: "report_received",
          name: "Report received",
          subject: "We received your report",
          html: buildReportReceivedEmailHtml(s.reportReceived),
        },
      ],
    },
    {
      id: "admin",
      label: "Admin alerts",
      templates: [
        {
          id: "admin_alert_report",
          name: "Listing reported",
          subject: s.adminListingReport.subject,
          html: buildAdminAlertEmailHtml(s.adminListingReport),
        },
        {
          id: "admin_alert_listing",
          name: "New listing pending",
          subject: s.adminNewListing.subject,
          html: buildAdminAlertEmailHtml(s.adminNewListing),
        },
        {
          id: "admin_alert_agent",
          name: "New agent application",
          subject: s.adminNewAgent.subject,
          html: buildAdminAlertEmailHtml(s.adminNewAgent),
        },
      ],
    },
  ];

  return categories.flatMap((cat) =>
    cat.templates.map((t) => ({ ...t, category: cat.label }))
  );
}

export function buildEmailPreviewCategories(options?: {
  assetOrigin?: string;
}): EmailPreviewCategory[] {
  const flat = buildAllEmailPreviews();
  const byCategory = new Map<string, typeof flat>();
  const assetOrigin = options?.assetOrigin;

  for (const t of flat) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  return Array.from(byCategory.entries()).map(([label, templates]) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    templates: templates.map(({ id, name, subject, html }) => ({
      id,
      name,
      subject,
      html:
        assetOrigin != null
          ? withEmailAssetOrigin(html, assetOrigin)
          : html,
    })),
  }));
}
