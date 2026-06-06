import { NextResponse } from "next/server";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { loadPublishedJobRpc, submitCareerApplication } from "@/lib/careers/submit-rpc";
import { scoreApplication, type ApplicationPayload } from "@/lib/careers/scoring";
import type { JobRow } from "@/lib/careers/constants";
import { sendCareerApplicationEmails } from "@/lib/email/service";
import { createOtpDbClient } from "@/lib/otp/rpc";

export const runtime = "nodejs";

async function loadPublishedJob(
  jobId: string,
  jobSlug: string
): Promise<JobRow | null> {
  const readers = [
    createOtpDbClient(),
    createPublicClient(),
    (await createVerifiedAdminClient()) ?? createAdminClient(),
  ].filter(Boolean) as NonNullable<
    ReturnType<typeof createPublicClient> | ReturnType<typeof createOtpDbClient>
  >[];

  for (const client of readers) {
    const job = await loadPublishedJobRpc(client, jobId, jobSlug);
    if (job) return job as JobRow;
  }

  return null;
}

export async function POST(request: Request) {
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

  const job = await loadPublishedJob(jobId, jobSlug);
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

  const application = await submitCareerApplication(
    job.id,
    payload,
    score,
    breakdown,
    status
  );

  if (!application) {
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }

  const admin = (await createVerifiedAdminClient()) ?? createAdminClient();
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
