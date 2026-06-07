import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineEventType, TrustCaseType } from "./constants";

export type TimelineEntry = {
  caseType: TrustCaseType;
  caseId: string;
  caseReference?: string | null;
  eventType: TimelineEventType;
  title: string;
  detail?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, unknown>;
};

export async function appendTrustTimeline(
  client: SupabaseClient,
  entry: TimelineEntry
): Promise<void> {
  await client.from("trust_case_timeline").insert({
    case_type: entry.caseType,
    case_id: entry.caseId,
    case_reference: entry.caseReference ?? null,
    event_type: entry.eventType,
    title: entry.title,
    detail: entry.detail ?? null,
    actor_id: entry.actorId ?? null,
    actor_role: entry.actorRole ?? null,
    metadata: entry.metadata ?? {},
  });
}

export async function getTrustTimeline(
  client: SupabaseClient,
  caseType: TrustCaseType,
  caseId: string,
  limit = 50
) {
  const { data } = await client
    .from("trust_case_timeline")
    .select("*")
    .eq("case_type", caseType)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
