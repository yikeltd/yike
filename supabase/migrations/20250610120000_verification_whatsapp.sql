-- WhatsApp-only verification calls (no third-party video links)

ALTER TABLE agent_verifications
  ADD COLUMN IF NOT EXISTS verification_call_method TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS verification_whatsapp_number TEXT NOT NULL DEFAULT '2348035143299';

ALTER TABLE agent_verifications DROP COLUMN IF EXISTS verification_call_url;

COMMENT ON COLUMN agent_verifications.verification_call_method IS 'Always whatsapp — verification via Yike official WhatsApp video call';
COMMENT ON COLUMN agent_verifications.verification_whatsapp_number IS 'Yike official WhatsApp number for verification calls';
