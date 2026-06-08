import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  DEFAULT_YIKE_STAFF_LOGIN_URL,
  DEFAULT_ZOHO_MAIL_LOGIN_URL,
  getOnboardingRoleOption,
} from "@/lib/admin/staff-onboarding/constants";
import type { OnboardingRoleKey } from "@/lib/admin/staff-onboarding/constants";
import {
  isValidWorkEmail,
  normalizeWorkEmail,
} from "@/lib/admin/staff-onboarding/validate";
import { sendStaffOnboardingEmail } from "@/lib/email/service";
import type { StaffWorkArea } from "@/lib/admin/staff-work-areas";
import { STAFF_WORK_AREA_LABELS } from "@/lib/admin/staff-work-areas";

export const runtime = "nodejs";

type Body = {
  application_id: string;
  onboarding_role: OnboardingRoleKey;
  department?: string;
  supervisor_id?: string | null;
  work_email: string;
  zoho_temp_password: string;
  yike_login_email: string;
  yike_temp_password: string;
  yike_login_url?: string;
  zoho_login_url?: string;
  welcome_note?: string;
  instructions?: string;
  admin_pin?: string;
};

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as Body;

  if (!body.application_id || !body.yike_temp_password || !body.zoho_temp_password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const workEmail = normalizeWorkEmail(body.work_email ?? "");
  const yikeLoginEmail = body.yike_login_email?.trim().toLowerCase() ?? "";

  if (!isValidWorkEmail(workEmail)) {
    return NextResponse.json(
      { error: "Work email must be a valid @yike.ng address" },
      { status: 400 }
    );
  }

  if (!yikeLoginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yikeLoginEmail)) {
    return NextResponse.json({ error: "Invalid Yike login email" }, { status: 400 });
  }

  if (body.yike_temp_password.length < 8) {
    return NextResponse.json(
      { error: "Yike login password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existingWorkEmail } = await supabase
    .from("staff_profiles")
    .select("id")
    .ilike("work_email", workEmail)
    .maybeSingle();

  if (existingWorkEmail) {
    return NextResponse.json(
      { error: "This work email is already assigned to another staff member" },
      { status: 409 }
    );
  }

  const { data: app } = await supabase
    .from("job_applications")
    .select("*, jobs(title, department, category)")
    .eq("id", body.application_id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const roleOpt = getOnboardingRoleOption(body.onboarding_role);
  const department =
    body.department?.trim() || roleOpt.defaultDepartment || app.jobs?.department || null;
  const responsibilities = roleOpt.workAreas as string[];
  const yikeLoginUrl = body.yike_login_url?.trim() || DEFAULT_YIKE_STAFF_LOGIN_URL;
  const zohoLoginUrl = body.zoho_login_url?.trim() || DEFAULT_ZOHO_MAIL_LOGIN_URL;

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: yikeLoginEmail,
    password: body.yike_temp_password,
    email_confirm: true,
    user_metadata: { full_name: app.full_name },
  });

  if (authError || !authUser.user) {
    const msg = authError?.message ?? "Failed to create user";
    if (msg.toLowerCase().includes("already")) {
      return NextResponse.json(
        { error: "A Yike account with this login email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const staffId = authUser.user.id;
  const now = new Date().toISOString();

  const profileUpdates: Record<string, unknown> = {
    full_name: app.full_name,
    email: yikeLoginEmail,
    phone: app.whatsapp ?? null,
    role: roleOpt.staffRole,
  };

  if (body.admin_pin && /^\d{6}$/.test(body.admin_pin)) {
    profileUpdates.admin_pin_hash = hashPin(body.admin_pin);
  }

  await supabase.from("profiles").update(profileUpdates).eq("id", staffId);

  await supabase.from("staff_profiles").insert({
    id: staffId,
    full_name: app.full_name,
    email: yikeLoginEmail,
    phone: app.whatsapp ?? null,
    role: roleOpt.staffRole,
    department,
    responsibilities,
    work_email: workEmail,
    onboarding_note: body.welcome_note?.trim() || null,
    onboarding_instructions: body.instructions?.trim() || null,
    onboarding_sent_at: now,
    onboarded_by: auth.user.id,
    supervisor_id: body.supervisor_id || null,
    application_id: body.application_id,
    onboarding_role_label: roleOpt.label,
    created_by: auth.user.id,
  });

  for (const workArea of roleOpt.workAreas) {
    await supabase.from("staff_work_assignments").upsert(
      {
        staff_id: staffId,
        work_area: workArea,
        assigned_by: auth.user.id,
        assigned_at: now,
        priority: 0,
        is_active: true,
        updated_at: now,
      },
      { onConflict: "staff_id,work_area" }
    );
  }

  await supabase
    .from("job_applications")
    .update({
      status: "approved",
      updated_at: now,
    })
    .eq("id", body.application_id);

  await supabase.from("application_notes").insert({
    application_id: body.application_id,
    admin_id: auth.user.id,
    note: `Onboarded as ${roleOpt.label} · work email ${workEmail}`,
  });

  const mailAdmin = (await createVerifiedAdminClient()) ?? supabase;
  const emailResult = await sendStaffOnboardingEmail(mailAdmin, {
    staffId,
    toEmail: workEmail,
    ccEmail: yikeLoginEmail !== workEmail ? yikeLoginEmail : undefined,
    fullName: app.full_name,
    roleLabel: roleOpt.label,
    department: department ?? roleOpt.defaultDepartment,
    welcomeNote: body.welcome_note,
    yikeLoginEmail,
    yikeTempPassword: body.yike_temp_password,
    yikeLoginUrl,
    workEmail,
    zohoTempPassword: body.zoho_temp_password,
    zohoLoginUrl,
    instructions: body.instructions,
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      {
        error: emailResult.error,
        partial: true,
        id: staffId,
        message: "Staff account created but onboarding email failed to send. Resend from staff settings.",
      },
      { status: 502 }
    );
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.from_application",
    target_type: "staff",
    target_id: staffId,
    metadata: {
      application_id: body.application_id,
      role: roleOpt.staffRole,
      onboarding_role: body.onboarding_role,
      work_email: workEmail,
      yike_login_email: yikeLoginEmail,
      work_areas: roleOpt.workAreas,
    },
    ip,
  });

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.onboarding.sent",
    target_type: "staff",
    target_id: staffId,
    metadata: {
      application_id: body.application_id,
      work_email: workEmail,
      department,
    },
    ip,
  });

  const accessSummary = roleOpt.workAreas.map(
    (a) => STAFF_WORK_AREA_LABELS[a as StaffWorkArea]
  );

  return NextResponse.json({
    ok: true,
    id: staffId,
    work_email: workEmail,
    access_summary: accessSummary,
  });
}
