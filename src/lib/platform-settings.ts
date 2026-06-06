import { createAdminClient } from "@/lib/supabase/admin";

export type ReviewPublishingMode = "manual_review" | "auto_publish";

export async function getReviewPublishingMode(): Promise<ReviewPublishingMode> {
  const supabase = createAdminClient();
  if (!supabase) return "manual_review";

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "review_publishing_mode")
    .maybeSingle();

  const raw = data?.value;
  if (raw === "auto_publish" || (typeof raw === "string" && raw.includes("auto_publish"))) {
    return "auto_publish";
  }
  return "manual_review";
}

export async function setReviewPublishingMode(
  mode: ReviewPublishingMode,
  updatedBy: string
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database unavailable");

  await supabase.from("platform_settings").upsert({
    key: "review_publishing_mode",
    value: mode,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}
