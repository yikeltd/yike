import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateNotificationCampaign } from "@/lib/notifications/admin/send";
import { requiresAdminPinForSend } from "@/lib/notifications/admin/pin-required";
import { sanitizeNotificationActionUrl } from "@/lib/notifications/admin/safe-url";
import {
  DEFAULT_NOTIFICATION_TIMEZONE,
  INDIVIDUAL_TARGET_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  normalizeTargetType,
  type NotificationCategory,
  type NotificationPriority,
} from "@/lib/notifications/admin/constants";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await admin
    .from("admin_notification_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("admin_notification_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!["draft", "scheduled"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Only draft or scheduled campaigns can be edited" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const category = String(body.category ?? existing.category) as NotificationCategory;
  const priority = String(body.priority ?? existing.priority) as NotificationPriority;
  const targetType =
    normalizeTargetType(String(body.targetType ?? existing.target_type)) ??
    existing.target_type;

  const selectedRecipientIds = Array.isArray(body.selectedRecipientIds)
    ? [...new Set(body.selectedRecipientIds.map((x) => String(x).trim()).filter(Boolean))]
    : (existing.selected_recipient_ids as string[] | null) ?? [];

  if (
    INDIVIDUAL_TARGET_TYPES.has(targetType as never) &&
    selectedRecipientIds.length === 0
  ) {
    return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
  }

  const scheduledRaw = body.scheduledAt ?? existing.scheduled_at;
  const scheduledAt = scheduledRaw ? new Date(String(scheduledRaw)).toISOString() : null;
  const keepScheduled = existing.status === "scheduled" || Boolean(body.scheduledAt);

  if (keepScheduled && scheduledAt && Date.parse(scheduledAt) <= Date.now()) {
    return NextResponse.json({ error: "Schedule time must be in the future" }, { status: 400 });
  }

  if (
    requiresAdminPinForSend({
      targetType: targetType as never,
      priority,
      category,
    })
  ) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const actionUrl = body.actionUrl !== undefined
    ? sanitizeNotificationActionUrl(String(body.actionUrl || ""))
    : existing.action_url;

  if (body.actionUrl && !actionUrl) {
    return NextResponse.json({ error: "Invalid action URL" }, { status: 400 });
  }

  await updateNotificationCampaign(admin, id, {
    title: body.title != null ? String(body.title) : existing.title,
    body: body.body != null ? String(body.body) : existing.body,
    category,
    priority,
    targetType: targetType as never,
    selectedRecipientIds,
    actionLabel:
      body.actionLabel !== undefined
        ? String(body.actionLabel || "").trim() || null
        : existing.action_label,
    actionUrl: actionUrl ?? null,
    scheduledAt: keepScheduled ? scheduledAt : null,
    timezone: String(body.timezone ?? existing.timezone ?? DEFAULT_NOTIFICATION_TIMEZONE),
    status: keepScheduled ? "scheduled" : "draft",
  });

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "notification.updated",
    target_type: "notification_campaign",
    target_id: id,
    metadata: {
      targetType,
      category,
      priority,
      scheduled_at: scheduledAt,
    },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}
