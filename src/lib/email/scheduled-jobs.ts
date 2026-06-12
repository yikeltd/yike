import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFounderWelcomeEmail } from "@/lib/email/service";

export const FOUNDER_WELCOME_TEMPLATE_KEY = "founder_welcome";
export const FOUNDER_WELCOME_DELAY_MS = 6 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

type ScheduledEmailJobRow = {
  id: string;
  user_id: string;
  email: string;
  template_key: string;
  scheduled_for: string;
  sent_at: string | null;
  failed_at: string | null;
  attempts: number;
  last_error: string | null;
};

export async function scheduleFounderWelcomeEmail(
  admin: SupabaseClient,
  params: {
    userId: string;
    email: string;
    scheduledFor?: Date;
  }
): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("welcome_email_sent_at, is_banned")
    .eq("id", params.userId)
    .maybeSingle();

  if (profile?.is_banned || profile?.welcome_email_sent_at) return;

  const scheduledFor =
    params.scheduledFor ?? new Date(Date.now() + FOUNDER_WELCOME_DELAY_MS);

  const { error } = await admin.from("scheduled_email_jobs").upsert(
    {
      user_id: params.userId,
      email,
      template_key: FOUNDER_WELCOME_TEMPLATE_KEY,
      scheduled_for: scheduledFor.toISOString(),
      sent_at: null,
      failed_at: null,
      attempts: 0,
      last_error: null,
    },
    { onConflict: "user_id,template_key", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[scheduled-email] founder welcome schedule failed:", {
      userId: params.userId,
      message: error.message,
    });
  }
}

async function markJobSent(
  admin: SupabaseClient,
  jobId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("scheduled_email_jobs")
      .update({ sent_at: now, last_error: null })
      .eq("id", jobId),
    admin
      .from("profiles")
      .update({ welcome_email_sent_at: now })
      .eq("id", userId),
  ]);
}

async function markJobFailed(
  admin: SupabaseClient,
  job: ScheduledEmailJobRow,
  errorMessage: string
): Promise<void> {
  const attempts = (job.attempts ?? 0) + 1;
  const patch: Record<string, unknown> = {
    attempts,
    last_error: errorMessage.slice(0, 500),
  };
  if (attempts >= MAX_ATTEMPTS) {
    patch.failed_at = new Date().toISOString();
  }

  await admin.from("scheduled_email_jobs").update(patch).eq("id", job.id);
}

async function processFounderWelcomeJob(
  admin: SupabaseClient,
  job: ScheduledEmailJobRow
): Promise<"sent" | "failed" | "skipped"> {
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username, is_banned, welcome_email_sent_at, email")
    .eq("id", job.user_id)
    .maybeSingle();

  if (!profile || profile.is_banned) {
    await admin
      .from("scheduled_email_jobs")
      .update({
        failed_at: new Date().toISOString(),
        last_error: "user_unavailable",
      })
      .eq("id", job.id);
    return "skipped";
  }

  if (profile.welcome_email_sent_at) {
    await admin
      .from("scheduled_email_jobs")
      .update({ sent_at: profile.welcome_email_sent_at })
      .eq("id", job.id);
    return "skipped";
  }

  const email = (profile.email ?? job.email).trim().toLowerCase();
  if (!email) {
    await markJobFailed(admin, job, "missing_email");
    return "failed";
  }

  const result = await sendFounderWelcomeEmail(admin, {
    email,
    fullName: profile.full_name,
    username: profile.username,
    userId: job.user_id,
  });

  if (!result.ok) {
    await markJobFailed(admin, job, result.error);
    return "failed";
  }

  await markJobSent(admin, job.id, job.user_id);
  return "sent";
}

export async function processDueScheduledEmails(admin: SupabaseClient): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  const { data: jobs, error } = await admin
    .from("scheduled_email_jobs")
    .select("*")
    .is("sent_at", null)
    .is("failed_at", null)
    .lte("scheduled_for", now)
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[scheduled-email] load due jobs failed:", error.message);
    return { processed: 0, sent: 0, failed: 0 };
  }

  const rows = (jobs ?? []) as ScheduledEmailJobRow[];
  let sent = 0;
  let failed = 0;

  for (const job of rows) {
    if (job.template_key === FOUNDER_WELCOME_TEMPLATE_KEY) {
      const outcome = await processFounderWelcomeJob(admin, job);
      if (outcome === "sent") sent += 1;
      else if (outcome === "failed") failed += 1;
      continue;
    }

    console.warn("[scheduled-email] unknown template_key:", job.template_key);
    await markJobFailed(admin, job, `unknown_template:${job.template_key}`);
    failed += 1;
  }

  return { processed: rows.length, sent, failed };
}
