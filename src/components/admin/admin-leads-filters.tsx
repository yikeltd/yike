"use client";

import { useEffect, useState } from "react";
import { AdminEntitySelector } from "@/components/admin/selection";
import type { AdminEntityItem } from "@/components/admin/selection/types";

export function AdminLeadsFilters({
  defaultType,
  defaultStatus,
  defaultCity,
  defaultAgentId,
  defaultListingId,
  defaultDays,
}: {
  defaultType?: string;
  defaultStatus?: string;
  defaultCity?: string;
  defaultAgentId?: string;
  defaultListingId?: string;
  defaultDays: string;
}) {
  const [agent, setAgent] = useState<AdminEntityItem[]>([]);
  const [listing, setListing] = useState<AdminEntityItem[]>([]);

  useEffect(() => {
    async function hydrate() {
      if (defaultAgentId) {
        const res = await fetch(
          `/api/admin/entity-search?type=agent&ids=${encodeURIComponent(defaultAgentId)}`
        );
        const data = (await res.json()) as { results?: AdminEntityItem[] };
        if (data.results?.[0]) setAgent([data.results[0]]);
      }
      if (defaultListingId) {
        const res = await fetch(
          `/api/admin/entity-search?type=listing&ids=${encodeURIComponent(defaultListingId)}`
        );
        const data = (await res.json()) as { results?: AdminEntityItem[] };
        if (data.results?.[0]) setListing([data.results[0]]);
      }
    }
    void hydrate();
  }, [defaultAgentId, defaultListingId]);

  return (
    <form method="get" className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-3">
        <select
          name="type"
          defaultValue={defaultType ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="call">Call</option>
        </select>
        <select
          name="status"
          defaultValue={defaultStatus ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All deal statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="inspection_requested">Inspection requested</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed won</option>
          <option value="closed_lost">Closed lost</option>
          <option value="spam">Spam</option>
        </select>
        <input
          name="city"
          placeholder="City filter"
          defaultValue={defaultCity ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        />
        <select
          name="days"
          defaultValue={defaultDays}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 font-semibold text-white"
        >
          Filter
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-muted">
            Agent
          </label>
          <AdminEntitySelector
            entityType="agent"
            mode="single"
            selected={agent}
            onChange={setAgent}
            showPreview
          />
          <input type="hidden" name="agent" value={agent[0]?.id ?? ""} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-muted">
            Listing
          </label>
          <AdminEntitySelector
            entityType="listing"
            mode="single"
            selected={listing}
            onChange={setListing}
            showPreview
          />
          <input type="hidden" name="listing" value={listing[0]?.id ?? ""} />
        </div>
      </div>
    </form>
  );
}
