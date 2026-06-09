import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  getListingValueDrivers,
  moderateListingValueDrivers,
} from "@/lib/value-drivers/service";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const drivers = await getListingValueDrivers(admin, id);
  const { data: listing } = await admin
    .from("properties")
    .select("value_drivers_status, approved_value_driver_count")
    .eq("id", id)
    .single();

  return NextResponse.json({ drivers, summary: listing ?? null });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
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
    action?: "approve_all" | "reject_all" | "moderate";
    approveKeys?: string[];
    rejectKeys?: string[];
    requestEvidenceKeys?: string[];
    rejectionReason?: string;
    moderationNote?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const drivers = await getListingValueDrivers(admin, id);
  if (drivers.length === 0) {
    return NextResponse.json({ error: "No value drivers on this listing" }, { status: 404 });
  }

  let approveKeys = body.approveKeys ?? [];
  let rejectKeys = body.rejectKeys ?? [];
  const requestEvidenceKeys = body.requestEvidenceKeys ?? [];

  if (body.action === "approve_all") {
    approveKeys = drivers.map((d) => d.driver_key);
  } else if (body.action === "reject_all") {
    rejectKeys = drivers.map((d) => d.driver_key);
  }

  await moderateListingValueDrivers(admin, {
    listingId: id,
    approveKeys,
    rejectKeys,
    requestEvidenceKeys,
    reviewedBy: auth.user.id,
    rejectionReason: body.rejectionReason,
    moderationNote: body.moderationNote,
  });

  const hdrs = await headers();
  const auditAction =
    requestEvidenceKeys.length > 0 && approveKeys.length === 0 && rejectKeys.length === 0
      ? "listing.value_drivers.evidence"
      : rejectKeys.length > 0 && approveKeys.length === 0
        ? "listing.value_drivers.reject"
        : "listing.value_drivers.approve";

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "property",
    target_id: id,
    metadata: {
      action: body.action,
      approveKeys,
      rejectKeys,
      requestEvidenceKeys,
      note: body.moderationNote ?? null,
    },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  const updated = await getListingValueDrivers(admin, id);
  return NextResponse.json({ ok: true, drivers: updated });
}
