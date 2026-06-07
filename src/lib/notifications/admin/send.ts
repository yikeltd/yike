import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveNotificationRecipients } from "@/lib/notifications/admin/resolve-recipients";
import { sanitizeNotificationActionUrl } from "@/lib/notifications/admin/safe-url";
import {
  DEFAULT_NOTIFICATION_TIMEZONE,
  INDIVIDUAL_TARGET_TYPES,
  normalizeTargetType,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

const INSERT_BATCH = 200;

export type CampaignInput = {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetType: NotificationTargetType;
  targetFilters?: Record<string, unknown>;
  selectedRecipientIds?: string[];
  actionLabel?: string | null;
  actionUrl?: string | null;
  createdBy: string;
  scheduledAt?: string | null;
  timezone?: string;
};

type CampaignRow = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  target_type: string;
  target_filters: Record<string, unknown> | null;
  selected_recipient_ids: string[] | null;
  action_label: string | null;
  action_url: string | null;
  status: string;
};

function campaignStatusForInput(input: CampaignInput): "draft" | "scheduled" {
  if (input.scheduledAt) return "scheduled";
  return "draft";
}

export async function createNotificationDraft(
  admin: SupabaseClient,
  input: CampaignInput
): Promise<{ campaignId: string }> {
  const selectedIds = input.selectedRecipientIds ?? [];
  const { data, error } = await admin
    .from("admin_notification_campaigns")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      priority: input.priority,
      target_type: input.targetType,
      target_filters: input.targetFilters ?? {},
      selected_recipient_ids: selectedIds,
      action_label: input.actionLabel?.trim() || null,
      action_url: sanitizeNotificationActionUrl(input.actionUrl),
      status: campaignStatusForInput(input),
      scheduled_at: input.scheduledAt ?? null,
      timezone: input.timezone ?? DEFAULT_NOTIFICATION_TIMEZONE,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Draft create failed");
  return { campaignId: data.id };
}

export async function updateNotificationCampaign(
  admin: SupabaseClient,
  campaignId: string,
  input: Partial<CampaignInput> & { status?: string }
): Promise<void> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title != null) patch.title = input.title.trim();
  if (input.body != null) patch.body = input.body.trim();
  if (input.category != null) patch.category = input.category;
  if (input.priority != null) patch.priority = input.priority;
  if (input.targetType != null) patch.target_type = input.targetType;
  if (input.targetFilters != null) patch.target_filters = input.targetFilters;
  if (input.selectedRecipientIds != null) {
    patch.selected_recipient_ids = input.selectedRecipientIds;
  }
  if (input.actionLabel !== undefined) {
    patch.action_label = input.actionLabel?.trim() || null;
  }
  if (input.actionUrl !== undefined) {
    patch.action_url = sanitizeNotificationActionUrl(input.actionUrl);
  }
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
  if (input.timezone != null) patch.timezone = input.timezone;
  if (input.status != null) patch.status = input.status;

  const { error } = await admin
    .from("admin_notification_campaigns")
    .update(patch)
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
}

export async function previewRecipientCount(
  admin: SupabaseClient,
  targetType: NotificationTargetType,
  targetFilters: Record<string, unknown> = {},
  selectedRecipientIds?: string[]
): Promise<number> {
  const recipients = await resolveNotificationRecipients(
    admin,
    targetType,
    targetFilters,
    selectedRecipientIds
  );
  return recipients.length;
}

async function deliverToRecipients(
  admin: SupabaseClient,
  campaign: CampaignRow,
  recipients: string[],
  sentBy: string
): Promise<{ recipientCount: number; failedCount: number; sentCount: number }> {
  const now = new Date().toISOString();
  const actionUrl = sanitizeNotificationActionUrl(campaign.action_url);
  let failedCount = 0;
  let sentCount = 0;

  for (let i = 0; i < recipients.length; i += INSERT_BATCH) {
    const chunk = recipients.slice(i, i + INSERT_BATCH);
    const { data: existing } = await admin
      .from("user_notifications")
      .select("recipient_user_id")
      .eq("campaign_id", campaign.id)
      .in("recipient_user_id", chunk);

    const alreadySent = new Set(
      (existing ?? []).map((r) => r.recipient_user_id as string)
    );
    const pending = chunk.filter((id) => !alreadySent.has(id));

    if (pending.length === 0) continue;

    const rows = pending.map((recipientId) => ({
      campaign_id: campaign.id,
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

    if (error) {
      failedCount += pending.length;
    } else {
      sentCount += pending.length;
    }
  }

  const recipientCount = sentCount;
  const finalStatus =
    failedCount === recipients.length && recipients.length > 0 ? "failed" : "sent";

  await admin
    .from("admin_notification_campaigns")
    .update({
      status: finalStatus,
      sent_by: sentBy,
      sent_at: now,
      recipient_count: recipientCount,
      sent_count: sentCount,
      failed_count: failedCount,
      resolved_recipient_snapshot: {
        resolved_at: now,
        total_resolved: recipients.length,
        delivered: sentCount,
        failed: failedCount,
      },
      updated_at: now,
    })
    .eq("id", campaign.id);

  return { recipientCount, failedCount, sentCount };
}

export async function sendNotificationCampaign(
  admin: SupabaseClient,
  campaignId: string,
  sentBy: string
): Promise<{ recipientCount: number; failedCount: number; sentCount: number }> {
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
    campaign.target_type,
    (campaign.target_filters as Record<string, unknown>) ?? {},
    campaign.selected_recipient_ids ?? undefined
  );

  const normalizedTarget = normalizeTargetType(campaign.target_type);
  if (normalizedTarget && INDIVIDUAL_TARGET_TYPES.has(normalizedTarget)) {
    if (recipients.length === 0) {
      await admin
        .from("admin_notification_campaigns")
        .update({
          status: "failed",
          failed_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
      throw new Error("No valid recipients found");
    }
  }

  return deliverToRecipients(admin, campaign as CampaignRow, recipients, sentBy);
}

export async function processDueScheduledCampaigns(
  admin: SupabaseClient
): Promise<{
  processed: number;
  results: Array<{
    campaignId: string;
    createdBy: string;
    recipientCount: number;
    failedCount: number;
  }>;
}> {
  const now = new Date().toISOString();
  const { data: due } = await admin
    .from("admin_notification_campaigns")
    .select("id, created_by")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  const results: Array<{
    campaignId: string;
    createdBy: string;
    recipientCount: number;
    failedCount: number;
  }> = [];

  for (const row of due ?? []) {
    try {
      const result = await sendNotificationCampaign(
        admin,
        row.id,
        row.created_by
      );
      results.push({
        campaignId: row.id,
        createdBy: row.created_by,
        recipientCount: result.recipientCount,
        failedCount: result.failedCount,
      });
    } catch {
      await admin
        .from("admin_notification_campaigns")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({
        campaignId: row.id,
        createdBy: row.created_by,
        recipientCount: 0,
        failedCount: 0,
      });
    }
  }

  return { processed: results.length, results };
}
