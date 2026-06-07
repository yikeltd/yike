-- Admin notifications: scheduling, selected recipients, duplicate guard

ALTER TABLE admin_notification_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS selected_recipient_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resolved_recipient_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0;

-- recipient_count, failed_count already exist from initial migration

CREATE INDEX IF NOT EXISTS admin_notification_campaigns_scheduled_idx
  ON admin_notification_campaigns (status, scheduled_at)
  WHERE status = 'scheduled';

-- Prevent duplicate in-app delivery per campaign + recipient
CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_campaign_recipient_unique
  ON user_notifications (campaign_id, recipient_user_id)
  WHERE campaign_id IS NOT NULL;
