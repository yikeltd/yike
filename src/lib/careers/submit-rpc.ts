import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationPayload } from "@/lib/careers/scoring";
import { createOtpDbClient } from "@/lib/otp/rpc";

function otpServerToken(): string {
  const t = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function submitCareerApplication(
  jobId: string,
  payload: ApplicationPayload,
  score: number,
  scoreBreakdown: Record<string, number>,
  status: string
): Promise<{ id: string } | null> {
  const client = createOtpDbClient();
  if (!client) return null;

  const { data, error } = await client.rpc("yike_career_submit_application", {
    p_token: otpServerToken(),
    p_job_id: jobId,
    p_full_name: payload.full_name,
    p_email: payload.email,
    p_whatsapp: payload.whatsapp,
    p_address: payload.address ?? "",
    p_city: payload.city,
    p_state: payload.state,
    p_age_range: payload.age_range,
    p_education_level: payload.education_level,
    p_current_occupation: payload.current_occupation,
    p_why_apply: payload.why_apply,
    p_years_experience: payload.years_experience,
    p_cv_url: payload.cv_url ?? "",
    p_facebook: payload.facebook ?? "",
    p_instagram: payload.instagram ?? "",
    p_tiktok: payload.tiktok ?? "",
    p_github: payload.github ?? "",
    p_linkedin: payload.linkedin ?? "",
    p_portfolio: payload.portfolio ?? "",
    p_stack_experience: payload.stack_experience ?? "",
    p_extra_answers: payload.extra_answers,
    p_score: score,
    p_score_breakdown: scoreBreakdown,
    p_status: status,
  });

  if (error) {
    console.error("[careers/rpc] submit failed:", error.message);
    return null;
  }

  const id = typeof data === "string" ? data : String(data ?? "");
  return id ? { id } : null;
}

export async function loadPublishedJobRpc(
  client: SupabaseClient,
  jobId: string,
  jobSlug: string
) {
  if (jobId) {
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data) return data;
  }

  if (jobSlug) {
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .eq("slug", jobSlug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data) return data;
  }

  return null;
}
