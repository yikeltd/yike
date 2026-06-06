import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { scoreApplication, type ApplicationPayload } from "@/lib/careers/scoring";
import type { JobRow } from "@/lib/careers/constants";
import { sendCareerApplicationEmails } from "@/lib/email/service";

export const runtime = "nodejs";

async function loadPublishedJob(
  supabase: NonNullable<ReturnType<typeof createPublicClient>>,
  jobId: string,
  jobSlug: string
): Promise<{ job: JobRow | null; error: string | null }> {
  if (jobId) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("status", "published")
      .maybeSingle();

    if (error) return { job: null, error: error.message };
    if (data) return { job: data as JobRow, error: null };
  }

  if (jobSlug) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("slug", jobSlug)
      .eq("status", "published")
      .maybeSingle();

    if (error) return { job: null, error: error.message };
    return { job: (data as JobRow | null) ?? null, error: null };
  }

  return { job: null, error: null };
}

export async function POST(request: Request) {
  const supabase = createPublicClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const jobId = String(body.jobId ?? "").trim();
  const jobSlug = String(body.jobSlug ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const whyApply = String(body.whyApply ?? "").trim();

  if ((!jobId && !jobSlug) || !fullName || !email || !whatsapp || !city || !state || !whyApply) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { job, error: jobError } = await loadPublishedJob(supabase, jobId, jobSlug);

  if (jobError) {
    console.error("[careers/apply] job lookup failed:", jobError);
    return NextResponse.json({ error: "Could not verify this role" }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Role not found or closed" }, { status: 404 });
  }

  const payload: ApplicationPayload = {
    full_name: fullName,
    email,
    whatsapp,
    address: String(body.address ?? "").trim() || null,
    city,
    state,
    age_range: String(body.ageRange ?? "").trim(),
    education_level: String(body.educationLevel ?? "").trim(),
    current_occupation: String(body.currentOccupation ?? "").trim(),
    why_apply: whyApply,
    years_experience: Math.max(0, Number(body.yearsExperience) || 0),
    cv_url: String(body.cvUrl ?? "").trim() || null,
    facebook: String(body.facebook ?? "").trim() || null,
    instagram: String(body.instagram ?? "").trim() || null,
    tiktok: String(body.tiktok ?? "").trim() || null,
    github: String(body.github ?? "").trim() || null,
    linkedin: String(body.linkedin ?? "").trim() || null,
    portfolio: String(body.portfolio ?? "").trim() || null,
    stack_experience: String(body.stackExperience ?? "").trim() || null,
    extra_answers: (body.extraAnswers as Record<string, string>) ?? {},
  };

  const { score, breakdown, status } = scoreApplication(payload, job);

  const { data: application, error } = await supabase
    .from("job_applications")
    .insert({
      job_id: job.id,
      ...payload,
      score,
      score_breakdown: breakdown,
      status,
      source: "careers",
    })
    .select("id")
    .single();

  if (error || !application) {
    console.error("[careers/apply] insert failed:", error?.message);
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }

  const admin = createAdminClient();
  if (admin) {
    void sendCareerApplicationEmails(admin, {
      applicationId: application.id,
      applicantEmail: email,
      applicantName: fullName,
      jobTitle: job.title,
      score,
      status,
    });
  }

  return NextResponse.json({ ok: true, applicationId: application.id, score });
}
