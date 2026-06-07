import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportQualityConfig = {
  minImages: number;
  minChars: number;
};

export async function getReportQualityConfig(
  client: SupabaseClient
): Promise<ReportQualityConfig> {
  const { data } = await client
    .from("field_verifier_program_config")
    .select("min_report_images, min_report_chars")
    .eq("id", true)
    .maybeSingle();

  return {
    minImages: Number(data?.min_report_images ?? 3),
    minChars: Number(data?.min_report_chars ?? 80),
  };
}

export function validateReportSubmission(input: {
  inspectionSummary: string;
  uploadedImages: string[];
  propertyFound: boolean;
  propertyAccessible: boolean;
  occupancyStatus?: string | null;
  photoChecklist?: Record<string, boolean>;
  config: ReportQualityConfig;
}): string | null {
  const summary = input.inspectionSummary.trim();
  if (summary.length < input.config.minChars) {
    return `Inspection summary must be at least ${input.config.minChars} characters`;
  }
  if (input.uploadedImages.length < input.config.minImages) {
    return `Upload at least ${input.config.minImages} clear photos`;
  }
  if (!input.occupancyStatus?.trim()) {
    return "Select property occupancy / status observation";
  }
  const checklist = input.photoChecklist ?? {};
  const requiredKeys = ["exterior", "street"];
  const missing = requiredKeys.filter((k) => !checklist[k]);
  if (missing.length) {
    return "Complete the photo checklist (exterior and street view required)";
  }
  return null;
}
