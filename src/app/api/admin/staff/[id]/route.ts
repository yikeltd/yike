import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { sendStaffOnboardingEmail } from "@/lib/email/service";
import {
  DEFAULT_YIKE_STAFF_LOGIN_URL,
  DEFAULT_ZOHO_MAIL_LOGIN_URL,
} from "@/lib/admin/staff-onboarding/constants";
import { logStaffOnboardingEvent } from "@/lib/admin/staff-onboarding/events";
import { statusAfterOnboardingSend } from "@/lib/admin/staff-onboarding/status";
import { isValidWorkEmail, normalizeWorkEmail } from "@/lib/admin/staff-onboarding/validate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: staff, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const [{ data: events }, { data: onboardedBy }] = await Promise.all([
    supabase
      .from("staff_onboarding_events")
      .select("*, profiles:actor_id(full_name)")
      .eq("staff_id", id)
      .order("created_at", { ascending: false }),
    staff.onboarded_by
      ? supabase.from("profiles").select("full_name").eq("id", staff.onboarded_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    staff,
    onboarded_by_name: onboardedBy?.full_name ?? null,
    events: (events ?? []).map((e) => ({
      ...e,
      actor_name:
        (e as { profiles?: { full_name?: string } }).profiles?.full_name ?? null,
    })),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    action:
      | "suspend"
      | "archive"
      | "reactivate"
      | "change_role"
      | "update_internal_notes"
      | "deactivate_onboarding"
      | "reset_password";
    role?: string;
    internal_notes?: string;
    password?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: staff } = await supabase.from("staff_profiles").select("*").eq("id", id).single();
  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const now = new Date().toISOString();

  if (body.action === "suspend") {
    await supabase
      .from("staff_profiles")
      .update({ status: "suspended", disabled_at: now })
      .eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.suspend",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      ip,
    });
  } else if (body.action === "archive") {
    await supabase
      .from("staff_profiles")
      .update({ status: "archived", archived_at: now, disabled_at: now })
      .eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.archive",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      ip,
    });
  } else if (body.action === "reactivate") {
    await supabase
      .from("staff_profiles")
      .update({ status: "active", disabled_at: null, archived_at: null })
      .eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.reactivate",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      ip,
    });
  } else if (body.action === "change_role" && body.role) {
    const previousRole = staff.role;
    await supabase.from("staff_profiles").update({ role: body.role }).eq("id", id);
    await supabase.from("profiles").update({ role: body.role }).eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.role.changed",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      metadata: { from_role: previousRole, to_role: body.role },
      ip,
    });
    await logStaffOnboardingEvent(supabase, {
      staff_id: id,
      event_type: "role_changed",
      actor_id: auth.user.id,
      metadata: { from_role: previousRole, to_role: body.role },
    });
  } else if (body.action === "update_internal_notes") {
    await supabase
      .from("staff_profiles")
      .update({ internal_notes: body.internal_notes?.trim() || null })
      .eq("id", id);
  } else if (body.action === "deactivate_onboarding") {
    await supabase
      .from("staff_profiles")
      .update({ status: "onboarding_pending" })
      .eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.onboarding.deactivated",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      ip,
    });
  } else if (body.action === "reset_password" && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    await supabase.auth.admin.updateUserById(id, { password: body.password });
    await supabase
      .from("staff_profiles")
      .update({
        require_password_reset: true,
        password_reset_completed_at: null,
        status: staff.status === "active" ? "first_login_pending" : staff.status,
      })
      .eq("id", id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "staff.reset_password",
      target_type: "staff",
      target_id: id,
      target_user_name: staff.full_name,
      ip,
    });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    action: "resend_onboarding";
    zoho_temp_password: string;
    yike_temp_password: string;
    yike_login_url?: string;
    zoho_login_url?: string;
  };

  if (body.action !== "resend_onboarding") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!body.zoho_temp_password || !body.yike_temp_password) {
    return NextResponse.json({ error: "Temporary passwords required for resend" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: staff } = await supabase.from("staff_profiles").select("*").eq("id", id).single();
  if (!staff?.work_email) {
    return NextResponse.json({ error: "Staff profile missing work email" }, { status: 400 });
  }

  const workEmail = normalizeWorkEmail(staff.work_email);
  if (!isValidWorkEmail(workEmail)) {
    return NextResponse.json({ error: "Invalid work email on profile" }, { status: 400 });
  }

  const yikeLoginUrl = body.yike_login_url?.trim() || DEFAULT_YIKE_STAFF_LOGIN_URL;
  const zohoLoginUrl = body.zoho_login_url?.trim() || DEFAULT_ZOHO_MAIL_LOGIN_URL;
  const requirePasswordReset = staff.require_password_reset !== false;
  const now = new Date().toISOString();

  const mailAdmin = (await createVerifiedAdminClient()) ?? supabase;
  const emailResult = await sendStaffOnboardingEmail(mailAdmin, {
    staffId: id,
    toEmail: workEmail,
    ccEmail: staff.email !== workEmail ? staff.email : undefined,
    fullName: staff.full_name,
    roleLabel: staff.onboarding_role_label ?? staff.role.replace("_", " "),
    department: staff.department ?? undefined,
    welcomeNote: staff.onboarding_note ?? undefined,
    yikeLoginEmail: staff.email,
    yikeTempPassword: body.yike_temp_password,
    yikeLoginUrl,
    workEmail,
    zohoTempPassword: body.zoho_temp_password,
    zohoLoginUrl,
    instructions: staff.onboarding_instructions ?? undefined,
  });

  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 502 });
  }

  const lifecycleStatus = statusAfterOnboardingSend(requirePasswordReset);
  await supabase
    .from("staff_profiles")
    .update({ onboarding_sent_at: now, status: lifecycleStatus })
    .eq("id", id);

  await logStaffOnboardingEvent(supabase, {
    staff_id: id,
    event_type: "onboarding_resent",
    actor_id: auth.user.id,
    metadata: { work_email: workEmail },
  });

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "staff.onboarding.resent",
    target_type: "staff",
    target_id: id,
    target_user_name: staff.full_name,
    metadata: { work_email: workEmail },
    ip,
  });

  return NextResponse.json({ ok: true });
}
