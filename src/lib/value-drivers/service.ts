import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getValueDriverDefinition,
  isHighRiskValueDriver,
  MAX_VALUE_DRIVER_SELECTIONS,
} from "@/constants/valueDrivers";
import type { ValueDriverStatus } from "@/constants/valueDrivers";

export type ListingValueDriverRow = {
  id: string;
  listing_id: string;
  driver_key: string;
  label: string;
  category: string;
  status: ValueDriverStatus;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  evidence_url: string | null;
  evidence_requested: boolean;
  created_at: string;
  updated_at: string;
};

function initialStatusForDriver(
  driverKey: string,
  opts: { listingApproved: boolean; agentVerified: boolean }
): ValueDriverStatus {
  if (isHighRiskValueDriver(driverKey)) return "pending_review";
  if (opts.listingApproved && opts.agentVerified) return "approved";
  return "pending_review";
}

/** Sync agent-selected drivers for a listing. */
export async function syncListingValueDrivers(
  client: SupabaseClient,
  input: {
    listingId: string;
    driverKeys: string[];
    submittedBy: string;
    listingApproved: boolean;
    agentVerified: boolean;
  }
): Promise<{ ok: boolean; error?: string; count: number }> {
  const keys = [...new Set(input.driverKeys)].slice(0, MAX_VALUE_DRIVER_SELECTIONS);
  for (const key of keys) {
    if (!getValueDriverDefinition(key)) {
      return { ok: false, error: "Invalid value driver selected", count: 0 };
    }
  }

  const { data: existing } = await client
    .from("listing_value_drivers")
    .select("*")
    .eq("listing_id", input.listingId);

  const existingRows = (existing ?? []) as ListingValueDriverRow[];
  const existingKeys = new Set(existingRows.map((r) => r.driver_key));
  const nextKeys = new Set(keys);

  const toRemove = existingRows.filter((r) => !nextKeys.has(r.driver_key));
  if (toRemove.length > 0) {
    await client
      .from("listing_value_drivers")
      .delete()
      .in(
        "id",
        toRemove.map((r) => r.id)
      );
  }

  const now = new Date().toISOString();
  for (const key of keys) {
    const def = getValueDriverDefinition(key)!;
    const prev = existingRows.find((r) => r.driver_key === key);

    if (prev) {
      if (prev.status === "approved" && existingKeys.has(key)) continue;
      const status =
        prev.status === "rejected" || prev.status === "requires_evidence"
          ? initialStatusForDriver(key, {
              listingApproved: input.listingApproved,
              agentVerified: input.agentVerified,
            })
          : prev.status === "approved"
            ? "approved"
            : initialStatusForDriver(key, {
                listingApproved: input.listingApproved,
                agentVerified: input.agentVerified,
              });

      await client
        .from("listing_value_drivers")
        .update({
          label: def.label,
          category: def.category,
          status,
          submitted_by: input.submittedBy,
          updated_at: now,
          rejection_reason: status === "pending_review" ? null : prev.rejection_reason,
        })
        .eq("id", prev.id);
      continue;
    }

    await client.from("listing_value_drivers").insert({
      listing_id: input.listingId,
      driver_key: key,
      label: def.label,
      category: def.category,
      status: initialStatusForDriver(key, {
        listingApproved: input.listingApproved,
        agentVerified: input.agentVerified,
      }),
      submitted_by: input.submittedBy,
    });
  }

  await client.rpc("yike_refresh_listing_value_driver_summary", {
    p_listing_id: input.listingId,
  });

  return { ok: true, count: keys.length };
}

export async function getListingValueDrivers(
  client: SupabaseClient,
  listingId: string,
  status?: ValueDriverStatus | ValueDriverStatus[]
): Promise<ListingValueDriverRow[]> {
  let query = client
    .from("listing_value_drivers")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query = query.in("status", statuses);
  }

  const { data } = await query;
  return (data ?? []) as ListingValueDriverRow[];
}

export async function moderateListingValueDrivers(
  client: SupabaseClient,
  input: {
    listingId: string;
    approveKeys?: string[];
    rejectKeys?: string[];
    requestEvidenceKeys?: string[];
    reviewedBy: string;
    rejectionReason?: string;
    moderationNote?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const { data: rows } = await client
    .from("listing_value_drivers")
    .select("id, driver_key")
    .eq("listing_id", input.listingId);

  const all = (rows ?? []) as { id: string; driver_key: string }[];
  const approve = new Set(input.approveKeys ?? []);
  const reject = new Set(input.rejectKeys ?? []);
  const evidence = new Set(input.requestEvidenceKeys ?? []);

  for (const row of all) {
    let patch: Record<string, unknown> | null = null;
    if (approve.has(row.driver_key)) {
      patch = {
        status: "approved",
        reviewed_by: input.reviewedBy,
        reviewed_at: now,
        rejection_reason: null,
        evidence_requested: false,
        updated_at: now,
      };
    } else if (reject.has(row.driver_key)) {
      patch = {
        status: "rejected",
        reviewed_by: input.reviewedBy,
        reviewed_at: now,
        rejection_reason: input.rejectionReason?.trim() || input.moderationNote?.trim() || null,
        updated_at: now,
      };
    } else if (evidence.has(row.driver_key)) {
      patch = {
        status: "requires_evidence",
        evidence_requested: true,
        reviewed_by: input.reviewedBy,
        reviewed_at: now,
        rejection_reason: input.moderationNote?.trim() || null,
        updated_at: now,
      };
    }
    if (patch) {
      await client.from("listing_value_drivers").update(patch).eq("id", row.id);
    }
  }

  await client.rpc("yike_refresh_listing_value_driver_summary", {
    p_listing_id: input.listingId,
  });
}
