export type OtpChannel = "whatsapp" | "sms";

export type DeliveryStatus = "sent" | "failed" | "verified" | "expired" | "cooldown" | "max_attempts";

export type EmailType =
  | "email_verification"
  | "welcome"
  | "password_reset"
  | "account_deleted"
  | "agent_verification_submitted"
  | "agent_verification_approved"
  | "agent_verification_rejected"
  | "listing_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "report_received"
  | "admin_alert"
  | "account_notification"
  | "career_application_received";

export type ProviderResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
