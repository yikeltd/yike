import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

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

  const { data: permissions } = await admin
    .from("deal_matching_permissions")
    .select("*")
    .order("assigned_at", { ascending: false });

  const { data: supportStaff } = await admin
    .from("staff_profiles")
    .select("id, full_name, email, role, status")
    .eq("role", "support")
    .eq("status", "active");

  return NextResponse.json({
    permissions: permissions ?? [],
    supportStaff: supportStaff ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    staff_id: string;
    can_manage_deal_matching?: boolean;
    assignment_notes?: string;
    is_active?: boolean;
  };

  if (!body.staff_id) {
    return NextResponse.json({ error: "staff_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const payload = {
    staff_id: body.staff_id,
    can_manage_deal_matching: body.can_manage_deal_matching !== false,
    assigned_by: auth.user.id,
    assigned_at: now,
    assignment_notes: body.assignment_notes?.trim() || null,
    is_active: body.is_active !== false,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("deal_matching_permissions")
    .upsert(payload, { onConflict: "staff_id" })
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
    action: body.is_active === false ? "deal_matching.permission.revoke" : "deal_matching.permission.grant",
    target_type: "staff",
    target_id: body.staff_id,
    metadata: { can_manage_deal_matching: payload.can_manage_deal_matching },
    ip,
  });

  return NextResponse.json({ permission: data });
}
