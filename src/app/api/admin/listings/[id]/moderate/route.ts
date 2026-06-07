import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import type { PropertyStatus } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

const ACTIONS = [
  "approve",
  "reject",
  "flag",
  "hide",
  "request_edits",
] as const;

type ModerateAction = (typeof ACTIONS)[number];

const STATUS_MAP: Record<ModerateAction, PropertyStatus | null> = {
  approve: "approved",
  reject: "rejected",
  flag: "flagged",
  hide: "hidden",
  request_edits: "pending",
};

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: ModerateAction;
    note?: string;
    clear_duplicate?: boolean;
  };

  if (!ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("properties")
    .select("id, title, status, possible_duplicate, moderation_note")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const nextStatus = STATUS_MAP[body.action];
  const patch: Record<string, unknown> = {
    status: nextStatus,
    moderation_note: body.note?.trim() || existing.moderation_note || null,
    updated_at: now,
  };

  if (body.action === "approve") {
    patch.last_refreshed_at = now;
    patch.listing_activity_status = "active";
  }

  if (body.clear_duplicate || body.action === "approve") {
    patch.possible_duplicate = false;
    patch.duplicate_confidence_score = null;
  }

  const { data, error } = await admin
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const auditAction =
    body.action === "flag"
      ? "listing.flag"
      : body.action === "hide"
        ? "listing.hide"
        : "listing.moderate";

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "property",
    target_id: id,
    metadata: {
      action: body.action,
      note: body.note ?? null,
      old_status: existing.status,
      new_status: nextStatus,
    },
    ip,
  });

  void recordListingHistoryEvent(admin, {
    listingId: id,
    eventType: "admin_reviewed",
    oldValue: { status: existing.status },
    newValue: { status: nextStatus, action: body.action },
    actorId: auth.user.id,
    actorRole: auth.profile.role,
    source: "admin_moderate",
    publicVisible: false,
    internalNote: body.note?.trim() || null,
  });

  return NextResponse.json({ listing: data });
}
