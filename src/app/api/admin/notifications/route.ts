import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createNotificationDraft,
  sendNotificationCampaign,
  updateNotificationCampaign,
} from "@/lib/notifications/admin/send";
import { requiresAdminPinForSend } from "@/lib/notifications/admin/pin-required";
import { sanitizeNotificationActionUrl } from "@/lib/notifications/admin/safe-url";
import {
  DEFAULT_NOTIFICATION_TIMEZONE,
  INDIVIDUAL_TARGET_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  normalizeTargetType,
  TARGET_TYPES,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

export const runtime = "nodejs";

type SendMode = "draft" | "now" | "schedule";

function parseRecipientIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id).trim()).filter(Boolean))];
  }
  return [];
}

function parseScheduledAt(raw: unknown): string | null {
  if (!raw) return null;
  const iso = new Date(String(raw)).toISOString();
  if (Number.isNaN(Date.parse(iso))) return null;
  if (Date.parse(iso) <= Date.now()) return null;
  return iso;
}

function validatePayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const message = String(body.body ?? body.message ?? "").trim();
  const category = String(body.category ?? "general") as NotificationCategory;
  const priority = String(body.priority ?? "normal") as NotificationPriority;
  const rawTarget = String(body.targetType ?? "");
  const targetType = normalizeTargetType(rawTarget);

  if (!title || title.length > 120) {
    return { error: "Title required (max 120 chars)" };
  }
  if (!message || message.length > 2000) {
    return { error: "Message required (max 2000 chars)" };
  }
  if (!NOTIFICATION_CATEGORIES.some((c) => c.value === category)) {
    return { error: "Invalid category" };
  }
  if (!NOTIFICATION_PRIORITIES.some((p) => p.value === priority)) {
    return { error: "Invalid priority" };
  }
  if (!targetType || !TARGET_TYPES.some((t) => t.value === targetType)) {
    return { error: "Invalid target audience" };
  }

  const selectedRecipientIds = parseRecipientIds(
    body.selectedRecipientIds ?? body.recipientIds
  );
  const targetFilters: Record<string, unknown> = {
    ...((body.targetFilters as object) ?? {}),
  };
  if (selectedRecipientIds.length > 0) {
    targetFilters.recipient_ids = selectedRecipientIds;
  }

  if (INDIVIDUAL_TARGET_TYPES.has(targetType) && selectedRecipientIds.length === 0) {
    return { error: "Select at least one recipient" };
  }

  const actionUrl = sanitizeNotificationActionUrl(
    body.actionUrl ? String(body.actionUrl) : null
  );
  if (body.actionUrl && !actionUrl) {
    return { error: "Action URL must be an internal path starting with /" };
  }

  const sendMode = (String(body.sendMode ?? (body.sendNow ? "now" : "draft")) as SendMode);
  if (!["draft", "now", "schedule"].includes(sendMode)) {
    return { error: "Invalid send mode" };
  }

  const scheduledAt =
    sendMode === "schedule" ? parseScheduledAt(body.scheduledAt) : null;
  if (sendMode === "schedule" && !scheduledAt) {
    return { error: "Valid future schedule time required" };
  }

  return {
    title,
    message,
    category,
    priority,
    targetType,
    targetFilters,
    selectedRecipientIds,
    actionLabel: body.actionLabel ? String(body.actionLabel).trim().slice(0, 40) : null,
    actionUrl,
    sendMode,
    scheduledAt,
    timezone: String(body.timezone ?? DEFAULT_NOTIFICATION_TIMEZONE),
    campaignId: body.campaignId ? String(body.campaignId) : null,
  };
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await admin
    .from("admin_notification_campaigns")
    .select(
      "id, title, body, category, priority, target_type, status, recipient_count, sent_count, failed_count, scheduled_at, timezone, selected_recipient_ids, sent_at, created_at, created_by, sent_by"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = validatePayload(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    title,
    message,
    category,
    priority,
    targetType,
    targetFilters,
    selectedRecipientIds,
    actionLabel,
    actionUrl,
    sendMode,
    scheduledAt,
    timezone,
    campaignId,
  } = parsed;

  const needsPin =
    sendMode === "now" || sendMode === "schedule"
      ? requiresAdminPinForSend({ targetType, priority, category })
      : false;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (needsPin) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  let id = campaignId;
  if (!id) {
    const draft = await createNotificationDraft(admin, {
      title,
      body: message,
      category,
      priority,
      targetType,
      targetFilters,
      selectedRecipientIds,
      actionLabel,
      actionUrl,
      createdBy: auth.user.id,
      scheduledAt: sendMode === "schedule" ? scheduledAt : null,
      timezone,
    });
    id = draft.campaignId;

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action:
        sendMode === "schedule" ? "notification.scheduled" : "notification.draft_created",
      target_type: "notification_campaign",
      target_id: id,
      metadata: {
        targetType,
        category,
        priority,
        title,
        scheduled_at: scheduledAt,
        recipient_count: selectedRecipientIds.length,
      },
      ip,
    });
  } else {
    const { data: existing } = await admin
      .from("admin_notification_campaigns")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (!existing || !["draft", "scheduled"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Only draft or scheduled campaigns can be updated" },
        { status: 400 }
      );
    }

    await updateNotificationCampaign(admin, id, {
      title,
      body: message,
      category,
      priority,
      targetType,
      targetFilters,
      selectedRecipientIds,
      actionLabel,
      actionUrl,
      scheduledAt: sendMode === "schedule" ? scheduledAt : null,
      timezone,
      status:
        sendMode === "schedule"
          ? "scheduled"
          : sendMode === "draft"
            ? "draft"
            : existing.status,
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "notification.updated",
      target_type: "notification_campaign",
      target_id: id,
      metadata: { targetType, category, priority, title, scheduled_at: scheduledAt },
      ip,
    });
  }

  if (sendMode === "draft" || sendMode === "schedule") {
    return NextResponse.json({
      ok: true,
      campaignId: id,
      status: sendMode === "schedule" ? "scheduled" : "draft",
      scheduledAt,
    });
  }

  const result = await sendNotificationCampaign(admin, id, auth.user.id);

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "notification.sent",
    target_type: "notification_campaign",
    target_id: id,
    metadata: {
      targetType,
      category,
      priority,
      title,
      recipient_count: result.recipientCount,
      failed_count: result.failedCount,
      sent_count: result.sentCount,
    },
    ip,
  });

  return NextResponse.json({
    ok: true,
    campaignId: id,
    status: "sent",
    ...result,
  });
}
