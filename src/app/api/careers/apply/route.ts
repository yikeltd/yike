import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreApplication, type ApplicationPayload } from "@/lib/careers/scoring";
import type { JobRow } from "@/lib/careers/constants";
import { sendCareerApplicationEmails } from "@/lib/email/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const jobId = String(body.jobId ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const whyApply = String(body.whyApply ?? "").trim();

  if (!jobId || !fullName || !email || !whatsapp || !city || !state || !whyApply) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("status", "published")
    .maybeSingle();

  if (jobError || !job) {
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

  const { score, breakdown, status } = scoreApplication(payload, job as JobRow);

  const { data: application, error } = await admin
    .from("job_applications")
    .insert({
      job_id: jobId,
      ...payload,
      score,
      score_breakdown: breakdown,
      status,
      source: "careers",
    })
    .select("id")
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }

  void sendCareerApplicationEmails(admin, {
    applicationId: application.id,
    applicantEmail: email,
    applicantName: fullName,
    jobTitle: job.title,
    score,
    status,
  });

  return NextResponse.json({ ok: true, applicationId: application.id, score });
}
