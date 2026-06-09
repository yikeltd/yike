-- Relaxed agent onboarding: email + profile photo unlock listing.
-- WhatsApp and verified badge stay optional until re-enabled in admin controls.

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
