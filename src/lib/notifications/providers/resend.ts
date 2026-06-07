import { Resend } from "resend";
import {
  buildAdminAlertEmailHtml,
  buildVerificationEmailHtml,
  buildWelcomeEmailHtml,
} from "@/lib/email/templates";
import { transactionalFromAddress } from "@/lib/email/from-address";
import type { EmailType, ProviderResult } from "../types";

export {
  buildVerificationEmailHtml,
  buildWelcomeEmailHtml,
  buildAdminAlertEmailHtml,
} from "@/lib/email/templates";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return transactionalFromAddress();
}

export function authOtpSubject(): string {
  return "Your Yike verification code";
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}): Promise<ProviderResult<{ id?: string }>> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "Resend not configured" };
  }

  const { data, error } = await resend.emails.send(
    {
      from: fromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
    },
    params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { id: data?.id } };
}

export function emailSubjectForType(type: EmailType): string {
  switch (type) {
    case "email_verification":
      return "Your Yike verification code";
    case "welcome":
      return "Welcome to Yike";
    case "password_reset":
      return "Reset your Yike password";
    case "account_deleted":
      return "Your Yike account was deleted";
    case "agent_verification_submitted":
      return "We received your agent application";
    case "agent_verification_approved":
      return "You're a verified Yike agent";
    case "agent_verification_rejected":
      return "Update on your agent application";
    case "listing_submitted":
      return "Your listing is under review";
    case "listing_approved":
      return "Your listing is live on Yike";
    case "listing_rejected":
      return "Your listing needs changes";
    case "report_received":
      return "We received your report";
    case "admin_alert":
      return "Yike admin alert";
    case "career_application_received":
      return "Application received — Yike Careers";
    default:
      return "Yike notification";
  }
}
