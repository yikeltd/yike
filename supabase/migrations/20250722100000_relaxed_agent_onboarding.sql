-- Relaxed agent onboarding: email + profile photo unlock listing.
-- WhatsApp and verified badge stay optional until re-enabled in admin controls.
-- Bootstraps verification_control_config if prod skipped 20250717100000 / 20250718100000.

CREATE TABLE IF NOT EXISTS verification_control_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  email_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  bank_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  listing_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  verified_badge_required BOOLEAN NOT NULL DEFAULT TRUE,
  enhanced_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  company_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  cac_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  id_verification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  selfie_verification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_escalation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT verification_control_config_singleton CHECK (id = TRUE)
);

INSERT INTO verification_control_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

ALTER TABLE verification_control_config
  ADD COLUMN IF NOT EXISTS listing_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS device_abuse_monitoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS multi_account_detection_enabled BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE verification_control_config
SET
  whatsapp_verification_required = FALSE,
  verified_badge_required = FALSE,
  updated_at = NOW()
WHERE id = TRUE;

-- Becoming an agent used to set verification_status = pending without a badge application.
UPDATE profiles p
SET verification_status = 'not_started'
WHERE p.role IN ('agent_unverified', 'agent')
  AND p.verification_status = 'pending'
  AND COALESCE(p.verified_badge, FALSE) = FALSE
  AND NOT EXISTS (
    SELECT 1
    FROM agent_verifications av
    WHERE av.agent_id = p.id
      AND av.status IN ('pending', 'approved')
  );
