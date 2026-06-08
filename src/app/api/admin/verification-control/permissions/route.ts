import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .from("verification_control_permissions")
    .select("*")
    .order("assigned_at", { ascending: false });

  const { data: staff } = await admin
    .from("staff_profiles")
    .select("id, full_name, email, role, status")
    .in("role", ["support", "moderator"])
    .eq("status", "active");

  return NextResponse.json({
    permissions: permissions ?? [],
    staff: staff ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    staff_id: string;
    can_manage_verification_control?: boolean;
    can_enforce_trust?: boolean;
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
    can_manage_verification_control: body.can_manage_verification_control !== false,
    can_enforce_trust: body.can_enforce_trust !== false,
    assigned_by: auth.user.id,
    assigned_at: now,
    assignment_notes: body.assignment_notes?.trim() || null,
    is_active: body.is_active !== false,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("verification_control_permissions")
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
    action: body.is_active === false
      ? "trust.verification.permission.revoke"
      : "trust.verification.permission.grant",
    target_type: "staff",
    target_id: body.staff_id,
    metadata: {
      can_manage_verification_control: payload.can_manage_verification_control,
      can_enforce_trust: payload.can_enforce_trust,
    },
    ip,
  });

  return NextResponse.json({ permission: data });
}
