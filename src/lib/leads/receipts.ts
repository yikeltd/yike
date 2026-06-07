import { createAdminClient } from "@/lib/supabase/admin";

export async function createLeadReceipt(input: {
  leadId: string;
  agentId: string;
  listingId: string;
  chargeAmount: number;
  chargeStatus: string;
  routeUsed: string | null;
  isDuplicate: boolean;
  yikeReference: string;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin.from("agent_lead_receipts").insert({
    lead_id: input.leadId,
    agent_id: input.agentId,
    listing_id: input.listingId,
    charge_amount: input.chargeAmount,
    charge_status: input.chargeStatus,
    route_used: input.routeUsed,
    is_duplicate: input.isDuplicate,
    yike_reference: input.yikeReference,
  });

  if (error) {
    console.warn("[leads/receipts] insert failed:", error.message);
  }
}
