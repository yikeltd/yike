import { Resend } from "resend";
import type { EmailType, ProviderResult } from "../types";

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

export function buildVerificationEmailHtml(params: {
  fullName: string;
  verifyUrl: string;
}): string {
  const name = params.fullName || "there";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#031B4E;">
      <p style="font-size:18px;font-weight:700;margin:0 0 12px;">Verify your Yike account</p>
      <p style="margin:0 0 20px;line-height:1.5;">Hi ${name}, tap below to verify your email and finish setting up Yike.</p>
      <a href="${params.verifyUrl}" style="display:inline-block;background:#E4B547;color:#031B4E;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px;">Verify email</a>
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">If you did not create a Yike account, ignore this email.</p>
    </div>
  `.trim();
}

export function buildWelcomeEmailHtml(params: { fullName: string }): string {
  const name = params.fullName || "there";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#031B4E;">
      <p style="font-size:18px;font-weight:700;margin:0 0 12px;">Welcome to Yike</p>
      <p style="margin:0 0 12px;line-height:1.5;">Hi ${name}, your email is verified. Browse real homes across Nigeria and contact agents on WhatsApp.</p>
      <a href="https://yike.ng" style="display:inline-block;background:#E4B547;color:#031B4E;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px;">Explore listings</a>
    </div>
  `.trim();
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
