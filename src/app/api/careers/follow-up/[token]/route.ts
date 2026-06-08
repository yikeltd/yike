import { NextResponse } from "next/server";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";
import { hashFollowUpToken } from "@/lib/careers/follow-up/tokens";
import { submitFollowUpRpc } from "@/lib/careers/follow-up/submit-rpc";
import { scoreFollowUpResponses } from "@/lib/careers/follow-up/generate-questions";
import type { FollowUpQuestion } from "@/lib/careers/follow-up/types";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { sendAdminAlert } from "@/lib/email/service";
import { getAdminAlertInbox } from "@/lib/email/admin-inbox";
import { adminPath } from "@/lib/admin-paths";

export const runtime = "nodejs";

type Props = { params: Promise<{ token: string }> };

async function getAdminReader() {
  return (await createVerifiedAdminClient()) ?? createAdminClient();
}

async function loadByToken(rawToken: string) {
  const admin = await getAdminReader();
  if (!admin) return null;

  const hash = hashFollowUpToken(rawToken);
  const { data } = await admin
    .from("career_follow_up_requests")
    .select(
      "id, application_id, job_id, questions, answers, status, expires_at, submitted_at, opened_at, job_applications(full_name), jobs(title)"
    )
    .eq("token_hash", hash)
    .maybeSingle();

  if (!data) return null;

  if (
    data.status === "sent" &&
    (!data.opened_at || data.opened_at === null)
  ) {
    await admin
      .from("career_follow_up_requests")
      .update({
        status: "opened",
        opened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }

  if (
    data.expires_at &&
    new Date(data.expires_at) < new Date() &&
    data.status !== "submitted"
  ) {
    await admin
      .from("career_follow_up_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ...data, status: "expired" as const };
  }

  return data;
}

export async function GET(_request: Request, { params }: Props) {
  const { token } = await params;
  const raw = token?.trim();
  if (!raw) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const row = await loadByToken(raw);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const app = row.job_applications as { full_name: string } | { full_name: string }[] | null;
  const job = row.jobs as { title: string } | { title: string }[] | null;
  const applicant = Array.isArray(app) ? app[0] : app;
  const jobInfo = Array.isArray(job) ? job[0] : job;

  return NextResponse.json({
    ok: true,
    requestId: row.id,
    applicantName: applicant?.full_name ?? "",
    jobTitle: jobInfo?.title ?? "Yike role",
    questions: row.questions as FollowUpQuestion[],
    status: row.status,
    expiresAt: row.expires_at,
    submitted: row.status === "submitted",
  });
}

export async function POST(request: Request, { params }: Props) {
  const { token } = await params;
  const raw = token?.trim();
  if (!raw) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const answers = body.answers as Record<string, string> | undefined;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Answers required" }, { status: 400 });
  }

  const admin = await getAdminReader();
  if (!admin) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const hash = hashFollowUpToken(raw);
  const { data: row } = await admin
    .from("career_follow_up_requests")
    .select("id, application_id, questions, status, expires_at")
    .eq("token_hash", hash)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (row.status === "submitted") {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const questions = row.questions as FollowUpQuestion[];
  for (const q of questions) {
    if (q.required !== false && !String(answers[q.id] ?? "").trim()) {
      return NextResponse.json(
        { error: "Please answer all required questions" },
        { status: 400 }
      );
    }
  }

  const result = await submitFollowUpRpc(row.id, hash, answers);
  if (!result.ok) {
    const status =
      result.error === "expired"
        ? 410
        : result.error === "already_submitted"
          ? 409
          : result.error === "not_found"
            ? 404
            : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  const scored = scoreFollowUpResponses(questions, answers);
  await admin
    .from("career_follow_up_requests")
    .update({
      response_score: scored.score,
      recommendation: scored.recommendation,
      red_flags: scored.redFlags,
      strengths: scored.strengths,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  void writeAuditLogAsync({
    actor_id: row.application_id,
    actor_role: "user" as import("@/types/database").UserRole,
    action: "career.follow_up.submitted",
    target_type: "career_follow_up_request",
    target_id: row.id,
    metadata: {
      application_id: row.application_id,
      recommendation: scored.recommendation,
      overall: scored.score.overall,
    },
  });

  void sendAdminAlert(admin, {
    to: getAdminAlertInbox(),
    subject: "Career follow-up submitted",
    body: `An applicant submitted their follow-up questionnaire.\n\nReview: ${adminPath("careers/applications")}`,
  });

  return NextResponse.json({ ok: true });
}
