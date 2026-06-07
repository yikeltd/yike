import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveNotificationRecipients } from "@/lib/notifications/admin/resolve-recipients";
import { sanitizeNotificationActionUrl } from "@/lib/notifications/admin/safe-url";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationTargetType,
} from "@/lib/notifications/admin/constants";

const INSERT_BATCH = 200;

export type CampaignInput = {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetType: NotificationTargetType;
  targetFilters?: Record<string, unknown>;
  actionLabel?: string | null;
  actionUrl?: string | null;
  createdBy: string;
};

export async function createNotificationDraft(
  admin: SupabaseClient,
  input: CampaignInput
): Promise<{ campaignId: string }> {
  const { data, error } = await admin
    .from("admin_notification_campaigns")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      priority: input.priority,
      target_type: input.targetType,
      target_filters: input.targetFilters ?? {},
      action_label: input.actionLabel?.trim() || null,
      action_url: sanitizeNotificationActionUrl(input.actionUrl),
      status: "draft",
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Draft create failed");
  return { campaignId: data.id };
}

export async function previewRecipientCount(
  admin: SupabaseClient,
  targetType: NotificationTargetType,
  targetFilters: Record<string, unknown> = {}
): Promise<number> {
  const recipients = await resolveNotificationRecipients(admin, targetType, targetFilters);
  return recipients.length;
}

export async function sendNotificationCampaign(
  admin: SupabaseClient,
  campaignId: string,
  sentBy: string
): Promise<{ recipientCount: number; failedCount: number }> {
  const { data: campaign, error: loadError } = await admin
    .from("admin_notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (loadError || !campaign) throw new Error("Campaign not found");
  if (campaign.status === "sent") throw new Error("Campaign already sent");
  if (campaign.status === "cancelled") throw new Error("Campaign cancelled");

  await admin
    .from("admin_notification_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  const recipients = await resolveNotificationRecipients(
    admin,
    campaign.target_type as NotificationTargetType,
    (campaign.target_filters as Record<string, unknown>) ?? {}
  );

  const now = new Date().toISOString();
  const actionUrl = sanitizeNotificationActionUrl(campaign.action_url);
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i += INSERT_BATCH) {
    const chunk = recipients.slice(i, i + INSERT_BATCH);
    const rows = chunk.map((recipientId) => ({
      campaign_id: campaignId,
      recipient_user_id: recipientId,
      title: campaign.title,
      body: campaign.body,
      category: campaign.category,
      priority: campaign.priority,
      action_label: campaign.action_label,
      action_url: actionUrl,
      delivery_channel: "in_app",
      delivered_at: now,
    }));

    const { error } = await admin.from("user_notifications").insert(rows);
    if (error) failedCount += chunk.length;
  }

  const recipientCount = recipients.length - failedCount;
  const finalStatus = failedCount === recipients.length && recipients.length > 0 ? "failed" : "sent";

  await admin
    .from("admin_notification_campaigns")
    .update({
      status: finalStatus,
      sent_by: sentBy,
      sent_at: now,
      recipient_count: recipientCount,
      failed_count: failedCount,
      updated_at: now,
    })
    .eq("id", campaignId);

  return { recipientCount, failedCount };
}
