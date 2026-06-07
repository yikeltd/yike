-- Admin notification campaigns + in-app user notifications

CREATE TABLE IF NOT EXISTS admin_notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  target_type TEXT NOT NULL,
  target_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_label TEXT,
  action_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  delivery_channel TEXT NOT NULL DEFAULT 'in_app',
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_notification_campaigns DROP CONSTRAINT IF EXISTS admin_notification_campaigns_category_check;
ALTER TABLE admin_notification_campaigns
  ADD CONSTRAINT admin_notification_campaigns_category_check
  CHECK (category IN (
    'general', 'account', 'listing', 'verification', 'lead',
    'payment', 'warning', 'announcement', 'system'
  ));

ALTER TABLE admin_notification_campaigns DROP CONSTRAINT IF EXISTS admin_notification_campaigns_priority_check;
ALTER TABLE admin_notification_campaigns
  ADD CONSTRAINT admin_notification_campaigns_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE admin_notification_campaigns DROP CONSTRAINT IF EXISTS admin_notification_campaigns_status_check;
ALTER TABLE admin_notification_campaigns
  ADD CONSTRAINT admin_notification_campaigns_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS admin_notification_campaigns_status_idx
  ON admin_notification_campaigns (status, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notification_campaigns_created_by_idx
  ON admin_notification_campaigns (created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES admin_notification_campaigns(id) ON DELETE SET NULL,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  action_label TEXT,
  action_url TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'in_app',
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notifications_recipient_idx
  ON user_notifications (recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_created_idx
  ON user_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_campaign_idx
  ON user_notifications (campaign_id);

ALTER TABLE admin_notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notification_campaigns_staff ON admin_notification_campaigns
  FOR ALL USING (is_staff_admin());

CREATE POLICY user_notifications_select_own ON user_notifications
  FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY user_notifications_update_own ON user_notifications
  FOR UPDATE USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

CREATE TRIGGER admin_notification_campaigns_updated_at
  BEFORE UPDATE ON admin_notification_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
