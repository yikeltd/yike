import type { SupabaseClient } from "@supabase/supabase-js";

export async function logStaffOnboardingEvent(
  supabase: SupabaseClient,
  input: {
    staff_id: string;
    event_type: string;
    actor_id?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("staff_onboarding_events").insert({
    staff_id: input.staff_id,
    event_type: input.event_type,
    actor_id: input.actor_id ?? null,
    metadata: input.metadata ?? {},
  });
}
