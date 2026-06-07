"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type Tab =
  | "applications"
  | "approved"
  | "pending"
  | "assignments"
  | "reports"
  | "fraud_review"
  | "inactive";

type Application = {
  id: string;
  full_name: string;
  email: string;
  city: string;
  state: string;
  status: string;
  coverage_areas: string | null;
  why_apply: string;
  created_at: string;
};

type Verifier = {
  id: string;
  verifier_code: string;
  full_name: string | null;
  assigned_city: string;
  assigned_state: string;
  status: string;
  completed_inspections: number;
  fraud_flags_count: number;
};

type VerificationRequest = {
  id: string;
  status: string;
  verifier_fee: number;
  requester_notes: string | null;
  requested_at: string;
  assigned_verifier_id: string | null;
  properties?: { title: string; city: string; area: string } | null;
  field_verifiers?: { verifier_code: string; full_name: string | null } | null;
};

type Report = {
  id: string;
  inspection_summary: string;
  verifier_confidence_level: string;
  property_found: boolean;
  submitted_at: string;
  field_verifiers?: { verifier_code: string; full_name: string | null };
  property_verification_requests?: {
    properties?: { title: string; city: string } | null;
  } | null;
};

export function AdminVerifiersBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [approvedList, setApprovedList] = useState<Verifier[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [assignVerifierId, setAssignVerifierId] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/verifiers?tab=${tab}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return;

    if (tab === "applications") setApplications(json.applications ?? []);
    if (tab === "approved" || tab === "inactive" || tab === "fraud_review") {
      setVerifiers(json.verifiers ?? []);
    }
    if (tab === "pending" || tab === "assignments") setRequests(json.requests ?? []);
    if (tab === "reports") setReports(json.reports ?? []);

    if (tab === "pending" || tab === "assignments") {
      const vRes = await fetch("/api/admin/verifiers?tab=approved");
      const vJson = await vRes.json().catch(() => ({}));
      setApprovedList(vJson.verifiers ?? []);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approveApplication(id: string) {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/verifiers/applications/${id}`, {
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
      await fetch(`/api/admin/verifiers/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      await load();
    });
  }

  async function setVerifierStatus(id: string, status: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/verifiers/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    });
  }

  async function assignRequest(requestId: string) {
    const verifierId = assignVerifierId[requestId];
    if (!verifierId) {
      setMessage("Select a verifier first");
      return;
    }
    await requirePin(async () => {
      const res = await fetch(`/api/admin/verifiers/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", verifierId }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Assigned" : (json.error ?? "Failed"));
      await load();
    });
  }

  async function reviewReport(reportId: string, action: "approve" | "reject" | "fraud_review") {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/verifiers/reports/${reportId}`, {
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
              <p className="font-bold text-navy">{app.full_name}</p>
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
          {verifiers.map((v) => (
            <div key={v.id} className="rounded-xl border bg-white p-4 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">
                  {v.full_name ?? v.verifier_code} · {v.verifier_code}
                </p>
                <p className="text-xs text-muted">
                  {v.assigned_city} · {v.status} · {v.completed_inspections} inspections · flags{" "}
                  {v.fraud_flags_count}
                </p>
              </div>
              <div className="flex gap-2">
                {v.status === "approved" ? (
                  <button
                    type="button"
                    onClick={() => setVerifierStatus(v.id, "paused")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Pause
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setVerifierStatus(v.id, "suspended")}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {(tab === "pending" || tab === "assignments") ? (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">{r.properties?.title ?? "Property"}</p>
              <p className="text-xs text-muted">
                {r.properties?.area}, {r.properties?.city} · {r.status} · ₦
                {Number(r.verifier_fee).toLocaleString()}
              </p>
              {r.field_verifiers ? (
                <p className="text-xs text-muted mt-1">
                  Verifier: {r.field_verifiers.full_name ?? r.field_verifiers.verifier_code}
                </p>
              ) : null}
              {tab === "pending" && !r.assigned_verifier_id ? (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <select
                    className="rounded-lg border px-2 py-1 text-xs"
                    value={assignVerifierId[r.id] ?? ""}
                    onChange={(e) =>
                      setAssignVerifierId((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                  >
                    <option value="">Select verifier</option>
                    {approvedList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.full_name ?? v.verifier_code} · {v.assigned_city}
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
            </div>
          ))}
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">
                {rep.property_verification_requests?.properties?.title ?? "Report"}
              </p>
              <p className="text-xs text-muted">
                {rep.field_verifiers?.verifier_code} · {rep.verifier_confidence_level} · found:{" "}
                {rep.property_found ? "yes" : "no"}
              </p>
              <p className="mt-2 text-sm line-clamp-3">{rep.inspection_summary}</p>
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
