-- Launch War Room C02: prevent clients from escalating privileged profile columns
-- via "Users can update own profile" (FOR UPDATE USING auth.uid() = id).
-- Staff (is_staff_admin) and service_role may still change these fields.
-- Project: hlpojfurfldvcxfxhveg

CREATE OR REPLACE FUNCTION public.yike_profiles_privileged_bypass()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(auth.role(), '') = 'service_role'
    OR public.is_staff_admin();
$$;

CREATE OR REPLACE FUNCTION public.enforce_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.yike_profiles_privileged_bypass() THEN
    RETURN NEW;
  END IF;

  -- Identity / access control
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: role';
  END IF;
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: is_banned';
  END IF;
  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: account_status';
  END IF;
  IF NEW.profile_status IS DISTINCT FROM OLD.profile_status THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: profile_status';
  END IF;
  IF NEW.profile_status_reason IS DISTINCT FROM OLD.profile_status_reason THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: profile_status_reason';
  END IF;
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: account_type';
  END IF;
  IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: suspended_at';
  END IF;
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: deleted_at';
  END IF;

  -- Verification / trust (staff or service_role only)
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_status';
  END IF;
  IF NEW.verified_badge IS DISTINCT FROM OLD.verified_badge THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verified_badge';
  END IF;
  IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verified_at';
  END IF;
  IF NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verified_by';
  END IF;
  IF NEW.verification_notes IS DISTINCT FROM OLD.verification_notes THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_notes';
  END IF;
  IF NEW.is_verified_agent IS DISTINCT FROM OLD.is_verified_agent THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: is_verified_agent';
  END IF;
  IF NEW.verified_agent_at IS DISTINCT FROM OLD.verified_agent_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verified_agent_at';
  END IF;
  IF NEW.verified_agent_by IS DISTINCT FROM OLD.verified_agent_by THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verified_agent_by';
  END IF;
  IF NEW.seller_verification_level IS DISTINCT FROM OLD.seller_verification_level THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: seller_verification_level';
  END IF;
  IF NEW.verification_level IS DISTINCT FROM OLD.verification_level THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_level';
  END IF;
  IF NEW.developer_verified IS DISTINCT FROM OLD.developer_verified THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: developer_verified';
  END IF;
  IF NEW.agency_verified IS DISTINCT FROM OLD.agency_verified THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: agency_verified';
  END IF;
  IF NEW.verification_required IS DISTINCT FROM OLD.verification_required THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_required';
  END IF;
  IF NEW.verification_escalation_reason IS DISTINCT FROM OLD.verification_escalation_reason THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_escalation_reason';
  END IF;
  IF NEW.verification_escalated_at IS DISTINCT FROM OLD.verification_escalated_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_escalated_at';
  END IF;
  IF NEW.verification_escalated_by IS DISTINCT FROM OLD.verification_escalated_by THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: verification_escalated_by';
  END IF;
  IF NEW.trust_score IS DISTINCT FROM OLD.trust_score THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: trust_score';
  END IF;
  IF NEW.ranking_score IS DISTINCT FROM OLD.ranking_score THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: ranking_score';
  END IF;
  IF NEW.adaptive_trust_level IS DISTINCT FROM OLD.adaptive_trust_level THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: adaptive_trust_level';
  END IF;
  IF NEW.adaptive_trust_override IS DISTINCT FROM OLD.adaptive_trust_override THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: adaptive_trust_override';
  END IF;
  IF NEW.operational_suspicion_score IS DISTINCT FROM OLD.operational_suspicion_score THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: operational_suspicion_score';
  END IF;
  IF NEW.abuse_review_flag IS DISTINCT FROM OLD.abuse_review_flag THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: abuse_review_flag';
  END IF;
  IF NEW.abuse_review_reason IS DISTINCT FROM OLD.abuse_review_reason THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: abuse_review_reason';
  END IF;

  -- Phone / email / WhatsApp verification flags (OTP + admin paths use service_role)
  IF NEW.phone_verified IS DISTINCT FROM OLD.phone_verified THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: phone_verified';
  END IF;
  IF NEW.phone_verified_at IS DISTINCT FROM OLD.phone_verified_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: phone_verified_at';
  END IF;
  IF NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: email_verified';
  END IF;
  IF NEW.whatsapp_verification_status IS DISTINCT FROM OLD.whatsapp_verification_status THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: whatsapp_verification_status';
  END IF;
  IF NEW.whatsapp_verified_at IS DISTINCT FROM OLD.whatsapp_verified_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: whatsapp_verified_at';
  END IF;
  IF NEW.whatsapp_verification_reference IS DISTINCT FROM OLD.whatsapp_verification_reference THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: whatsapp_verification_reference';
  END IF;
  IF NEW.whatsapp_verification_attempts IS DISTINCT FROM OLD.whatsapp_verification_attempts THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: whatsapp_verification_attempts';
  END IF;
  IF NEW.whatsapp_verification_requested_at IS DISTINCT FROM OLD.whatsapp_verification_requested_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: whatsapp_verification_requested_at';
  END IF;
  IF NEW.bank_verified IS DISTINCT FROM OLD.bank_verified THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: bank_verified';
  END IF;
  IF NEW.bank_verified_at IS DISTINCT FROM OLD.bank_verified_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: bank_verified_at';
  END IF;

  -- Listing limits / monetization / routing (staff or billing service)
  IF NEW.listing_limit IS DISTINCT FROM OLD.listing_limit THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: listing_limit';
  END IF;
  IF NEW.listing_limit_reason IS DISTINCT FROM OLD.listing_limit_reason THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: listing_limit_reason';
  END IF;
  IF NEW.listing_limit_updated_at IS DISTINCT FROM OLD.listing_limit_updated_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: listing_limit_updated_at';
  END IF;
  IF NEW.listing_limit_updated_by IS DISTINCT FROM OLD.listing_limit_updated_by THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: listing_limit_updated_by';
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: plan';
  END IF;
  IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: plan_expires_at';
  END IF;
  IF NEW.subscription_plan_code IS DISTINCT FROM OLD.subscription_plan_code THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: subscription_plan_code';
  END IF;
  IF NEW.starter_plan_started_at IS DISTINCT FROM OLD.starter_plan_started_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: starter_plan_started_at';
  END IF;
  IF NEW.founding_member IS DISTINCT FROM OLD.founding_member THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: founding_member';
  END IF;
  IF NEW.lead_insights_until IS DISTINCT FROM OLD.lead_insights_until THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: lead_insights_until';
  END IF;
  IF NEW.billing_mode IS DISTINCT FROM OLD.billing_mode THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: billing_mode';
  END IF;
  IF NEW.default_lead_price IS DISTINCT FROM OLD.default_lead_price THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: default_lead_price';
  END IF;
  IF NEW.premium_lead_price IS DISTINCT FROM OLD.premium_lead_price THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: premium_lead_price';
  END IF;
  IF NEW.lead_billing_enabled IS DISTINCT FROM OLD.lead_billing_enabled THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: lead_billing_enabled';
  END IF;
  IF NEW.routing_mode IS DISTINCT FROM OLD.routing_mode THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: routing_mode';
  END IF;
  IF NEW.allow_direct_whatsapp IS DISTINCT FROM OLD.allow_direct_whatsapp THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: allow_direct_whatsapp';
  END IF;
  IF NEW.direct_whatsapp_enabled_at IS DISTINCT FROM OLD.direct_whatsapp_enabled_at THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: direct_whatsapp_enabled_at';
  END IF;
  IF NEW.direct_whatsapp_enabled_by IS DISTINCT FROM OLD.direct_whatsapp_enabled_by THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: direct_whatsapp_enabled_by';
  END IF;
  IF NEW.direct_whatsapp_disabled_reason IS DISTINCT FROM OLD.direct_whatsapp_disabled_reason THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: direct_whatsapp_disabled_reason';
  END IF;
  IF NEW.direct_routing_health_status IS DISTINCT FROM OLD.direct_routing_health_status THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: direct_routing_health_status';
  END IF;

  -- Attribution lock + performance counters (system / staff)
  IF NEW.attribution_locked IS DISTINCT FROM OLD.attribution_locked THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: attribution_locked';
  END IF;
  IF NEW.referred_by_ambassador_id IS DISTINCT FROM OLD.referred_by_ambassador_id THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: referred_by_ambassador_id';
  END IF;
  IF NEW.complaint_count IS DISTINCT FROM OLD.complaint_count THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: complaint_count';
  END IF;
  IF NEW.spam_lead_ratio IS DISTINCT FROM OLD.spam_lead_ratio THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: spam_lead_ratio';
  END IF;
  IF NEW.stale_listing_ratio IS DISTINCT FROM OLD.stale_listing_ratio THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: stale_listing_ratio';
  END IF;
  IF NEW.performance_score IS DISTINCT FROM OLD.performance_score THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: performance_score';
  END IF;
  IF NEW.successful_handoffs IS DISTINCT FROM OLD.successful_handoffs THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: successful_handoffs';
  END IF;
  IF NEW.inquiry_count IS DISTINCT FROM OLD.inquiry_count THEN
    RAISE EXCEPTION 'profile_privileged_column_denied: inquiry_count';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profiles_privileged_columns ON public.profiles;
CREATE TRIGGER enforce_profiles_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profiles_privileged_columns();

COMMENT ON FUNCTION public.enforce_profiles_privileged_columns() IS
  'Blocks non-staff clients from changing role, ban, verification, trust, billing, and related privileged profile columns.';

NOTIFY pgrst, 'reload schema';
