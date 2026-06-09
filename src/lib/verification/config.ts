import type { SupabaseClient } from "@supabase/supabase-js";

export type VerificationControlConfig = {
  email_verification_required: boolean;
  whatsapp_verification_required: boolean;
  bank_verification_required: boolean;
  listing_review_required: boolean;
  listing_verification_required: boolean;
  verified_badge_required: boolean;
  enhanced_review_required: boolean;
  company_verification_required: boolean;
  cac_verification_required: boolean;
  id_verification_enabled: boolean;
  selfie_verification_enabled: boolean;
  auto_escalation_enabled: boolean;
  device_abuse_monitoring_enabled: boolean;
  multi_account_detection_enabled: boolean;
};

export const DEFAULT_VERIFICATION_CONFIG: VerificationControlConfig = {
  email_verification_required: true,
  whatsapp_verification_required: false,
  bank_verification_required: false,
  listing_review_required: true,
  listing_verification_required: false,
  verified_badge_required: false,
  enhanced_review_required: false,
  company_verification_required: false,
  cac_verification_required: false,
  id_verification_enabled: false,
  selfie_verification_enabled: false,
  auto_escalation_enabled: false,
  device_abuse_monitoring_enabled: false,
  multi_account_detection_enabled: false,
};

export async function getVerificationControlConfig(
  client: SupabaseClient
): Promise<VerificationControlConfig> {
  const { data } = await client
    .from("verification_control_config")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (!data) return DEFAULT_VERIFICATION_CONFIG;

  return {
    email_verification_required: data.email_verification_required ?? true,
    whatsapp_verification_required: data.whatsapp_verification_required ?? false,
    bank_verification_required: data.bank_verification_required ?? false,
    listing_review_required: data.listing_review_required ?? true,
    verified_badge_required: data.verified_badge_required ?? false,
    enhanced_review_required: data.enhanced_review_required ?? false,
    company_verification_required: data.company_verification_required ?? false,
    cac_verification_required: data.cac_verification_required ?? false,
    id_verification_enabled: data.id_verification_enabled ?? false,
    selfie_verification_enabled: data.selfie_verification_enabled ?? false,
    auto_escalation_enabled: data.auto_escalation_enabled ?? false,
    listing_verification_required: data.listing_verification_required ?? false,
    device_abuse_monitoring_enabled: data.device_abuse_monitoring_enabled ?? false,
    multi_account_detection_enabled: data.multi_account_detection_enabled ?? false,
  };
}
