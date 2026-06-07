import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { isAgentLeadBillingEnabled } from "@/lib/feature-flags";
import type { LeadChargeStatus } from "./routing-types";

export async function getAgentWalletBalance(agentId: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;

  await admin.rpc("yike_ensure_agent_wallet", { p_agent_id: agentId });

  const { data } = await admin
    .from("agent_wallets")
    .select("balance")
    .eq("agent_id", agentId)
    .maybeSingle();

  return Number(data?.balance ?? 0);
}

export type ChargeResult = {
  charge_status: LeadChargeStatus;
  charge_amount: number;
  wallet_balance_before: number | null;
  wallet_balance_after: number | null;
  charge_reference: string | null;
};

export async function processLeadCharge(input: {
  agentId: string;
  leadId: string;
  amount: number;
  billingMode: string;
  isDuplicate: boolean;
  actorId?: string | null;
}): Promise<ChargeResult> {
  const zero: ChargeResult = {
    charge_status: "not_chargeable",
    charge_amount: input.amount,
    wallet_balance_before: null,
    wallet_balance_after: null,
    charge_reference: null,
  };

  if (input.isDuplicate) {
    return { ...zero, charge_status: "duplicate_no_charge" };
  }

  if (!isAgentLeadBillingEnabled() || input.amount <= 0) {
    return {
      ...zero,
      charge_status: isAgentLeadBillingEnabled() ? "waived" : "not_chargeable",
    };
  }

  const admin = createAdminClient();
  if (!admin) return { ...zero, charge_status: "failed" };

  await admin.rpc("yike_ensure_agent_wallet", { p_agent_id: input.agentId });

  const { data: wallet } = await admin
    .from("agent_wallets")
    .select("id, balance, status")
    .eq("agent_id", input.agentId)
    .single();

  if (!wallet || wallet.status !== "active") {
    return {
      ...zero,
      charge_status: "insufficient_balance",
      wallet_balance_before: Number(wallet?.balance ?? 0),
      wallet_balance_after: Number(wallet?.balance ?? 0),
    };
  }

  const before = Number(wallet.balance);
  if (before < input.amount) {
    return {
      charge_status: "insufficient_balance",
      charge_amount: input.amount,
      wallet_balance_before: before,
      wallet_balance_after: before,
      charge_reference: null,
    };
  }

  const after = before - input.amount;
  const ref = `LC-${input.leadId.slice(0, 8)}-${Date.now()}`;

  const { error: walletErr } = await admin
    .from("agent_wallets")
    .update({ balance: after, updated_at: new Date().toISOString() })
    .eq("agent_id", input.agentId);

  if (walletErr) {
    return { ...zero, charge_status: "failed", wallet_balance_before: before };
  }

  await admin.from("agent_wallet_ledger").insert({
    agent_id: input.agentId,
    lead_id: input.leadId,
    amount: -input.amount,
    type: "lead_charge",
    reason: `Lead charge (${input.billingMode})`,
    reference: ref,
    balance_before: before,
    balance_after: after,
    created_by: input.actorId ?? null,
  });

  if (input.actorId) {
    void writeAuditLog({
      actor_id: input.actorId,
      actor_role: "admin",
      action: "lead.charge_deducted",
      target_type: "lead",
      target_id: input.leadId,
      metadata: { amount: input.amount, reference: ref, agent_id: input.agentId },
    });
  }

  return {
    charge_status: "charged",
    charge_amount: input.amount,
    wallet_balance_before: before,
    wallet_balance_after: after,
    charge_reference: ref,
  };
}

export async function waiveLeadCharge(leadId: string, actorId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("leads")
    .update({ charge_status: "waived", charged_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return false;

  const { data: leadRow } = await admin
    .from("leads")
    .select("agent_id")
    .eq("id", leadId)
    .single();

  if (leadRow?.agent_id) {
    await admin.from("agent_wallet_ledger").insert({
      agent_id: leadRow.agent_id,
      lead_id: leadId,
      amount: 0,
      type: "waiver",
      reason: "Admin waived lead charge",
      created_by: actorId,
    });
  }

  return true;
}

export async function adjustAgentWallet(input: {
  agentId: string;
  amount: number;
  reason: string;
  actorId: string;
  reference?: string;
  ledgerType?: "topup" | "adjustment" | "waiver" | "refund";
}): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable" };

  await admin.rpc("yike_ensure_agent_wallet", { p_agent_id: input.agentId });

  const { data: wallet } = await admin
    .from("agent_wallets")
    .select("balance")
    .eq("agent_id", input.agentId)
    .single();

  if (!wallet) return { ok: false, error: "Wallet not found" };

  const before = Number(wallet.balance);
  const after = before + input.amount;

  const { error } = await admin
    .from("agent_wallets")
    .update({ balance: after, updated_at: new Date().toISOString() })
    .eq("agent_id", input.agentId);

  if (error) return { ok: false, error: error.message };

  const ledgerType =
    input.ledgerType ??
    (input.amount >= 0 ? "topup" : "adjustment");

  await admin.from("agent_wallet_ledger").insert({
    agent_id: input.agentId,
    amount: input.amount,
    type: ledgerType,
    reason: input.reason,
    reference: input.reference ?? null,
    note: input.reason,
    balance_before: before,
    balance_after: after,
    created_by: input.actorId,
  });

  return { ok: true, balance: after };
}

/** Refund a charged lead — credits wallet and updates lead status. */
export async function refundLeadCharge(
  leadId: string,
  actorId: string
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data: lead } = await admin
    .from("leads")
    .select("agent_id, charge_amount, charge_status, charge_reference")
    .eq("id", leadId)
    .single();

  if (!lead?.agent_id) return false;

  const amount = Number(lead.charge_amount ?? 0);
  const wasCharged = lead.charge_status === "charged" && amount > 0;

  if (wasCharged) {
    await admin.rpc("yike_ensure_agent_wallet", { p_agent_id: lead.agent_id });
    const { data: wallet } = await admin
      .from("agent_wallets")
      .select("balance")
      .eq("agent_id", lead.agent_id)
      .single();

    if (wallet) {
      const before = Number(wallet.balance);
      const after = before + amount;
      await admin
        .from("agent_wallets")
        .update({ balance: after, updated_at: new Date().toISOString() })
        .eq("agent_id", lead.agent_id);

      await admin.from("agent_wallet_ledger").insert({
        agent_id: lead.agent_id,
        lead_id: leadId,
        amount,
        type: "refund",
        reason: "Dispute refund approved",
        reference: lead.charge_reference,
        balance_before: before,
        balance_after: after,
        created_by: actorId,
      });
    }
  }

  await admin
    .from("leads")
    .update({
      charge_status: wasCharged ? "refunded" : "waived",
      dispute_resolved_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  return true;
}
