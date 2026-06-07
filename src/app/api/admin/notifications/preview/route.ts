import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewRecipientCount } from "@/lib/notifications/admin/send";
import { requiresAdminPinForSend } from "@/lib/notifications/admin/pin-required";
import {
  INDIVIDUAL_TARGET_TYPES,
  normalizeTargetType,
  targetTypeLabel,
  type NotificationCategory,
  type NotificationPriority,
} from "@/lib/notifications/admin/constants";

export const runtime = "nodejs";

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

  const targetType = normalizeTargetType(String(body.targetType ?? ""));
  if (!targetType) {
    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  }

  const rawIds = body.selectedRecipientIds ?? body.recipientIds;
  const selectedRecipientIds = Array.isArray(rawIds)
    ? rawIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const targetFilters: Record<string, unknown> = {
    ...((body.targetFilters as Record<string, unknown>) ?? {}),
  };
  if (selectedRecipientIds.length > 0) {
    targetFilters.recipient_ids = selectedRecipientIds;
  }

  const priority = String(body.priority ?? "normal") as NotificationPriority;
  const category = String(body.category ?? "general") as NotificationCategory;

  if (INDIVIDUAL_TARGET_TYPES.has(targetType) && selectedRecipientIds.length === 0) {
    return NextResponse.json({
      ok: true,
      recipientCount: 0,
      audienceSummary: `${targetTypeLabel(targetType)} · 0 selected`,
      requiresPin: requiresAdminPinForSend({ targetType, priority, category }),
    });
  }

  const count = await previewRecipientCount(
    admin,
    targetType,
    targetFilters,
    selectedRecipientIds
  );

  const audienceSummary = INDIVIDUAL_TARGET_TYPES.has(targetType)
    ? `${selectedRecipientIds.length} selected recipient${selectedRecipientIds.length === 1 ? "" : "s"}`
    : `Send to ${count} ${targetTypeLabel(targetType).toLowerCase()}`;

  return NextResponse.json({
    ok: true,
    recipientCount: count,
    audienceSummary,
    requiresPin: requiresAdminPinForSend({ targetType, priority, category }),
  });
}
