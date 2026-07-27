"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import type {
  AssignedTeam,
  Case,
  CasePriority,
  CaseStatus,
  CaseType,
  OperationalMetrics,
} from "@/lib/cases/types";
import { cn } from "@/lib/utils";

const TEAM_OPTIONS: Array<{ id: AssignedTeam | "ALL"; label: string }> = [
  { id: "ALL", label: "All Teams" },
  { id: "FIELD_INSPECTION", label: "Field Inspection" },
  { id: "LEGAL_SERVICES", label: "Legal Services" },
  { id: "BUYER_CONCIERGE", label: "Buyer Concierge" },
  { id: "VERIFICATION_OPS", label: "Verification Ops" },
  { id: "TRUST_SAFETY", label: "Trust & Safety" },
  { id: "CUSTOMER_SUPPORT", label: "Customer Support" },
];

export function OfficerCasesInboxClient({
  initialCases,
  metrics,
}: {
  initialCases: Case[];
  metrics: OperationalMetrics;
}) {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<AssignedTeam | "ALL">("ALL");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Drawer note state
  const [noteContent, setNoteContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);

  const filtered = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      (c.assignedOfficerName && c.assignedOfficerName.toLowerCase().includes(query.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedTeam !== "ALL" && c.assignedTeam !== selectedTeam) return false;
    return true;
  });

  const assignedCount = cases.filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length;
  const pendingCount = cases.filter((c) => c.status === "PENDING_ASSIGNMENT").length;
  const urgentCount = cases.filter((c) => c.priority === "URGENT" || c.priority === "HIGH").length;

  async function handleStatusChange(caseId: string, status: CaseStatus) {
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { case?: Case };
      if (data.case) {
        setCases((prev) => prev.map((c) => (c.id === caseId ? data.case! : c)));
        if (selectedCase?.id === caseId) setSelectedCase(data.case);
      }
    } catch {
      // Ignore transient error
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase || !noteContent.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const bodyKey = isInternalNote ? "internalNote" : "customerNote";
      const res = await fetch(`/api/cases/${encodeURIComponent(selectedCase.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: noteContent.trim() }),
      });
      const data = (await res.json()) as { case?: Case };
      if (data.case) {
        setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? data.case! : c)));
        setSelectedCase(data.case);
        setNoteContent("");
      }
    } catch {
      // Ignore transient error
    } finally {
      setSubmittingNote(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-navy/60">
          <Link href="/lex/auth" className="hover:underline">
            Lex Command Center
          </Link>
          <span>/</span>
          <span className="text-navy">Trust Operations Workspace</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Case Management & Operational Backbone
        </h1>
        <p className="mt-1 text-xs text-navy/70">
          Unified operational queue for Field Inspections, Legal Title Searches, Buyer Concierge, and Verification Audits.
        </p>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Total Active Cases</p>
          <p className="mt-1 text-2xl font-black text-navy">{assignedCount}</p>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Pending Queue</p>
          <p className="mt-1 text-2xl font-black text-navy">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-danger">Priority / Urgent</p>
          <p className="mt-1 text-2xl font-black text-danger">{urgentCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Avg Resolution</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{metrics.avgResolutionTimeMinutes}m</p>
        </div>
      </div>

      {/* Search & Team Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-navy/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases by ID, title, or officer name…"
            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-11 pr-4 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-navy/10 bg-white p-1.5 shadow-sm">
          {TEAM_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTeam(t.id)}
              className={cn(
                "pressable shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                selectedTeam === t.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Queue Table */}
      <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-navy/10 bg-navy/5 font-bold uppercase text-navy/60">
              <tr>
                <th className="px-4 py-3">Case ID & Title</th>
                <th className="px-4 py-3">Type & Team</th>
                <th className="px-4 py-3">Assigned Officer</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 font-medium text-navy">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-navy/5 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-navy">{c.title}</p>
                    <p className="text-[10px] text-navy/50">{c.id}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-bold text-navy">
                      {c.caseType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.assignedOfficerName ? (
                      <span className="font-bold text-navy">{c.assignedOfficerName}</span>
                    ) : (
                      <span className="font-semibold text-amber-700 italic">Unassigned (Queue)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
                        c.priority === "URGENT" || c.priority === "HIGH"
                          ? "bg-danger/10 text-danger"
                          : "bg-navy/10 text-navy"
                      )}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        c.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : c.status === "IN_PROGRESS"
                          ? "bg-gold/20 text-gold-dark"
                          : "bg-navy/10 text-navy"
                      )}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(c)}
                      className="pressable rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold text-navy shadow-sm transition-all hover:bg-gold-light"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management Drawer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-navy/10 pb-4">
              <div>
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase">
                  {selectedCase.caseType.replace(/_/g, " ")}
                </span>
                <h3 className="mt-1 text-lg font-bold text-navy">{selectedCase.title}</h3>
                <p className="text-xs text-navy/60 font-medium">Case ID: {selectedCase.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left Column: Status Updater & Assignment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy">Update Case Status</label>
                  <select
                    value={selectedCase.status}
                    onChange={(e) =>
                      void handleStatusChange(selectedCase.id, e.target.value as CaseStatus)
                    }
                    className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-3 py-2 text-xs font-bold text-navy focus:border-gold focus:outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="PENDING_ASSIGNMENT">PENDING_ASSIGNMENT</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING_CUSTOMER">WAITING_CUSTOMER</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-navy/10 bg-navy/5 p-3 text-xs text-navy">
                  <p className="font-bold">Assigned Officer:</p>
                  <p className="mt-0.5 font-semibold text-navy/70">
                    {selectedCase.assignedOfficerName ?? "Unassigned (Pending Queue)"}
                  </p>
                  <p className="mt-2 font-bold">Assigned Team:</p>
                  <p className="mt-0.5 font-semibold text-navy/70">{selectedCase.assignedTeam}</p>
                </div>

                {/* Internal Notes History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">Internal Notes Log</h4>
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-navy/10 bg-surface p-3 text-xs">
                    {selectedCase.internalNotes.length === 0 ? (
                      <p className="text-navy/40 italic">No internal notes added yet.</p>
                    ) : (
                      selectedCase.internalNotes.map((n) => (
                        <div key={n.id} className="border-b border-navy/10 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-[10px] font-bold text-navy/60">
                            <span>{n.authorName}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="mt-0.5 text-navy font-medium">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Add Note Form */}
              <form onSubmit={(e) => void handleAddNote(e)} className="flex flex-col justify-between space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy">Add Note or Customer Update</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter operational notes or public updates for buyer/seller..."
                    rows={6}
                    className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
                    required
                  />

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isInternal"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-navy/20 text-gold focus:ring-gold"
                    />
                    <label htmlFor="isInternal" className="text-xs font-bold text-navy flex items-center gap-1">
                      <Lock className="h-3 w-3 text-navy/60" /> Internal Note Only (Hidden from Customer)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingNote || !noteContent.trim()}
                  className="pressable flex w-full items-center justify-center rounded-full bg-navy py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy/90 disabled:opacity-50"
                >
                  {submittingNote ? "Posting Note…" : "Post Note to Case Log"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
