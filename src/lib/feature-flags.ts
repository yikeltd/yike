/**
 * Launch-safe feature flags for verification channels.
 * Defaults favor email-first auth; phone/SMS/WhatsApp OTP off until re-enabled via env.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

/** Master switch — SMS + WhatsApp phone OTP at signup/login. */
export function isPhoneOtpEnabled(): boolean {
  return envFlag("ENABLE_PHONE_OTP", false);
}

export function isSmsOtpEnabled(): boolean {
  return envFlag("ENABLE_SMS_OTP", false) && isPhoneOtpEnabled();
}

export function isWhatsappOtpEnabled(): boolean {
  return envFlag("ENABLE_WHATSAPP_OTP", false) && isPhoneOtpEnabled();
}

/** Email verification / magic-link flow (launch default: on). */
export function isEmailOtpEnabled(): boolean {
  return envFlag("ENABLE_EMAIL_OTP", true);
}

/** Whether signup/agent flows may block on phone_verified. */
export function isPhoneVerificationRequired(): boolean {
  return isPhoneOtpEnabled();
}

/** Client bundle — mirrors ENABLE_PHONE_OTP for signup UI. */
export function isPhoneOtpEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_PHONE_OTP?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "true" || raw === "1" || raw === "yes";
}

export function phoneOtpDisabledPublicMessage(): string {
  return "Continue with email to access Yike.";
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

/** Client bundle — mirrors ENABLE_HOME_SERVICES for any future public UI. */
export function isHomeServicesEnabledClient(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_HOME_SERVICES?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "true" || raw === "1" || raw === "yes";
}
