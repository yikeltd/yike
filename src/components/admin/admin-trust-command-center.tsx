"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { TRUST_COMMAND_TABS } from "@/lib/trust/operations/constants";
import { AdminTrustIntelligencePanel } from "@/components/admin/admin-trust-intelligence-panel";

type TabId = (typeof TRUST_COMMAND_TABS)[number]["id"];

type Summary = {
  propertyQueue: number;
  legalQueue: number;
  propertyFraud: number;
  legalFraud: number;
  openEscalations: number;
  unreadAlerts: number;
  diasporaBacklog: number;
  verifierPayoutHolds: number;
  legalPayoutHolds: number;
  suspiciousListingFlags?: number;
  ambassadorPayoutHolds?: number;
};

type PartnerRow = {
  id: string;
  verifier_code?: string;
  partner_code?: string;
  full_name?: string | null;
  firm_name?: string | null;
  assigned_city?: string;
  status: string;
  trust_level?: string;
  completed_inspections?: number;
  completed_reviews?: number;
  fraud_flags_count?: number;
  performance_score?: number;
  payout_enabled?: boolean;
  payout_hold_reason?: string | null;
  bank_change_pending_review?: boolean;
  ambassador_code?: string;
};

type RequestRow = {
  id: string;
  request_reference: string;
  status: string;
  internal_risk_level?: string;
  buyer_full_name?: string;
  buyer_whatsapp?: string;
  property_title?: string;
  property_location_text?: string;
  is_diaspora_request?: boolean;
  review_type?: string;
  requested_at: string;
};

type AlertRow = {
  id: string;
  alert_type: string;
  title: string;
  body: string;
  reference_id: string | null;
  priority: string;
  created_at: string;
};

function waLink(phone: string | undefined | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function riskBadge(level?: string) {
  if (!level || level === "low") return null;
  const colors: Record<string, string> = {
    moderate: "bg-amber-100 text-amber-900",
    elevated: "bg-orange-100 text-orange-900",
    high: "bg-red-100 text-red-800",
    critical: "bg-red-200 text-red-900",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${colors[level] ?? "bg-surface text-muted"}`}>
      {level}
    </span>
  );
}

export function AdminTrustCommandCenter() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState<TabId>("verification_requests");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [propertyRequests, setPropertyRequests] = useState<RequestRow[]>([]);
  const [legalRequests, setLegalRequests] = useState<RequestRow[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [escalations, setEscalations] = useState<Record<string, unknown>[]>([]);
  const [fraudItems, setFraudItems] = useState<{
    property: RequestRow[];
    legal: RequestRow[];
  }>({ property: [], legal: [] });
  const [diasporaProperty, setDiasporaProperty] = useState<RequestRow[]>([]);
  const [diasporaLegal, setDiasporaLegal] = useState<RequestRow[]>([]);
  const [verifiers, setVerifiers] = useState<PartnerRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [verifierHolds, setVerifierHolds] = useState<PartnerRow[]>([]);
  const [partnerHolds, setPartnerHolds] = useState<PartnerRow[]>([]);
  const [ambassadorHolds, setAmbassadorHolds] = useState<PartnerRow[]>([]);
  const [listingFlags, setListingFlags] = useState<Record<string, unknown>[]>([]);
  const [verifierFraud, setVerifierFraud] = useState<PartnerRow[]>([]);
  const [partnerFraud, setPartnerFraud] = useState<PartnerRow[]>([]);
  const [selectedCase, setSelectedCase] = useState<{
    type: "property" | "legal";
    id: string;
    ref: string;
  } | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);

  const loadAlerts = useCallback(async () => {
    const res = await fetch("/api/admin/trust/alerts");
    const json = await res.json().catch(() => ({}));
    if (res.ok) setAlerts(json.alerts ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/trust?tab=${tab}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return;

    setSummary(json.summary ?? null);
    setPropertyRequests(json.propertyRequests ?? []);
    setLegalRequests(json.legalRequests ?? []);
    setAnalytics(json.analytics ?? null);
    setEscalations(json.escalations ?? []);
    if (tab === "fraud_review") {
      setFraudItems({
        property: json.propertyFraud ?? [],
        legal: json.legalFraud ?? [],
      });
      setListingFlags(json.listingFlags ?? []);
      setVerifierFraud(json.verifierFraud ?? []);
      setPartnerFraud(json.partnerFraud ?? []);
    }
    if (tab === "diaspora") {
      setDiasporaProperty(json.diasporaProperty ?? []);
      setDiasporaLegal(json.diasporaLegal ?? []);
    }
    if (tab === "field_verifiers") setVerifiers(json.verifiers ?? []);
    if (tab === "legal_partners") setPartners(json.partners ?? []);
    if (tab === "payout_holds") {
      setVerifierHolds(json.verifierHolds ?? []);
      setPartnerHolds(json.partnerHolds ?? []);
      setAmbassadorHolds(json.ambassadorHolds ?? []);
    }
  }, [tab]);

  useEffect(() => {
    void load();
    void loadAlerts();
  }, [load, loadAlerts]);

  async function loadCaseDetail(type: "property" | "legal", id: string, ref: string) {
    setSelectedCase({ type, id, ref });
    const res = await fetch(`/api/admin/trust/cases/${type}/${id}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setTimeline(json.timeline ?? []);
  }

  async function caseAction(action: string, extra?: Record<string, unknown>) {
    if (!selectedCase) return;
    await requirePin(async () => {
      const res = await fetch(`/api/admin/trust/cases/${selectedCase.type}/${selectedCase.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Action completed" : (json.error ?? "Failed"));
      await loadCaseDetail(selectedCase.type, selectedCase.id, selectedCase.ref);
      await load();
    });
  }

  async function dismissAlert(id: string) {
    await fetch("/api/admin/trust/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    await loadAlerts();
  }

  function renderRequestCard(row: RequestRow, type: "property" | "legal") {
    const adminLink =
      type === "property"
        ? `/lex/auth/property-verifications?ref=${encodeURIComponent(row.request_reference)}`
        : `/lex/auth/legal-partners?tab=pending`;

    return (
      <div key={row.id} className="rounded-xl border bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-navy text-sm truncate">{row.property_title ?? "Request"}</p>
            <p className="text-xs text-muted mt-0.5">
              {row.request_reference} · {row.status}
              {row.is_diaspora_request ? " · diaspora" : ""}
            </p>
            <p className="text-xs text-muted truncate">{row.property_location_text}</p>
          </div>
          {riskBadge(row.internal_risk_level)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {row.buyer_whatsapp ? (
            <a
              href={waLink(row.buyer_whatsapp) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white"
            >
              WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => loadCaseDetail(type, row.id, row.request_reference)}
            className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-navy"
          >
            Timeline
          </button>
          <Link href={adminLink} className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-muted">
            Open queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pinModal}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { label: "Property queue", value: summary.propertyQueue },
            { label: "Legal queue", value: summary.legalQueue },
            { label: "Fraud review", value: summary.propertyFraud + summary.legalFraud },
            { label: "Diaspora", value: summary.diasporaBacklog },
            { label: "Escalations", value: summary.openEscalations },
            { label: "Alerts", value: summary.unreadAlerts },
            { label: "Verifier holds", value: summary.verifierPayoutHolds },
            { label: "Legal holds", value: summary.legalPayoutHolds },
            { label: "Listing flags", value: summary.suspiciousListingFlags ?? 0 },
            { label: "Ambassador holds", value: summary.ambassadorPayoutHolds ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-2.5">
              <p className="text-lg font-bold text-navy">{s.value}</p>
              <p className="text-[10px] text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-bold uppercase text-amber-900">Unread ops alerts</p>
          {alerts.slice(0, 5).map((a) => (
            <div key={a.id} className="flex flex-wrap justify-between gap-2 text-xs">
              <span>
                <strong>{a.title}</strong> — {a.body}
              </span>
              <button type="button" onClick={() => dismissAlert(a.id)} className="font-bold text-navy">
                Dismiss
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TRUST_COMMAND_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? "bg-navy text-white" : "border bg-white text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <a
          href="/api/admin/trust/exports?kind=property_verifications"
          className="rounded-lg border px-2 py-1 font-bold text-navy"
        >
          Export property CSV
        </a>
        <a
          href="/api/admin/trust/exports?kind=legal_verifications"
          className="rounded-lg border px-2 py-1 font-bold text-navy"
        >
          Export legal CSV
        </a>
        <Link href="/lex/auth/verifiers" className="rounded-lg border px-2 py-1 font-bold text-muted">
          Verifiers board
        </Link>
        <Link href="/lex/auth/legal-partners" className="rounded-lg border px-2 py-1 font-bold text-muted">
          Legal partners
        </Link>
      </div>

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      {tab === "verification_requests" ? (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-navy">Property verification queue</h3>
          {propertyRequests.map((r) => renderRequestCard(r, "property"))}
          {!propertyRequests.length ? (
            <p className="text-sm text-muted">No active property verification requests.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "legal_reviews" ? (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-navy">Legal review assistance queue</h3>
          {legalRequests.map((r) => renderRequestCard(r, "legal"))}
          {!legalRequests.length ? (
            <p className="text-sm text-muted">No active legal review requests.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "fraud_review" ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-navy mb-2">Verification fraud review</h3>
            <div className="space-y-2">
              {fraudItems.property.map((r) => renderRequestCard(r, "property"))}
              {fraudItems.legal.map((r) => renderRequestCard(r, "legal"))}
            </div>
          </div>
          {listingFlags.length ? (
            <div>
              <h3 className="text-xs font-bold uppercase text-navy mb-2">Suspicious listings</h3>
              <div className="space-y-2">
                {listingFlags.map((f) => {
                  const prop = f.properties as { title?: string; city?: string; area?: string } | null;
                  return (
                    <div key={String(f.id)} className="rounded-xl border bg-white p-3 text-sm">
                      <p className="font-bold text-navy">
                        {prop?.title ?? "Listing"} · {String(f.flag_type)}
                      </p>
                      <p className="text-xs text-muted">
                        {prop?.city}, {prop?.area} · {String(f.severity)}
                      </p>
                      {f.detail ? <p className="text-xs mt-1">{String(f.detail)}</p> : null}
                      <Link
                        href={`/lex/auth/moderation?property=${String(f.property_id)}`}
                        className="mt-2 inline-block text-xs font-bold text-gold-dark"
                      >
                        Open moderation
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {(verifierFraud.length > 0 || partnerFraud.length > 0) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {verifierFraud.map((v) => (
                <div key={v.id} className="rounded-xl border bg-white p-3 text-xs">
                  <p className="font-bold text-navy">{v.full_name ?? v.verifier_code}</p>
                  <p className="text-muted">Verifier · fraud review</p>
                </div>
              ))}
              {partnerFraud.map((p) => (
                <div key={p.id} className="rounded-xl border bg-white p-3 text-xs">
                  <p className="font-bold text-navy">{p.firm_name ?? p.partner_code}</p>
                  <p className="text-muted">Legal partner · fraud review</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "escalations" ? (
        <div className="space-y-2">
          {escalations.map((e) => (
            <div key={String(e.id)} className="rounded-xl border bg-white p-3 text-sm">
              <p className="font-bold text-navy">
                {String(e.escalation_reference)} · {String(e.escalation_type)}
              </p>
              <p className="text-xs text-muted">{String(e.reason)}</p>
            </div>
          ))}
          {!escalations.length ? <p className="text-sm text-muted">No open escalations.</p> : null}
        </div>
      ) : null}

      {tab === "analytics" && analytics ? (
        <div className="rounded-xl border bg-white p-4 space-y-3 text-sm">
          <p>
            Avg completion: <strong>{String(analytics.avgCompletionDays)}</strong> days
          </p>
          <p>
            Diaspora backlog: <strong>{String(analytics.diasporaBacklog)}</strong>
          </p>
          <p className="text-xs text-muted">
            Top cities:{" "}
            {JSON.stringify(
              (analytics.topCities as { city: string; count: number }[] | undefined)?.slice(0, 5) ?? []
            )}
          </p>
        </div>
      ) : null}

      {tab === "trust_intelligence" ? <AdminTrustIntelligencePanel /> : null}

      {tab === "diaspora" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs text-muted mb-2">
              Diaspora pipeline — priority handling, admin-controlled assignment.
            </p>
            <h3 className="text-xs font-bold uppercase text-navy">Property</h3>
            {diasporaProperty.map((r) => renderRequestCard(r, "property"))}
            {!diasporaProperty.length ? <p className="text-sm text-muted">No active diaspora property requests.</p> : null}
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-navy">Legal</h3>
            {diasporaLegal.map((r) => renderRequestCard(r, "legal"))}
            {!diasporaLegal.length ? <p className="text-sm text-muted">No active diaspora legal requests.</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "payout_holds" ? (
        <div className="space-y-4">
          {[
            { title: "Field verifiers", rows: verifierHolds, href: "/lex/auth/verifiers/payouts" },
            { title: "Legal partners", rows: partnerHolds, href: "/lex/auth/legal-partners/payouts" },
            { title: "City ambassadors", rows: ambassadorHolds, href: "/lex/auth/ambassadors/payouts" },
          ].map((section) => (
            <div key={section.title}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-bold uppercase text-navy">{section.title}</h3>
                <Link href={section.href} className="text-xs font-bold text-gold-dark">
                  Payout board
                </Link>
              </div>
              <div className="space-y-2">
                {section.rows.map((row) => (
                  <div key={row.id} className="rounded-xl border bg-white p-3 text-xs">
                    <p className="font-bold text-navy">
                      {row.full_name ?? row.firm_name ?? row.verifier_code ?? row.partner_code ?? row.ambassador_code}
                    </p>
                    <p className="text-muted">{row.payout_hold_reason ?? "Payout frozen"}</p>
                    {row.bank_change_pending_review ? (
                      <p className="text-amber-700 font-bold mt-1">Bank change pending review</p>
                    ) : null}
                  </div>
                ))}
                {!section.rows.length ? (
                  <p className="text-sm text-muted">No payout holds.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "field_verifiers" ? (
        <div className="space-y-2">
          {verifiers.map((v) => (
            <div key={v.id} className="rounded-xl border bg-white p-3 text-sm flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">{v.full_name ?? v.verifier_code}</p>
                <p className="text-xs text-muted">
                  {v.assigned_city} · {v.status} · {v.completed_inspections ?? 0} inspections
                </p>
              </div>
              <span className="text-xs text-muted">Score {v.performance_score ?? "—"}</span>
            </div>
          ))}
          <Link href="/lex/auth/verifiers" className="text-xs font-bold text-gold-dark">
            Full verifiers board →
          </Link>
        </div>
      ) : null}

      {tab === "legal_partners" ? (
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white p-3 text-sm flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">{p.firm_name ?? p.partner_code}</p>
                <p className="text-xs text-muted">
                  {p.assigned_city} · {p.status} · {p.completed_reviews ?? 0} reviews
                </p>
              </div>
              <span className="text-xs text-muted">Score {p.performance_score ?? "—"}</span>
            </div>
          ))}
          <Link href="/lex/auth/legal-partners" className="text-xs font-bold text-gold-dark">
            Full legal partners board →
          </Link>
        </div>
      ) : null}

      {selectedCase ? (
        <section className="rounded-xl border-2 border-navy/20 bg-white p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-bold text-navy text-sm">
              Case {selectedCase.ref}
            </p>
            <button type="button" onClick={() => setSelectedCase(null)} className="text-xs text-muted">
              Close
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => caseAction("recalculate_risk")}
              className="rounded-lg border px-2 py-1 text-[11px] font-bold"
            >
              Recalc risk
            </button>
            <button
              type="button"
              onClick={() => caseAction("fraud_review")}
              className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700"
            >
              Fraud review
            </button>
            <button
              type="button"
              onClick={() =>
                caseAction("escalate", {
                  escalationType: "fraud_concern",
                  reason: "Trust command center escalation",
                })
              }
              className="rounded-lg bg-gold px-2 py-1 text-[11px] font-bold text-navy"
            >
              Escalate
            </button>
            {selectedCase.type === "property" ? (
              <button
                type="button"
                onClick={() => caseAction("reinspection")}
                className="rounded-lg border px-2 py-1 text-[11px] font-bold"
              >
                Re-inspection
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => caseAction("hold_listing")}
              className="rounded-lg border px-2 py-1 text-[11px] font-bold"
            >
              Hold listing
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {timeline.map((ev) => (
              <div key={String(ev.id)} className="text-xs border-b py-1.5">
                <span className="font-bold text-navy">{String(ev.title)}</span>
                <span className="text-muted ml-2">{String(ev.created_at).slice(0, 16)}</span>
                {ev.detail ? <p className="text-muted mt-0.5">{String(ev.detail)}</p> : null}
              </div>
            ))}
            {!timeline.length ? <p className="text-xs text-muted">No timeline events yet.</p> : null}
          </div>
        </section>
      ) : null}

      <p className="text-[10px] text-muted leading-relaxed border-l-2 border-gold pl-2">
        Yike coordinates verification assistance only — not ownership guarantees, title certification, or
        litigation immunity. All assignment and escalation decisions require admin judgment.
      </p>
    </div>
  );
}
