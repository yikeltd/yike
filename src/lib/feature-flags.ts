/**
 * Launch-safe feature flags for verification channels.
 * Email-first browse; SMS OTP for seller phone verification (founder-approved).
 * WhatsApp OTP stays off until WhatsApp Business is verified.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

/**
 * Master switch — phone OTP (seller SMS verification).
 * Production default: on (Sendchamp SMS / sender YIKE).
 */
export function isPhoneOtpEnabled(): boolean {
  return envFlag("ENABLE_PHONE_OTP", true);
}

/** SMS channel — production primary. Defaults on when phone OTP is enabled. */
export function isSmsOtpEnabled(): boolean {
  if (!isPhoneOtpEnabled()) return false;
  return envFlag("ENABLE_SMS_OTP", true);
}

/** WhatsApp OTP via Sendchamp — future channel; off until WA Business ready. */
export function isWhatsappOtpEnabled(): boolean {
  return envFlag("ENABLE_WHATSAPP_OTP", false);
}

export function isWhatsappOtpProviderSendchamp(): boolean {
  const raw = process.env.WHATSAPP_OTP_PROVIDER?.trim().toLowerCase();
  if (!raw) return true;
  return raw === "sendchamp";
}

/** Profile + listing WhatsApp number verification. */
export function isWhatsappProfileVerificationEnabled(): boolean {
  if (isWhatsappOtpEnabled() && isWhatsappOtpProviderSendchamp()) return true;
  return isWhatsappOtpEnabledClient();
}

/** Signup optional WhatsApp OTP (does not require ENABLE_PHONE_OTP). */
export function isWhatsappSignupOtpEnabled(): boolean {
  return isWhatsappOtpEnabled() && isWhatsappOtpProviderSendchamp();
}

/** Email verification / magic-link flow (launch default: on). */
export function isEmailOtpEnabled(): boolean {
  return envFlag("ENABLE_EMAIL_OTP", true);
}

/** Signup no longer blocks on phone OTP — WhatsApp verification is contextual only. */
export function isPhoneVerificationRequired(): boolean {
  return false;
}

/** Client bundle — mirrors ENABLE_PHONE_OTP for signup / seller UI. */
export function isPhoneOtpEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_PHONE_OTP?.trim().toLowerCase();
  if (!raw) return true;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Client bundle — mirrors ENABLE_WHATSAPP_OTP for verify UI. */
export function isWhatsappOtpEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_OTP?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

export function phoneOtpDisabledPublicMessage(): string {
  return "Phone verification is temporarily unavailable. Please try again shortly.";
}

/** Global gate for direct-to-agent WhatsApp routing (launch default: off). */
export function isDirectAgentWhatsAppEnabled(): boolean {
  return envFlag("ENABLE_DIRECT_AGENT_WHATSAPP", false);
}

/** Global gate for direct agent phone calls (launch default: off). */
export function isDirectAgentCallsEnabled(): boolean {
  return envFlag("ENABLE_DIRECT_AGENT_CALLS", false);
}

/** Global gate for agent lead billing deductions (launch default: off). */
export function isAgentLeadBillingEnabled(): boolean {
  return envFlag("ENABLE_AGENT_LEAD_BILLING", false);
}

/** System default lead price when agent/listing price unset (NGN). */
export function systemDefaultLeadPrice(): number {
  const raw = process.env.YIKE_DEFAULT_LEAD_PRICE?.trim();
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @deprecated use isLeadGatewayEnabled from gateway.ts — kept for imports */
export function isLeadGatewayEnabled(): boolean {
  return envFlag("YIKE_LEAD_GATEWAY_ENABLED", true);
}

/** WhatsApp Cloud API auto-reply — off at launch (human concierge). */
export function isWhatsappLeadAutoreplyEnabled(): boolean {
  return envFlag("ENABLE_WHATSAPP_LEAD_AUTOREPLY", false);
}

/** Home & relocation services marketplace — off until supply + moderation ready. */
export function isHomeServicesEnabled(): boolean {
  return envFlag("ENABLE_HOME_SERVICES", false);
}

/** Future passkey auth — not implemented. */
export function isWebAuthnEnabled(): boolean {
  return envFlag("ENABLE_WEBAUTHN", false);
}

/** Step-up confirmation for payout/bank changes (launch: on). */
export function isStepUpPayoutsEnabled(): boolean {
  return envFlag("ENABLE_STEP_UP_PAYOUTS", true);
}

/** Strict UA binding for trusted devices (launch: on). */
export function isStrictDeviceBindingEnabled(): boolean {
  return envFlag("ENABLE_STRICT_DEVICE_BINDING", true);
}

/** Client bundle — mirrors ENABLE_HOME_SERVICES for any future public UI. */
export function isHomeServicesEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_HOME_SERVICES?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Featured listing promotion UI (launch: on — payments may stay off). */
export function isFeaturedListingsEnabled(): boolean {
  return envFlag("ENABLE_FEATURED_LISTINGS", true);
}

/** Featured listing checkout — off until payment gateway is connected. */
export function isFeaturedPaymentsEnabled(): boolean {
  return (
    envFlag("ENABLE_FEATURED_PAYMENTS", false) ||
    envFlag("ENABLE_PAYMENTS", false)
  );
}

/** Client bundle — mirrors ENABLE_FEATURED_LISTINGS for agent promote UI. */
export function isFeaturedListingsEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_FEATURED_LISTINGS?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return isFeaturedListingsEnabled();
}
