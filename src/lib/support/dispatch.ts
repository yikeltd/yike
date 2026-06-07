import type { SupabaseClient } from "@supabase/supabase-js";
import { logLeadEvent } from "@/lib/leads/events";

/**
 * Round-robin assign the next active support worker.
 * Uses DB function for atomic cursor advance across concurrent leads.
 */
export async function dispatchNextSupportWorker(
  admin: SupabaseClient
): Promise<string | null> {
  const { data, error } = await admin.rpc("yike_dispatch_support_worker");
  if (error) {
    console.error("[support/dispatch] failed", error.message);
    return null;
  }
  return data ? String(data) : null;
}

export async function assignLeadToSupport(
  admin: SupabaseClient,
  leadId: string,
  supportId: string
): Promise<void> {
  const { error } = await admin
    .from("leads")
    .update({ assigned_support_id: supportId })
    .eq("id", leadId);

  if (error) {
    console.error("[support/dispatch] lead assign failed", error.message);
    return;
  }

  await logLeadEvent({
    leadId,
    type: "assigned",
    actorRole: "system",
    metadata: { assigned_support_id: supportId, dispatch: "round_robin" },
  });
}

export async function autoAssignSupportLead(
  admin: SupabaseClient,
  leadId: string
): Promise<string | null> {
  const supportId = await dispatchNextSupportWorker(admin);
  if (!supportId) return null;
  await assignLeadToSupport(admin, leadId, supportId);
  return supportId;
}

export async function autoAssignInspectionRequest(
  admin: SupabaseClient,
  requestId: string
): Promise<string | null> {
  const supportId = await dispatchNextSupportWorker(admin);
  if (!supportId) return null;

  const { error } = await admin
    .from("inspection_requests")
    .update({
      assigned_to: supportId,
      status: "assigned",
    })
    .eq("id", requestId);

  if (error) {
    console.error("[support/dispatch] inspection assign failed", error.message);
    return null;
  }

  return supportId;
}
