import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { FOLLOW_UP_EXPIRY_DAYS } from "@/lib/careers/follow-up/types";
import type { FollowUpQuestion } from "@/lib/careers/follow-up/types";
import { createFollowUpToken } from "@/lib/careers/follow-up/tokens";
import { sendCareerFollowUpEmail } from "@/lib/email/service";

export const runtime = "nodejs";

async function requireAdminApi(request: Request) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();
  if (!profile || profile.is_banned || !isAdmin(profile.role)) return null;
  return {
    supabase,
    userId: user.id,
    profile: { role: profile.role as import("@/types/database").UserRole },
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  };
}

export async function POST(request: Request) {
  const ctx = await requireAdminApi(request);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const applicationId = String(body.applicationId ?? "").trim();
  const questions = body.questions as FollowUpQuestion[] | undefined;
  const saveTemplate = body.saveTemplate === true;
  const templateName = String(body.templateName ?? "").trim();

  if (!applicationId || !questions?.length) {
    return NextResponse.json({ error: "Application and questions required" }, { status: 400 });
  }

  const { data: app } = await ctx.supabase
    .from("job_applications")
    .select("id, job_id, full_name, email, status, jobs(title, category)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const jobRow = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  const jobTitle = (jobRow as { title?: string } | null)?.title ?? "Yike role";
  const jobCategory = (jobRow as { category?: string } | null)?.category ?? null;

  const { raw, hash } = createFollowUpToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + FOLLOW_UP_EXPIRY_DAYS);

  const { data: row, error } = await ctx.supabase
    .from("career_follow_up_requests")
    .insert({
      application_id: applicationId,
      job_id: app.job_id,
      token_hash: hash,
      questions,
      status: "sent",
      sent_by: ctx.userId,
      sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Could not create follow-up" }, { status: 500 });
  }

  if (saveTemplate && templateName) {
    await ctx.supabase.from("career_follow_up_templates").insert({
      name: templateName,
      job_category: jobCategory,
      questions,
      created_by: ctx.userId,
    });
  }

  const admin = (await createVerifiedAdminClient()) ?? createAdminClient();
  if (admin) {
    const followUpUrl = `${SITE_URL}/careers/follow-up/${raw}`;
    const emailResult = await sendCareerFollowUpEmail(admin, {
      requestId: row.id,
      applicantEmail: app.email,
      applicantName: app.full_name,
      jobTitle,
      followUpUrl,
      expiresDays: FOLLOW_UP_EXPIRY_DAYS,
    });
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 500 });
    }
  }

  void writeAuditLogAsync({
    actor_id: ctx.userId,
    actor_role: ctx.profile.role,
    action: "career.follow_up.sent",
    target_type: "job_application",
    target_id: applicationId,
    metadata: {
      follow_up_id: row.id,
      question_count: questions.length,
      template_saved: saveTemplate,
    },
    ip: ctx.ip,
  });

  return NextResponse.json({ ok: true, followUpId: row.id });
}
