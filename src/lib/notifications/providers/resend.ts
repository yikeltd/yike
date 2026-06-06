import { Resend } from "resend";
import {
  buildAdminAlertEmailHtml,
  buildVerificationEmailHtml,
  buildWelcomeEmailHtml,
} from "@/lib/email/templates";
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
  return process.env.RESEND_FROM_EMAIL?.trim() || "Yike <hello@yike.ng>";
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
      return "Verify your Yike account";
    case "welcome":
      return "Welcome to Yike";
    case "admin_alert":
      return "Yike admin alert";
    default:
      return "Yike notification";
  }
}
