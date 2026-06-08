import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import { computeAndPersistListingOutcome } from "./collect";
import { recalculateAgentOutcomeMemory } from "./agent-memory";
import { recalculateAreaOutcomeMemory } from "./area-memory";

export type OutcomeBatchResult = {
  listingsUpdated: number;
  agentsUpdated: number;
  areasUpdated: number;
};

export async function runOutcomeIntelligenceBatch(
  client: SupabaseClient,
  options?: { listingLimit?: number; agentLimit?: number }
): Promise<OutcomeBatchResult> {
  const listingLimit = options?.listingLimit ?? 150;
  const agentLimit = options?.agentLimit ?? 50;

  const { data: listings } = await client
    .from("properties")
    .select("*")
    .in("status", ["approved", "pending", "hidden"])
    .order("updated_at", { ascending: false })
    .limit(listingLimit);

  const agentIds = new Set<string>();
  let listingsUpdated = 0;

  for (const row of (listings ?? []) as Property[]) {
    await computeAndPersistListingOutcome(client, row);
    if (row.agent_id) agentIds.add(row.agent_id);
    listingsUpdated++;
  }

  let agentsUpdated = 0;
  for (const agentId of [...agentIds].slice(0, agentLimit)) {
    await recalculateAgentOutcomeMemory(client, agentId);
    agentsUpdated++;
  }

  const areasUpdated = await recalculateAreaOutcomeMemory(client);

  return { listingsUpdated, agentsUpdated, areasUpdated };
}
