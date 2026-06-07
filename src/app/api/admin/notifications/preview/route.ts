import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewRecipientCount } from "@/lib/notifications/admin/send";
import { requiresAdminPinForSend } from "@/lib/notifications/admin/pin-required";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationTargetType,
} from "@/lib/notifications/admin/constants";
import { TARGET_TYPES } from "@/lib/notifications/admin/constants";

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

  const targetType = String(body.targetType ?? "") as NotificationTargetType;
  if (!TARGET_TYPES.some((t) => t.value === targetType)) {
    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  }

  const rawIds = body.recipientIds;
  const recipientIds = Array.isArray(rawIds)
    ? rawIds.map((id) => String(id).trim()).filter(Boolean)
    : typeof rawIds === "string"
      ? rawIds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : [];
  const targetFilters: Record<string, unknown> = {
    ...((body.targetFilters as Record<string, unknown>) ?? {}),
  };
  if (recipientIds.length > 0) targetFilters.recipient_ids = recipientIds;

  const priority = (String(body.priority ?? "normal") as NotificationPriority);
  const category = (String(body.category ?? "general") as NotificationCategory);

  const count = await previewRecipientCount(admin, targetType, targetFilters);

  return NextResponse.json({
    ok: true,
    recipientCount: count,
    requiresPin: requiresAdminPinForSend({ targetType, priority, category }),
  });
}
