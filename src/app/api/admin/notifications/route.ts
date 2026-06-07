import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createNotificationDraft,
  sendNotificationCampaign,
} from "@/lib/notifications/admin/send";
import { requiresAdminPinForSend } from "@/lib/notifications/admin/pin-required";
import { sanitizeNotificationActionUrl } from "@/lib/notifications/admin/safe-url";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  TARGET_TYPES,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationTargetType,
} from "@/lib/notifications/admin/constants";

export const runtime = "nodejs";

function parseRecipientIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => String(id).trim()).filter(Boolean))];
  }
  if (typeof raw === "string") {
    return [
      ...new Set(
        raw
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ];
  }
  return [];
}

function validatePayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const message = String(body.body ?? body.message ?? "").trim();
  const category = String(body.category ?? "general") as NotificationCategory;
  const priority = String(body.priority ?? "normal") as NotificationPriority;
  const targetType = String(body.targetType ?? "") as NotificationTargetType;

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
  if (!TARGET_TYPES.some((t) => t.value === targetType)) {
    return { error: "Invalid target audience" };
  }

  const recipientIds = parseRecipientIds(body.recipientIds);
  const targetFilters: Record<string, unknown> = { ...((body.targetFilters as object) ?? {}) };
  if (recipientIds.length > 0) {
    targetFilters.recipient_ids = recipientIds;
  }

  const actionUrl = sanitizeNotificationActionUrl(
    body.actionUrl ? String(body.actionUrl) : null
  );
  if (body.actionUrl && !actionUrl) {
    return { error: "Action URL must be an internal path starting with /" };
  }

  return {
    title,
    message,
    category,
    priority,
    targetType,
    targetFilters,
    actionLabel: body.actionLabel ? String(body.actionLabel).trim().slice(0, 40) : null,
    actionUrl,
    sendNow: Boolean(body.sendNow),
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
      "id, title, body, category, priority, target_type, status, recipient_count, failed_count, sent_at, created_at, created_by"
    )
    .order("created_at", { ascending: false })
    .limit(50);

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
    actionLabel,
    actionUrl,
    sendNow,
    campaignId,
  } = parsed;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (sendNow && requiresAdminPinForSend({ targetType, priority, category })) {
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
      actionLabel,
      actionUrl,
      createdBy: auth.user.id,
    });
    id = draft.campaignId;

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "notification.draft_created",
      target_type: "notification_campaign",
      target_id: id,
      metadata: { targetType, category, priority, title },
      ip,
    });
  } else {
    await admin
      .from("admin_notification_campaigns")
      .update({
        title,
        body: message,
        category,
        priority,
        target_type: targetType,
        target_filters: targetFilters,
        action_label: actionLabel,
        action_url: actionUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  if (!sendNow) {
    return NextResponse.json({ ok: true, campaignId: id, status: "draft" });
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
