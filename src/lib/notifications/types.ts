export type OtpChannel = "whatsapp" | "sms";

export type DeliveryStatus = "sent" | "failed" | "verified" | "expired" | "cooldown" | "max_attempts";

export type EmailType =
  | "email_verification"
  | "welcome"
  | "admin_alert"
  | "account_notification";

export type ProviderResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
