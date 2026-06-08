import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAFF_WORK_AREAS, type StaffWorkArea } from "@/lib/admin/staff-work-areas";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("staff_work_assignments")
    .select("*, staff:staff_id(id, full_name, email, role)")
    .order("assigned_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignments: data ?? [], work_areas: STAFF_WORK_AREAS });
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    staff_id: string;
    work_area: StaffWorkArea;
    priority?: number;
    notes?: string;
    is_active?: boolean;
  };

  if (!body.staff_id || !body.work_area) {
    return NextResponse.json({ error: "staff_id and work_area required" }, { status: 400 });
  }

  if (!(STAFF_WORK_AREAS as readonly string[]).includes(body.work_area)) {
    return NextResponse.json({ error: "Invalid work_area" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const payload = {
    staff_id: body.staff_id,
    work_area: body.work_area,
    assigned_by: auth.user.id,
    assigned_at: new Date().toISOString(),
    priority: body.priority ?? 0,
    notes: body.notes?.trim() || null,
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("staff_work_assignments")
    .upsert(payload, { onConflict: "staff_id,work_area" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: body.is_active === false ? "staff.assignment.revoke" : "staff.assignment.grant",
    target_type: "staff",
    target_id: body.staff_id,
    metadata: { work_area: body.work_area, priority: payload.priority },
    ip,
  });

  return NextResponse.json({ assignment: data });
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: row } = await admin
    .from("staff_work_assignments")
    .select("staff_id, work_area")
    .eq("id", id)
    .maybeSingle();

  await admin.from("staff_work_assignments").delete().eq("id", id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (row) {
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.assignment.revoke",
      target_type: "staff",
      target_id: row.staff_id,
      metadata: { work_area: row.work_area },
      ip,
    });
  }

  return NextResponse.json({ ok: true });
}
