import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { EMAIL_USER_MESSAGES } from "@/lib/notifications/messages";
import {
  buildAccountDeletedEmailHtml,
  buildAdminAlertEmailHtml,
  buildAgentVerificationApprovedEmailHtml,
  buildAgentVerificationRejectedEmailHtml,
  buildAgentVerificationSubmittedEmailHtml,
  buildListingApprovedEmailHtml,
  buildListingRejectedEmailHtml,
  buildListingSubmittedEmailHtml,
  buildPasswordResetEmailHtml,
  buildReportReceivedEmailHtml,
  buildVerificationEmailHtml,
  buildWelcomeEmailHtml,
  buildCareerApplicationReceivedEmailHtml,
} from "@/lib/email/templates";
import {
  emailSubjectForType,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/notifications/providers/resend";
import type { EmailType } from "@/lib/notifications/types";
import { getAdminAlertInbox } from "./admin-inbox";
import { hasSentEmail, logEmailEvent } from "./logs";

type EmailResult = { ok: true; message: string } | { ok: false; error: string };

async function sendEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    type: EmailType;
    subject: string;
    html: string;
    idempotencyKey?: string;
  }
): Promise<EmailResult> {
  if (!isResendConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Yike email dev] ${params.type} → ${params.email}`);
      await logEmailEvent(admin, { email: params.email, type: params.type, status: "sent" });
      return { ok: true, message: EMAIL_USER_MESSAGES.verificationSent };
    }
    await logEmailEvent(admin, { email: params.email, type: params.type, status: "failed" });
    return { ok: false, error: EMAIL_USER_MESSAGES.sendFailed };
  }

  const result = await sendTransactionalEmail({
    to: params.email,
    subject: params.subject,
    html: params.html,
    idempotencyKey: params.idempotencyKey,
  });

  if (!result.ok) {
    await logEmailEvent(admin, { email: params.email, type: params.type, status: "failed" });
    return { ok: false, error: EMAIL_USER_MESSAGES.sendFailed };
  }

  await logEmailEvent(admin, { email: params.email, type: params.type, status: "sent" });
  return { ok: true, message: EMAIL_USER_MESSAGES.verificationSent };
}

export async function sendEmailVerification(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string }
): Promise<EmailResult> {
  const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent("/auth/verify-email")}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: params.email,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    await logEmailEvent(admin, {
      email: params.email,
      type: "email_verification",
      status: "failed",
    });
    return { ok: false, error: EMAIL_USER_MESSAGES.sendFailed };
  }

  return sendEmail(admin, {
    email: params.email,
    type: "email_verification",
    subject: emailSubjectForType("email_verification"),
    html: buildVerificationEmailHtml({
      fullName: params.fullName,
      verifyUrl: data.properties.action_link,
    }),
    idempotencyKey: `email-verification/${params.userId}`,
  });
}

export async function resendEmailVerification(
  admin: SupabaseClient,
  params: { email: string; fullName?: string; userId: string }
): Promise<EmailResult> {
  return sendEmailVerification(admin, {
    email: params.email,
    fullName: params.fullName ?? "",
    userId: params.userId,
  });
}

export async function sendWelcomeEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string }
): Promise<EmailResult> {
  const already = await hasSentEmail(admin, params.email, "welcome");
  if (already) {
    return { ok: true, message: EMAIL_USER_MESSAGES.verificationSent };
  }

  return sendEmail(admin, {
    email: params.email,
    type: "welcome",
    subject: emailSubjectForType("welcome"),
    html: buildWelcomeEmailHtml({ fullName: params.fullName }),
    idempotencyKey: `welcome/${params.userId}`,
  });
}

export async function sendAdminAlert(
  admin: SupabaseClient,
  params: { to: string; subject: string; body: string }
): Promise<EmailResult> {
  const html = buildAdminAlertEmailHtml({
    subject: params.subject,
    body: params.body,
  });

  return sendEmail(admin, {
    email: params.to,
    type: "admin_alert",
    subject: params.subject,
    html,
  });
}

export async function sendPasswordResetEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string }
): Promise<EmailResult> {
  const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent("/auth/login")}`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: params.email,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    return { ok: false, error: EMAIL_USER_MESSAGES.sendFailed };
  }

  return sendEmail(admin, {
    email: params.email,
    type: "password_reset",
    subject: emailSubjectForType("password_reset"),
    html: buildPasswordResetEmailHtml({
      fullName: params.fullName,
      resetUrl: data.properties.action_link,
    }),
    idempotencyKey: `password-reset/${params.userId}/${Date.now()}`,
  });
}

export async function sendAccountDeletedEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string }
): Promise<EmailResult> {
  return sendEmail(admin, {
    email: params.email,
    type: "account_deleted",
    subject: emailSubjectForType("account_deleted"),
    html: buildAccountDeletedEmailHtml({ fullName: params.fullName }),
  });
}

export async function sendAgentVerificationSubmittedEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string; city: string }
): Promise<EmailResult> {
  await sendAdminAlert(admin, {
    to: getAdminAlertInbox(),
    subject: "New agent verification application",
    body: `${params.fullName} (${params.city}) submitted agent verification documents.\n\nReview: /lex/auth/agents`,
  });

  return sendEmail(admin, {
    email: params.email,
    type: "agent_verification_submitted",
    subject: emailSubjectForType("agent_verification_submitted"),
    html: buildAgentVerificationSubmittedEmailHtml({ fullName: params.fullName }),
    idempotencyKey: `agent-submitted/${params.userId}`,
  });
}

export async function sendAgentVerificationApprovedEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string }
): Promise<EmailResult> {
  return sendEmail(admin, {
    email: params.email,
    type: "agent_verification_approved",
    subject: emailSubjectForType("agent_verification_approved"),
    html: buildAgentVerificationApprovedEmailHtml({ fullName: params.fullName }),
    idempotencyKey: `agent-approved/${params.userId}`,
  });
}

export async function sendAgentVerificationRejectedEmail(
  admin: SupabaseClient,
  params: { email: string; fullName: string; userId: string; reason?: string }
): Promise<EmailResult> {
  return sendEmail(admin, {
    email: params.email,
    type: "agent_verification_rejected",
    subject: emailSubjectForType("agent_verification_rejected"),
    html: buildAgentVerificationRejectedEmailHtml({
      fullName: params.fullName,
      reason: params.reason,
    }),
    idempotencyKey: `agent-rejected/${params.userId}/${Date.now()}`,
  });
}

export async function sendListingSubmittedEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    fullName: string;
    userId: string;
    propertyId: string;
    listingTitle: string;
    city: string;
  }
): Promise<EmailResult> {
  await sendAdminAlert(admin, {
    to: getAdminAlertInbox(),
    subject: "New listing pending review",
    body: `${params.fullName} submitted "${params.listingTitle}" in ${params.city}.\n\nReview: /lex/auth/listings?status=pending`,
  });

  return sendEmail(admin, {
    email: params.email,
    type: "listing_submitted",
    subject: emailSubjectForType("listing_submitted"),
    html: buildListingSubmittedEmailHtml({
      fullName: params.fullName,
      listingTitle: params.listingTitle,
      city: params.city,
    }),
    idempotencyKey: `listing-submitted/${params.propertyId}`,
  });
}

export async function sendListingApprovedEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    fullName: string;
    propertyId: string;
    listingTitle: string;
  }
): Promise<EmailResult> {
  return sendEmail(admin, {
    email: params.email,
    type: "listing_approved",
    subject: emailSubjectForType("listing_approved"),
    html: buildListingApprovedEmailHtml({
      fullName: params.fullName,
      listingTitle: params.listingTitle,
      listingUrl: `${SITE_URL}/properties/${params.propertyId}`,
    }),
    idempotencyKey: `listing-approved/${params.propertyId}`,
  });
}

export async function sendListingRejectedEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    fullName: string;
    propertyId: string;
    listingTitle: string;
    reason?: string;
  }
): Promise<EmailResult> {
  return sendEmail(admin, {
    email: params.email,
    type: "listing_rejected",
    subject: emailSubjectForType("listing_rejected"),
    html: buildListingRejectedEmailHtml({
      fullName: params.fullName,
      listingTitle: params.listingTitle,
      reason: params.reason,
    }),
    idempotencyKey: `listing-rejected/${params.propertyId}/${Date.now()}`,
  });
}

export async function sendCareerApplicationEmails(
  admin: SupabaseClient,
  params: {
    applicationId: string;
    applicantEmail: string;
    applicantName: string;
    jobTitle: string;
    score: number;
    status: string;
  }
): Promise<EmailResult> {
  await sendAdminAlert(admin, {
    to: getAdminAlertInbox(),
    subject: `New careers application — ${params.jobTitle}`,
    body: `${params.applicantName} applied for "${params.jobTitle}".\nScore: ${params.score}% · Status: ${params.status}\n\nReview: /lex/auth/careers/applications`,
  });

  return sendEmail(admin, {
    email: params.applicantEmail,
    type: "career_application_received",
    subject: emailSubjectForType("career_application_received"),
    html: buildCareerApplicationReceivedEmailHtml({
      fullName: params.applicantName,
      jobTitle: params.jobTitle,
    }),
    idempotencyKey: `career-application/${params.applicationId}`,
  });
}

export async function sendReportReceivedEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    reporterName: string;
    listingTitle: string;
    reportId: string;
  }
): Promise<EmailResult> {
  await sendAdminAlert(admin, {
    to: getAdminAlertInbox(),
    subject: "Listing reported — review needed",
    body: `${params.reporterName} reported "${params.listingTitle}".\n\nReview: /lex/auth/reports`,
  });

  return sendEmail(admin, {
    email: params.email,
    type: "report_received",
    subject: emailSubjectForType("report_received"),
    html: buildReportReceivedEmailHtml({
      reporterName: params.reporterName,
      listingTitle: params.listingTitle,
    }),
    idempotencyKey: `report-received/${params.reportId}`,
  });
}
