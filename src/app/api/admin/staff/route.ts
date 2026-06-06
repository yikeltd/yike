import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { StaffRole } from "@/types/database";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    full_name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    department?: string;
    responsibilities?: string[];
    password: string;
    admin_pin?: string;
  };

  if (!body.full_name || !body.email || !body.role || !body.password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: body.email.trim(),
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create user" },
      { status: 400 }
    );
  }

  const profileUpdates: Record<string, unknown> = {
    full_name: body.full_name,
    email: body.email.trim(),
    phone: body.phone ?? null,
    role: body.role,
  };

  if (body.admin_pin && /^\d{6}$/.test(body.admin_pin)) {
    profileUpdates.admin_pin_hash = hashPin(body.admin_pin);
  }

  await supabase.from("profiles").update(profileUpdates).eq("id", authUser.user.id);

  await supabase.from("staff_profiles").insert({
    id: authUser.user.id,
    full_name: body.full_name,
    email: body.email.trim(),
    phone: body.phone ?? null,
    role: body.role,
    department: body.department ?? null,
    responsibilities: body.responsibilities ?? [],
    created_by: auth.user.id,
  });

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.create",
    target_type: "staff",
    target_id: authUser.user.id,
    metadata: { email: body.email, role: body.role },
    ip,
  });

  return NextResponse.json({ ok: true, id: authUser.user.id });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    id: string;
    action: "disable" | "enable" | "reset_password";
    password?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "disable") {
    await supabase
      .from("staff_profiles")
      .update({ status: "disabled", disabled_at: new Date().toISOString() })
      .eq("id", body.id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.disable",
      target_type: "staff",
      target_id: body.id,
      ip,
    });
  } else if (body.action === "enable") {
    await supabase
      .from("staff_profiles")
      .update({ status: "active", disabled_at: null })
      .eq("id", body.id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.enable",
      target_type: "staff",
      target_id: body.id,
      ip,
    });
  } else if (body.action === "reset_password" && body.password) {
    await supabase.auth.admin.updateUserById(body.id, { password: body.password });
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.reset_password",
      target_type: "staff",
      target_id: body.id,
      ip,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  await supabase.from("staff_profiles").delete().eq("id", id);
  await supabase.auth.admin.deleteUser(id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.delete",
    target_type: "staff",
    target_id: id,
    ip,
  });

  return NextResponse.json({ ok: true });
}
