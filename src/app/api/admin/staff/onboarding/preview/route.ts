import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import {
  DEFAULT_YIKE_STAFF_LOGIN_URL,
  DEFAULT_ZOHO_MAIL_LOGIN_URL,
  getOnboardingRoleOption,
} from "@/lib/admin/staff-onboarding/constants";
import type { OnboardingRoleKey } from "@/lib/admin/staff-onboarding/constants";
import {
  buildStaffOnboardingEmailHtml,
  staffOnboardingEmailSubject,
} from "@/lib/email/templates/staff-onboarding";
import { finalizeTransactionalEmailHtml } from "@/lib/email/finalize-html";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    full_name?: string;
    job_title?: string;
    onboarding_role?: OnboardingRoleKey;
    department?: string;
    work_email?: string;
    zoho_temp_password?: string;
    yike_login_email?: string;
    yike_temp_password?: string;
    yike_login_url?: string;
    zoho_login_url?: string;
    welcome_note?: string;
    instructions?: string;
  };

  const roleOpt = getOnboardingRoleOption(body.onboarding_role ?? "support");

  const html = buildStaffOnboardingEmailHtml({
    fullName: body.full_name ?? "Team member",
    roleLabel: roleOpt.label,
    department: body.department?.trim() || roleOpt.defaultDepartment,
    welcomeNote: body.welcome_note,
    yikeLoginEmail: body.yike_login_email?.trim() ?? "",
    yikeTempPassword: body.yike_temp_password ?? "••••••••",
    yikeLoginUrl: body.yike_login_url?.trim() || DEFAULT_YIKE_STAFF_LOGIN_URL,
    workEmail: body.work_email?.trim() ?? "",
    zohoTempPassword: body.zoho_temp_password ?? "••••••••",
    zohoLoginUrl: body.zoho_login_url?.trim() || DEFAULT_ZOHO_MAIL_LOGIN_URL,
    instructions: body.instructions,
  });

  const admin = createAdminClient();
  const finalHtml = admin
    ? await finalizeTransactionalEmailHtml(html, { includeAd: false, admin })
    : html;

  return NextResponse.json({
    ok: true,
    subject: staffOnboardingEmailSubject(),
    html: finalHtml,
  });
}
