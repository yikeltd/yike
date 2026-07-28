"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, MessageSquare, Shield } from "lucide-react";
import type { LeadCard, PipelineStage } from "@/lib/seller-crm/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PIPELINE_COLUMNS: Array<{ id: PipelineStage; label: string; color: string }> = [
  { id: "NEW_LEAD", label: "New Lead", color: "bg-blue-500/10 text-blue-700" },
  { id: "CONTACTED", label: "Contacted", color: "bg-navy/10 text-navy" },
  { id: "VIEWING_SCHEDULED", label: "Viewing Scheduled", color: "bg-gold/20 text-navy" },
  { id: "INSPECTION", label: "Inspection", color: "bg-amber-500/15 text-amber-800" },
  { id: "NEGOTIATION", label: "Negotiation", color: "bg-purple-500/15 text-purple-900" },
  { id: "OFFER_ACCEPTED", label: "Offer Accepted", color: "bg-emerald-500/15 text-emerald-800" },
  { id: "COMPLETED", label: "Completed", color: "bg-emerald-600 text-white font-bold" },
];

export function PipelineKanban({
  leads,
  onMoveStage,
}: {
  leads: LeadCard[];
  onMoveStage: (leadId: string, toStage: PipelineStage) => Promise<void>;
}) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");

  const filtered = leads.filter((l) =>
    l.buyerName.toLowerCase().includes(query.toLowerCase()) ||
    l.listingTitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* View Switcher & Search */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads by buyer or listing..."
          className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white px-4 py-2.5 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
        />

        <div className="flex items-center gap-1 rounded-2xl border border-navy/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "kanban" ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "list" ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Mode */}
      {viewMode === "kanban" ? (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = filtered.filter((l) => l.stage === col.id);

            return (
              <div
                key={col.id}
                className="flex w-72 shrink-0 flex-col rounded-3xl border border-navy/10 bg-surface p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs font-extrabold text-navy/40">{colLeads.length}</span>
                </div>

                <div className="space-y-3">
                  {colLeads.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-navy/10 p-6 text-center text-xs font-medium text-navy/40">
                      No leads
                    </div>
                  ) : (
                    colLeads.map((l) => (
                      <div
                        key={l.id}
                        className="group pressable overflow-hidden rounded-2xl border border-navy/10 bg-white p-3.5 shadow-sm transition-all hover:border-gold/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50">
                            {l.daysInStage}d in stage
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <Shield className="h-3 w-3" /> {l.trustScore}/100
                          </span>
                        </div>

                        <h4 className="mt-1 text-xs font-bold text-navy truncate">{l.buyerName}</h4>
                        <p className="text-[11px] font-medium text-navy/70 truncate">{l.listingTitle}</p>
                        <p className="mt-1 text-xs font-black text-navy">{formatPrice(l.dealValue, "total", "rent")}</p>

                        <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-2 text-xs">
                          <Link
                            href={`/conversations/${encodeURIComponent(l.conversationId)}`}
                            className="flex items-center gap-1 font-bold text-navy hover:underline"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-gold-dark" /> Workspace
                          </Link>

                          <select
                            value={l.stage}
                            onChange={(e) => void onMoveStage(l.id, e.target.value as PipelineStage)}
                            className="rounded-lg border border-navy/10 bg-surface px-2 py-1 text-[10px] font-bold text-navy"
                          >
                            {PIPELINE_COLUMNS.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                Move to {stage.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-navy/10 bg-navy/5 font-bold uppercase text-navy/60">
              <tr>
                <th className="px-4 py-3">Buyer & Contact</th>
                <th className="px-4 py-3">Listing Title</th>
                <th className="px-4 py-3">Deal Value</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 font-medium text-navy">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-navy/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-navy">{l.buyerName}</p>
                    <p className="text-[10px] text-navy/50">{l.buyerPhone ?? "In-app contact"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-navy truncate max-w-xs">{l.listingTitle}</p>
                  </td>
                  <td className="px-4 py-3 font-black text-navy">
                    {formatPrice(l.dealValue, "total", "rent")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-navy">
                      {l.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/conversations/${encodeURIComponent(l.conversationId)}`}
                      className="pressable rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      Open Workspace
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
