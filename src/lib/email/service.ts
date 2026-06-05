import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { EMAIL_USER_MESSAGES } from "@/lib/notifications/messages";
import {
  buildVerificationEmailHtml,
  buildWelcomeEmailHtml,
  emailSubjectForType,
  isResendConfigured,
  sendTransactionalEmail,
} from "@/lib/notifications/providers/resend";
import type { EmailType } from "@/lib/notifications/types";
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
  const html = `
    <div style="font-family:system-ui,sans-serif;padding:16px;color:#031B4E;">
      <p style="font-weight:700;">Yike admin alert</p>
      <p>${params.body}</p>
    </div>
  `.trim();

  return sendEmail(admin, {
    email: params.to,
    type: "admin_alert",
    subject: params.subject,
    html,
  });
}
