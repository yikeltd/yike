import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerificationPriority } from "./constants";

export async function createStaffOpsAlert(
  client: SupabaseClient,
  params: {
    alertType: string;
    title: string;
    body: string;
    referenceType?: string;
    referenceId?: string;
    priority?: VerificationPriority;
  }
): Promise<void> {
  await client.from("staff_ops_alerts").insert({
    alert_type: params.alertType,
    title: params.title,
    body: params.body,
    reference_type: params.referenceType ?? null,
    reference_id: params.referenceId ?? null,
    priority: params.priority ?? "normal",
  });
}
