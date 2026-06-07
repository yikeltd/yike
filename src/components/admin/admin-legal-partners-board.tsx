"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type Tab =
  | "applications"
  | "approved"
  | "pending"
  | "assignments"
  | "reviews"
  | "reports"
  | "fraud_review"
  | "inactive";

type Application = {
  id: string;
  full_name: string;
  email: string;
  firm_name: string;
  city: string;
  state: string;
  status: string;
  why_apply: string;
  created_at: string;
};

type Partner = {
  id: string;
  partner_code: string;
  full_name: string | null;
  firm_name: string;
  assigned_city: string;
  assigned_state: string;
  status: string;
  completed_reviews: number;
  fraud_flags_count: number;
};

type LegalRequest = {
  id: string;
  request_reference: string;
  status: string;
  review_type: string;
  partner_fee: number;
  property_title: string | null;
  property_location_text: string | null;
  buyer_full_name: string | null;
  buyer_whatsapp: string | null;
  is_diaspora_request: boolean;
  assigned_legal_partner_id: string | null;
  legal_partners?: { partner_code: string; full_name: string | null; firm_name: string } | null;
};

type Report = {
  id: string;
  overall_risk_level: string;
  risk_observations: string;
  recommendation_summary: string;
  submitted_at: string;
  legal_partners?: { partner_code: string; full_name: string | null; firm_name: string };
  legal_verification_requests?: {
    request_reference: string;
    property_title: string | null;
  } | null;
};

export function AdminLegalPartnersBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [approvedList, setApprovedList] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState<Record<string, string>>({});
  const [deliverySummary, setDeliverySummary] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/legal-partners?tab=${tab}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return;

    if (tab === "applications") setApplications(json.applications ?? []);
    if (tab === "approved" || tab === "inactive" || tab === "fraud_review") {
      setPartners(json.partners ?? []);
    }
    if (tab === "pending" || tab === "assignments" || tab === "reviews") {
      setRequests(json.requests ?? []);
    }
    if (tab === "reports") setReports(json.reports ?? []);

    if (tab === "pending" || tab === "assignments" || tab === "reviews") {
      const pRes = await fetch("/api/admin/legal-partners?tab=approved");
      const pJson = await pRes.json().catch(() => ({}));
      setApprovedList(pJson.partners ?? []);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approveApplication(id: string) {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/legal-partners/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? `Approved · ${json.code}` : (json.error ?? "Failed"));
      await load();
    });
  }

  async function rejectApplication(id: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/legal-partners/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      await load();
    });
  }

  async function setPartnerStatus(id: string, status: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/legal-partners/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    });
  }

  async function requestAction(requestId: string, action: string, extra?: Record<string, unknown>) {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/legal-partners/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Updated" : (json.error ?? "Failed"));
      await load();
    });
  }

  async function assignRequest(requestId: string) {
    const partnerId = assignPartnerId[requestId];
    if (!partnerId) {
      setMessage("Select a legal partner first");
      return;
    }
    await requestAction(requestId, "assign", { partnerId });
  }

  async function reviewReport(reportId: string, action: "approve" | "reject" | "fraud_review") {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/legal-partners/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? `Report ${action}` : (json.error ?? "Failed"));
      await load();
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "applications", label: "Applications" },
    { id: "approved", label: "Approved" },
    { id: "pending", label: "Pending" },
    { id: "assignments", label: "Assignments" },
    { id: "reviews", label: "Reviews" },
    { id: "reports", label: "Reports" },
    { id: "fraud_review", label: "Fraud Review" },
    { id: "inactive", label: "Inactive" },
  ];

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
              tab === t.id ? "bg-navy text-white" : "border border-surface bg-white text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      {tab === "applications" ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">
                {app.full_name} · {app.firm_name}
              </p>
              <p className="text-xs text-muted">
                {app.city}, {app.state} · {app.email} · {app.status}
              </p>
              <p className="mt-2 text-xs text-muted line-clamp-2">{app.why_apply}</p>
              {app.status === "pending" || app.status === "under_review" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => approveApplication(app.id)}
                    className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectApplication(app.id)}
                    className="rounded-lg border px-3 py-1 text-xs font-bold text-muted"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {(tab === "approved" || tab === "inactive" || tab === "fraud_review") ? (
        <div className="space-y-3">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white p-4 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">
                  {p.firm_name} · {p.partner_code}
                </p>
                <p className="text-xs text-muted">
                  {p.assigned_city} · {p.status} · {p.completed_reviews} reviews · flags{" "}
                  {p.fraud_flags_count}
                </p>
              </div>
              <div className="flex gap-2">
                {p.status === "approved" ? (
                  <button
                    type="button"
                    onClick={() => setPartnerStatus(p.id, "paused")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Pause
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPartnerStatus(p.id, "suspended")}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {(tab === "pending" || tab === "assignments" || tab === "reviews") ? (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">{r.property_title ?? "Legal request"}</p>
              <p className="text-xs text-muted">
                {r.request_reference} · {r.property_location_text} · {r.status} · {r.review_type}
                {r.is_diaspora_request ? " · diaspora" : ""}
              </p>
              {r.buyer_whatsapp ? (
                <a
                  href={`https://wa.me/${r.buyer_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-bold text-emerald-700"
                >
                  WhatsApp {r.buyer_full_name}
                </a>
              ) : null}
              {r.legal_partners ? (
                <p className="text-xs text-muted mt-1">
                  Partner: {r.legal_partners.firm_name} ({r.legal_partners.partner_code})
                </p>
              ) : null}

              {tab === "pending" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => requestAction(r.id, "mark_contacted")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Contacted
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAction(r.id, "awaiting_documents")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Awaiting docs
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAction(r.id, "awaiting_assignment")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Ready to assign
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAction(r.id, "fraud_review")}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                  >
                    Fraud review
                  </button>
                </div>
              ) : null}

              {tab === "pending" && !r.assigned_legal_partner_id ? (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <select
                    className="rounded-lg border px-2 py-1 text-xs"
                    value={assignPartnerId[r.id] ?? ""}
                    onChange={(e) =>
                      setAssignPartnerId((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                  >
                    <option value="">Select legal partner</option>
                    {approvedList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firm_name} · {p.assigned_city}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assignRequest(r.id)}
                    className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
                  >
                    Assign
                  </button>
                </div>
              ) : null}

              {tab === "reviews" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-lg border px-2 py-1 text-xs"
                    rows={3}
                    placeholder="Buyer-facing summary (no guarantees, observations only)"
                    value={deliverySummary[r.id] ?? ""}
                    onChange={(e) =>
                      setDeliverySummary((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      requestAction(r.id, "deliver", { buyerSummary: deliverySummary[r.id] })
                    }
                    className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
                  >
                    Deliver to buyer
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">
                {rep.legal_verification_requests?.property_title ?? "Report"} ·{" "}
                {rep.overall_risk_level}
              </p>
              <p className="text-xs text-muted">
                {rep.legal_verification_requests?.request_reference} ·{" "}
                {rep.legal_partners?.firm_name}
              </p>
              <p className="mt-2 text-sm line-clamp-3">{rep.recommendation_summary}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => reviewReport(rep.id, "approve")}
                  className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reviewReport(rep.id, "reject")}
                  className="rounded-lg border px-3 py-1 text-xs font-bold"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => reviewReport(rep.id, "fraud_review")}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-700"
                >
                  Fraud review
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
