import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  InspectionPaymentStatus,
  InspectionRequestStatus,
} from "@/types/database";

const STATUSES: InspectionRequestStatus[] = [
  "pending",
  "contacted",
  "assigned",
  "scheduled",
  "completed",
  "rejected",
  "cancelled",
];

const PAYMENT_STATUSES: InspectionPaymentStatus[] = [
  "not_requested",
  "requested",
  "paid",
  "waived",
  "refunded",
];

export async function PATCH(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    id: string;
    status?: InspectionRequestStatus;
    priority?: "low" | "normal" | "high" | "urgent";
    assigned_to?: string | null;
    inspection_fee_amount?: number | null;
    payment_status?: InspectionPaymentStatus;
    scheduled_at?: string | null;
    completed_at?: string | null;
    admin_notes?: string | null;
    scout_notes?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const needsPin =
    body.payment_status === "paid" ||
    body.payment_status === "waived" ||
    body.status === "completed";

  if (needsPin) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("inspection_requests")
    .select("*")
    .eq("id", body.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === "completed" && !body.completed_at) {
      patch.completed_at = new Date().toISOString();
    }
  }
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.assigned_to !== undefined) patch.assigned_to = body.assigned_to;
  if (body.inspection_fee_amount !== undefined) {
    patch.inspection_fee_amount = body.inspection_fee_amount;
  }
  if (body.payment_status !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.payment_status)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    patch.payment_status = body.payment_status;
  }
  if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at;
  if (body.completed_at !== undefined) patch.completed_at = body.completed_at;
  if (body.admin_notes !== undefined) {
    patch.admin_notes = body.admin_notes?.trim() || null;
  }
  if (body.scout_notes !== undefined) {
    patch.scout_notes = body.scout_notes?.trim() || null;
  }

  const { data, error } = await admin
    .from("inspection_requests")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  let auditAction: "inspection.status" | "inspection.assign" | "inspection.payment" =
    "inspection.status";
  if (body.assigned_to !== undefined) auditAction = "inspection.assign";
  if (body.payment_status !== undefined) auditAction = "inspection.payment";

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "inspection_request",
    target_id: body.id,
    metadata: { old: existing, new: patch },
    ip,
  });

  return NextResponse.json({ request: data });
}
