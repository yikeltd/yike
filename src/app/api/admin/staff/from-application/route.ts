import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { StaffRole } from "@/types/database";

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
    application_id: string;
    role: StaffRole;
    department?: string;
    responsibilities?: string[];
    password: string;
    admin_pin?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: app } = await supabase
    .from("job_applications")
    .select("*, jobs(title, department, category)")
    .eq("id", body.application_id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: app.email.trim(),
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: app.full_name },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create user" },
      { status: 400 }
    );
  }

  const profileUpdates: Record<string, unknown> = {
    full_name: app.full_name,
    email: app.email.trim(),
    phone: app.whatsapp ?? null,
    role: body.role,
  };

  if (body.admin_pin && /^\d{6}$/.test(body.admin_pin)) {
    profileUpdates.admin_pin_hash = hashPin(body.admin_pin);
  }

  await supabase.from("profiles").update(profileUpdates).eq("id", authUser.user.id);

  await supabase.from("staff_profiles").insert({
    id: authUser.user.id,
    full_name: app.full_name,
    email: app.email.trim(),
    phone: app.whatsapp ?? null,
    role: body.role,
    department: body.department ?? app.jobs?.department ?? app.jobs?.category ?? null,
    responsibilities: body.responsibilities ?? [],
    created_by: auth.user.id,
  });

  await supabase
    .from("job_applications")
    .update({ status: "approved", note: "Converted to staff account" })
    .eq("id", body.application_id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.from_application",
    target_type: "staff",
    target_id: authUser.user.id,
    metadata: { application_id: body.application_id, role: body.role },
    ip,
  });

  return NextResponse.json({ ok: true, id: authUser.user.id });
}
