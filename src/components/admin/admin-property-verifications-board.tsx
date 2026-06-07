"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { buyerWhatsAppPrefill, whatsappContactUrl } from "@/lib/verification/reference";

type RequestRow = {
  id: string;
  request_reference: string | null;
  status: string;
  priority: string;
  buyer_full_name: string | null;
  buyer_email: string | null;
  buyer_whatsapp: string | null;
  property_title: string | null;
  property_location_text: string | null;
  property_type: string | null;
  is_diaspora_request: boolean;
  requested_at: string;
  assigned_verifier_id: string | null;
  admin_internal_notes: string | null;
};

type Suggestion = {
  id: string;
  verifierCode: string;
  fullName: string | null;
  city: string;
  score: number;
  warnings: string[];
  openAssignments: number;
};

export function AdminPropertyVerificationsBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState("submitted");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [assignVerifierId, setAssignVerifierId] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [buyerSummary, setBuyerSummary] = useState("");
  const [reportValidUntil, setReportValidUntil] = useState<string | null>(null);
  const [buyerFeedback, setBuyerFeedback] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/property-verifications?tab=${tab}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return;
    setRequests(json.requests ?? []);
    setTabs(json.tabs ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadDetail(id: string) {
    setExpandedId(id);
    const res = await fetch(`/api/admin/property-verifications/${id}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setSuggestions(json.suggestions ?? []);
      setInternalNotes(json.request?.admin_internal_notes ?? "");
      setReportValidUntil(json.report?.report_valid_until ?? null);
      setBuyerFeedback(json.request?.buyer_feedback ?? null);
    }
  }

  async function runAction(id: string, action: string, extra: Record<string, unknown> = {}) {
    const needsPin = ["assign", "reject", "deliver", "fraud_review"].includes(action);
    const exec = async () => {
      const res = await fetch(`/api/admin/property-verifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Updated" : (json.error ?? "Failed"));
      await load();
      if (expandedId === id) await loadDetail(id);
    };
    if (needsPin) await requirePin(exec);
    else await exec();
  }

  return (
    <div className="space-y-4">
      {pinModal}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? "bg-navy text-white" : "border bg-white text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      <div className="space-y-3">
        {requests.map((r) => {
          const ref = r.request_reference ?? r.id.slice(0, 8);
          const waUrl = r.buyer_whatsapp
            ? whatsappContactUrl(r.buyer_whatsapp, buyerWhatsAppPrefill(ref))
            : null;

          return (
            <div key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    {r.property_title ?? "Property"} · <span className="text-gold-dark">{ref}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {r.buyer_full_name} · {r.property_location_text} · {r.priority}
                    {r.is_diaspora_request ? " · diaspora" : ""} · {r.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                    >
                      Open WhatsApp
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => loadDetail(r.id)}
                    className="rounded-lg border px-3 py-1 text-xs font-bold"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {expandedId === r.id ? (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Internal admin notes (not visible to buyer or verifier)"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runAction(r.id, "save_notes", { internalNotes })}
                      className="rounded-lg border px-2 py-1 text-xs font-bold"
                    >
                      Save notes
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(r.id, "mark_contacted", { internalNotes })}
                      className="rounded-lg bg-navy px-2 py-1 text-xs font-bold text-gold"
                    >
                      Mark contacted
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(r.id, "approve_for_assignment", { internalNotes })}
                      className="rounded-lg bg-gold px-2 py-1 text-xs font-bold text-navy"
                    >
                      Ready to assign
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(r.id, "hold", { internalNotes })}
                      className="rounded-lg border px-2 py-1 text-xs font-bold"
                    >
                      Hold
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void requirePin(async () => {
                          await runAction(r.id, "reject");
                        })
                      }
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                    >
                      Reject
                    </button>
                  </div>

                  {suggestions.length ? (
                    <div className="rounded-lg bg-surface/60 p-3">
                      <p className="text-xs font-bold text-navy">Suggested verifiers</p>
                      <div className="mt-2 space-y-2">
                        {suggestions.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-xs">
                            <input
                              type="radio"
                              name={`verifier-${r.id}`}
                              checked={assignVerifierId === s.id}
                              onChange={() => setAssignVerifierId(s.id)}
                            />
                            {s.fullName ?? s.verifierCode} · {s.city} · score {s.score}
                            {s.warnings.length ? ` · ⚠ ${s.warnings.join(", ")}` : ""}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={!assignVerifierId}
                        onClick={() =>
                          runAction(r.id, "assign", { verifierId: assignVerifierId })
                        }
                        className="mt-3 rounded-lg bg-navy px-3 py-1 text-xs font-bold text-gold disabled:opacity-50"
                      >
                        Assign verifier
                      </button>
                    </div>
                  ) : null}

                  {reportValidUntil ? (
                    <p className="text-xs text-muted">
                      Report valid until:{" "}
                      <strong>{new Date(reportValidUntil).toLocaleDateString("en-NG")}</strong>
                      {" "}(validity notice auto-appended on deliver)
                    </p>
                  ) : null}

                  {buyerFeedback ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                      <p className="font-bold text-navy">Buyer feedback (internal)</p>
                      <pre className="mt-1 whitespace-pre-wrap text-muted">
                        {JSON.stringify(buyerFeedback, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-bold text-navy">Deliver summary to buyer</p>
                    <textarea
                      value={buyerSummary}
                      onChange={(e) => setBuyerSummary(e.target.value)}
                      rows={4}
                      placeholder="Admin-reviewed summary for buyer — no verifier private details"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={!buyerSummary.trim()}
                      onClick={() =>
                        runAction(r.id, "deliver", { buyerSummary: buyerSummary.trim() })
                      }
                      className="mt-2 rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy disabled:opacity-50"
                    >
                      Mark delivered
                    </button>
                    {r.request_reference ? (
                      <p className="mt-2 text-[11px] text-muted">
                        Feedback link: /property-verification/feedback?ref=
                        {encodeURIComponent(r.request_reference)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
