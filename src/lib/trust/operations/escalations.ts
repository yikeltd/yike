import type { SupabaseClient } from "@supabase/supabase-js";

function escalationRef(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TES-${n}`;
}

export async function createTrustEscalation(
  client: SupabaseClient,
  params: {
    sourceCaseType: string;
    sourceCaseId: string;
    sourceReference?: string | null;
    escalationType: string;
    reason: string;
    priority?: string;
    requestedActions?: string[];
    openedBy: string;
    adminNotes?: string;
  }
): Promise<{ id: string; reference: string } | null> {
  let ref = escalationRef();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await client
      .from("trust_escalations")
      .select("id")
      .eq("escalation_reference", ref)
      .maybeSingle();
    if (!clash) break;
    ref = escalationRef();
  }

  const { data, error } = await client
    .from("trust_escalations")
    .insert({
      escalation_reference: ref,
      source_case_type: params.sourceCaseType,
      source_case_id: params.sourceCaseId,
      source_reference: params.sourceReference ?? null,
      escalation_type: params.escalationType,
      priority: params.priority ?? "normal",
      reason: params.reason,
      requested_actions: params.requestedActions ?? [],
      opened_by: params.openedBy,
      admin_notes: params.adminNotes ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id as string, reference: ref };
}

export function disputeRef(): string {
  return `TDS-${Math.floor(100000 + Math.random() * 900000)}`;
}
