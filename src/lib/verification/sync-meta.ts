import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerificationControlConfig } from "./config";
import { deriveVerificationState } from "./status-states";
import {
  getRequiredVerificationTasks,
  serializeRequiredTasks,
} from "./tasks";
import type { TrustProfileSlice } from "./levels";

/** Keep verification_state + required tasks in sync after trust changes. */
export async function syncProfileVerificationMeta(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: profile } = await client.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return;

  const config = await getVerificationControlConfig(client);
  const slice = profile as TrustProfileSlice;
  const state = deriveVerificationState(slice);
  const tasks = getRequiredVerificationTasks(slice, config);

  await client
    .from("profiles")
    .update({
      verification_state: state,
      required_verification_tasks: serializeRequiredTasks(tasks),
    })
    .eq("id", userId);
}
