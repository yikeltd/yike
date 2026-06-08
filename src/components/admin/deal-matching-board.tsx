"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMISSION_STATUSES,
  DEAL_REQUEST_SOURCES,
  DEAL_REQUEST_TYPE_LABELS,
  DEAL_REQUEST_TYPES,
  DEAL_SOURCE_LABELS,
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
  DEAL_URGENCY_LEVELS,
  MAX_OUTREACH_RECIPIENTS,
  PAYMENT_STATUSES,
} from "@/lib/deal-matching/constants";
import { internalBudgetLabel } from "@/lib/deal-matching/budget-display";
import { dealResponseWhatsAppUrl } from "@/lib/deal-matching/whatsapp";
import type { AgentSuggestion } from "@/lib/deal-matching/agent-suggestions";
import type { DealMatchRequest } from "@/types/deal-matching";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type TabId = "requests" | "create" | "permissions";

export function DealMatchingBoard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [tab, setTab] = useState<TabId>("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState<DealMatchRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    request: DealMatchRequest;
    outreach: Array<Record<string, unknown>>;
    statusEvents: Array<Record<string, unknown>>;
  } | null>(null);

  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [agentSearch, setAgentSearch] = useState("");

  const [form, setForm] = useState({
    subject: "",
    request_type: "premium_request",
    request_source: "admin_manual",
    target_area: "",
    city: "",
    state: "",
    property_type: "",
    budget_min: "",
    budget_max: "",
    requirements: "",
    internal_notes: "",
    urgency: "normal",
  });

  const [commissionForm, setCommissionForm] = useState({
    expected_transaction_value: "",
    estimated_commission: "",
    agreed_percentage: "",
    commission_status: "pending",
    payment_status: "none",
    negotiation_notes: "",
    internal_notes: "",
  });

  const [permissions, setPermissions] = useState<Array<Record<string, unknown>>>([]);
  const [supportStaff, setSupportStaff] = useState<Array<Record<string, unknown>>>([]);
  const [permStaffId, setPermStaffId] = useState("");
  const [permNotes, setPermNotes] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const qs =
      statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
    const res = await fetch(`/api/admin/deal-matching${qs}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setRequests(json.requests ?? []);
  }, [statusFilter]);

  const loadDetail = useCallback(async (id: string) => {
    setExpandedId(id);
    const res = await fetch(`/api/admin/deal-matching/${id}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setDetail(json);
    const r = json.request as DealMatchRequest;
    setCommissionForm({
      expected_transaction_value: r.expected_transaction_value?.toString() ?? "",
      estimated_commission: r.estimated_commission?.toString() ?? "",
      agreed_percentage: r.agreed_percentage?.toString() ?? "",
      commission_status: r.commission_status,
      payment_status: r.payment_status,
      negotiation_notes: r.negotiation_notes ?? "",
      internal_notes: r.internal_notes ?? "",
    });
    void loadSuggestions(r);
  }, []);

  async function loadSuggestions(request: DealMatchRequest) {
    const params = new URLSearchParams();
    if (request.city) params.set("city", request.city);
    if (request.state) params.set("state", request.state);
    if (request.target_area) params.set("area", request.target_area);
    if (request.property_type) params.set("property_type", request.property_type);
    const res = await fetch(`/api/admin/deal-matching/suggestions?${params}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setSuggestions(json.agents ?? []);
  }

  async function searchAgents(q: string) {
    setAgentSearch(q);
    if (!q.trim()) {
      if (detail?.request) void loadSuggestions(detail.request);
      return;
    }
    const res = await fetch(
      `/api/admin/deal-matching/suggestions?q=${encodeURIComponent(q.trim())}`
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) setSuggestions(json.agents ?? []);
  }

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (tab === "permissions" && isSuperAdmin) void loadPermissions();
  }, [tab, isSuperAdmin]);

  async function loadPermissions() {
    const res = await fetch("/api/admin/deal-matching/permissions");
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setPermissions(json.permissions ?? []);
      setSupportStaff(json.supportStaff ?? []);
    }
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/deal-matching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(json.error ?? "Failed to create");
      return;
    }
    setMessage("Demand request created");
    setTab("requests");
    setForm({
      subject: "",
      request_type: "premium_request",
      request_source: "admin_manual",
      target_area: "",
      city: "",
      state: "",
      property_type: "",
      budget_min: "",
      budget_max: "",
      requirements: "",
      internal_notes: "",
      urgency: "normal",
    });
    await loadRequests();
  }

  async function sendOutreach() {
    if (!expandedId || selectedAgents.size === 0) {
      setMessage("Select agents to contact");
      return;
    }
    if (selectedAgents.size > MAX_OUTREACH_RECIPIENTS) {
      setMessage(`Max ${MAX_OUTREACH_RECIPIENTS} recipients`);
      return;
    }
    const res = await fetch(`/api/admin/deal-matching/${expandedId}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientIds: [...selectedAgents] }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Outreach sent to ${json.sentCount ?? 0} agents` : json.error ?? "Failed");
    if (res.ok) {
      setSelectedAgents(new Set());
      await loadDetail(expandedId);
      await loadRequests();
    }
  }

  async function updateStatus(status: string) {
    if (!expandedId) return;
    const res = await fetch(`/api/admin/deal-matching/${expandedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Status updated" : json.error ?? "Failed");
    if (res.ok) {
      await loadDetail(expandedId);
      await loadRequests();
    }
  }

  async function saveCommission() {
    if (!expandedId) return;
    const res = await fetch(`/api/admin/deal-matching/${expandedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_transaction_value: commissionForm.expected_transaction_value
          ? Number(commissionForm.expected_transaction_value)
          : null,
        estimated_commission: commissionForm.estimated_commission
          ? Number(commissionForm.estimated_commission)
          : null,
        agreed_percentage: commissionForm.agreed_percentage
          ? Number(commissionForm.agreed_percentage)
          : null,
        commission_status: commissionForm.commission_status,
        payment_status: commissionForm.payment_status,
        negotiation_notes: commissionForm.negotiation_notes,
        internal_notes: commissionForm.internal_notes,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Commission saved" : json.error ?? "Failed");
    if (res.ok) await loadDetail(expandedId);
  }

  async function grantPermission(active: boolean) {
    if (!permStaffId) return;
    const res = await fetch("/api/admin/deal-matching/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: permStaffId,
        can_manage_deal_matching: active,
        is_active: active,
        assignment_notes: permNotes,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? (active ? "Access granted" : "Access revoked") : json.error ?? "Failed");
    if (res.ok) await loadPermissions();
  }

  function toggleAgent(id: string) {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const opsWaPreview = detail?.request
    ? dealResponseWhatsAppUrl(detail.request as DealMatchRequest)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["requests", "Active requests"],
            ["create", "Create demand"],
            ...(isSuperAdmin ? [["permissions", "Access control"] as const] : []),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              tab === id ? "bg-navy text-gold" : "border bg-white text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {tab === "create" ? (
        <form
          onSubmit={createRequest}
          className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
        >
          <h2 className="text-lg font-bold text-navy">Create demand request</h2>
          <p className="mt-1 text-sm text-muted">
            High-value assisted matching only. Buyer identity stays private.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Subject e.g. 3-bedroom in Lekki Phase 1"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="sm:col-span-2"
              required
            />
            <select
              value={form.request_type}
              onChange={(e) => setForm((f) => ({ ...f, request_type: e.target.value }))}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {DEAL_REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DEAL_REQUEST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={form.request_source}
              onChange={(e) => setForm((f) => ({ ...f, request_source: e.target.value }))}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {DEAL_REQUEST_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {DEAL_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
            <Input
              placeholder="Target area"
              value={form.target_area}
              onChange={(e) => setForm((f) => ({ ...f, target_area: e.target.value }))}
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
            <Input
              placeholder="Property type"
              value={form.property_type}
              onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Budget min (NGN, internal)"
              value={form.budget_min}
              onChange={(e) => setForm((f) => ({ ...f, budget_min: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Budget max (NGN, internal)"
              value={form.budget_max}
              onChange={(e) => setForm((f) => ({ ...f, budget_max: e.target.value }))}
            />
            <select
              value={form.urgency}
              onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {DEAL_URGENCY_LEVELS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2">
              <Textarea
                placeholder="Requirements (shown to agents as curated copy)"
                rows={3}
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                placeholder="Internal notes (staff only)"
                rows={2}
                value={form.internal_notes}
                onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
              />
            </div>
          </div>
          <Button type="submit" className="mt-4">
            Create request
          </Button>
        </form>
      ) : null}

      {tab === "permissions" && isSuperAdmin ? (
        <div className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]">
          <h2 className="text-lg font-bold text-navy">Deal matching access</h2>
          <p className="mt-1 text-sm text-muted">
            Chief admin has access by default. Grant support staff selectively.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={permStaffId}
              onChange={(e) => setPermStaffId(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">Select support staff</option>
              {supportStaff.map((s) => (
                <option key={s.id as string} value={s.id as string}>
                  {(s.full_name as string) ?? s.email}
                </option>
              ))}
            </select>
            <Input
              placeholder="Assignment notes"
              value={permNotes}
              onChange={(e) => setPermNotes(e.target.value)}
            />
            <Button type="button" onClick={() => grantPermission(true)}>
              Grant access
            </Button>
            <Button type="button" variant="secondary" onClick={() => grantPermission(false)}>
              Revoke
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {permissions.map((p) => (
              <div key={p.staff_id as string} className="rounded-lg border p-3 text-sm">
                <span className="font-semibold text-navy">{p.staff_id as string}</span>
                <span className="ml-2 text-muted">
                  {p.is_active && p.can_manage_deal_matching ? "active" : "inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "requests" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                statusFilter === "all" ? "bg-navy text-gold" : "bg-surface text-muted"
              }`}
            >
              All
            </button>
            {DEAL_STATUSES.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === s ? "bg-navy text-gold" : "bg-surface text-muted"
                }`}
              >
                {DEAL_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {loading ? <p className="text-sm text-muted">Loading…</p> : null}

          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border bg-white p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => void loadDetail(r.id)}
                >
                  <p className="font-bold text-navy">{r.subject}</p>
                  <p className="text-xs text-muted">
                    {DEAL_REQUEST_TYPE_LABELS[r.request_type]} · {DEAL_STATUS_LABELS[r.status]} ·{" "}
                    {internalBudgetLabel(r.budget_min, r.budget_max)}
                  </p>
                </button>

                {expandedId === r.id && detail?.request?.id === r.id ? (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                      {DEAL_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void updateStatus(s)}
                          className={`rounded px-2 py-1 text-xs ${
                            detail.request.status === s
                              ? "bg-gold text-navy font-bold"
                              : "border text-muted"
                          }`}
                        >
                          {DEAL_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>

                    {opsWaPreview ? (
                      <a
                        href={opsWaPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-sm font-bold text-gold-dark"
                      >
                        Ops WhatsApp preview →
                      </a>
                    ) : null}

                    <div>
                      <p className="text-xs font-bold text-navy">Agent targeting</p>
                      <Input
                        placeholder="Search agent by name"
                        value={agentSearch}
                        onChange={(e) => void searchAgents(e.target.value)}
                        className="mt-2"
                      />
                      <p className="mt-1 text-xs text-muted">
                        Selected {selectedAgents.size} / {MAX_OUTREACH_RECIPIENTS} max
                      </p>
                      <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                        {suggestions.map((a) => (
                          <label
                            key={a.id}
                            className="flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAgents.has(a.id)}
                              onChange={() => toggleAgent(a.id)}
                            />
                            <span>
                              <span className="font-semibold text-navy">{a.displayName}</span>
                              <span className="block text-xs text-muted">{a.subtitle}</span>
                              {a.warnings.length > 0 ? (
                                <span className="text-xs text-amber-700">
                                  {a.warnings.join(" · ")}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        ))}
                      </div>
                      <Button type="button" className="mt-3" onClick={() => void sendOutreach()}>
                        Send curated outreach
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Expected transaction (NGN)"
                        value={commissionForm.expected_transaction_value}
                        onChange={(e) =>
                          setCommissionForm((f) => ({
                            ...f,
                            expected_transaction_value: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Estimated commission (NGN)"
                        value={commissionForm.estimated_commission}
                        onChange={(e) =>
                          setCommissionForm((f) => ({
                            ...f,
                            estimated_commission: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Agreed %"
                        value={commissionForm.agreed_percentage}
                        onChange={(e) =>
                          setCommissionForm((f) => ({ ...f, agreed_percentage: e.target.value }))
                        }
                      />
                      <select
                        value={commissionForm.commission_status}
                        onChange={(e) =>
                          setCommissionForm((f) => ({ ...f, commission_status: e.target.value }))
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        {COMMISSION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        value={commissionForm.payment_status}
                        onChange={(e) =>
                          setCommissionForm((f) => ({ ...f, payment_status: e.target.value }))
                        }
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Textarea
                        placeholder="Negotiation notes (internal)"
                        rows={2}
                        value={commissionForm.negotiation_notes}
                        onChange={(e) =>
                          setCommissionForm((f) => ({ ...f, negotiation_notes: e.target.value }))
                        }
                        className="sm:col-span-2"
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={() => void saveCommission()}>
                      Save commission tracking
                    </Button>

                    {detail.outreach.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-navy">Outreach log</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted">
                          {detail.outreach.map((o) => (
                            <li key={o.id as string}>
                              {(o.profiles as { company_name?: string; full_name?: string })
                                ?.company_name ??
                                (o.profiles as { full_name?: string })?.full_name}{" "}
                              · {o.status as string}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
