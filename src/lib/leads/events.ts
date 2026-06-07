import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadEventType } from "./operations-types";

export async function logLeadEvent(input: {
  leadId: string;
  type: LeadEventType | string;
  actorId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin.from("lead_events").insert({
    lead_id: input.leadId,
    type: input.type,
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.warn("[leads/events] insert failed:", error.message);
    return false;
  }
  return true;
}

export async function getLeadEvents(leadId: string) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from("lead_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
