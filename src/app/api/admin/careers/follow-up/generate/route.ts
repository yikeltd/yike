import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import type { RoleCategory } from "@/lib/careers/constants";
import { generateFollowUpQuestions } from "@/lib/careers/follow-up/generate-questions";
import type { FollowUpQuestion } from "@/lib/careers/follow-up/types";

export const runtime = "nodejs";
/** Prefer client-side `generateFollowUpQuestions` — this route is for API/tools only. */
export const maxDuration = 15;

async function requireAdminApi() {
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
  return { supabase, userId: user.id };
}

export async function POST(request: Request) {
  const ctx = await requireAdminApi();
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
  if (!applicationId) {
    return NextResponse.json({ error: "Application id required" }, { status: 400 });
  }

  const { data: app } = await ctx.supabase
    .from("job_applications")
    .select("*, jobs(title, category, department, requirements)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const jobRow = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  const job = jobRow as {
    title: string;
    category: RoleCategory;
    department: string;
    requirements: string;
  };

  const questions: FollowUpQuestion[] =
    Array.isArray(body.questions) && body.questions.length > 0
      ? (body.questions as FollowUpQuestion[])
      : generateFollowUpQuestions({
          jobTitle: job.title,
          jobCategory: job.category,
          department: job.department,
          requirements: job.requirements,
          application: {
            full_name: app.full_name,
            why_apply: app.why_apply,
            years_experience: app.years_experience,
            current_occupation: app.current_occupation,
            extra_answers: (app.extra_answers ?? {}) as Record<string, string>,
            portfolio: app.portfolio,
            linkedin: app.linkedin,
          },
        });

  return NextResponse.json({
    ok: true,
    applicationId,
    applicantName: app.full_name,
    applicantEmail: app.email,
    jobTitle: job.title,
    questions,
  });
}
