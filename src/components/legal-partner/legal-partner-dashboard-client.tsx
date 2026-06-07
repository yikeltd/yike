"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LEGAL_DISCLAIMER } from "@/lib/legal-partner/constants";

type Tab = "assignments" | "reports" | "payouts" | "bank" | "profile";

type BankOption = { name: string; code: string };

type Assignment = {
  id: string;
  reference: string;
  status: string;
  reviewType: string;
  fee: number;
  propertyTitle: string | null;
  location: string | null;
  notes: string | null;
  requestedAt: string;
};

type DashboardData = {
  partner: {
    code: string;
    firmName: string;
    city: string;
    state: string;
    status: string;
    trustLevel: string;
    completedReviews: number;
    totalPaid: number;
    payoutEnabled: boolean;
    payoutHoldReason: string | null;
    fullName: string | null;
    email: string | null;
  };
  bank: {
    bankName: string;
    bankCode: string;
    accountName: string;
    pendingReview: boolean;
  } | null;
  pendingEarnings: number;
  payableEarnings: number;
  heldEarnings: number;
  assignments: Assignment[];
  payouts: Array<{
    id: string;
    period_year_month: string;
    payable_amount: number;
    status: string;
    paid_at: string | null;
  }>;
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function LegalPartnerDashboardClient() {
  const [tab, setTab] = useState<Tab>("assignments");
  const [data, setData] = useState<DashboardData | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportRequestId, setReportRequestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [dashRes, banksRes] = await Promise.all([
      fetch("/api/legal-partner/dashboard"),
      fetch("/api/legal-partner/banks"),
    ]);
    const json = await dashRes.json().catch(() => ({}));
    const banksJson = await banksRes.json().catch(() => ({}));
    if (!dashRes.ok) {
      setError(json.error ?? "Could not load dashboard");
      setData(null);
      return;
    }
    setData(json);
    setBanks(banksJson.banks ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function acceptAssignment(id: string) {
    setBusy(true);
    const res = await fetch("/api/legal-partner/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", requestId: id }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? "Assignment accepted" : (json.error ?? "Failed"));
    if (res.ok) await load();
  }

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reportRequestId) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/legal-partner/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: reportRequestId,
        documentsReviewed: String(form.get("documentsReviewed") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        registrySearchConducted: form.get("registrySearchConducted") === "on",
        ownershipConsistency: form.get("ownershipConsistency"),
        litigationConcerns: form.get("litigationConcerns"),
        surveyConcerns: form.get("surveyConcerns"),
        encumbranceConcerns: form.get("encumbranceConcerns"),
        documentIrregularities: form.get("documentIrregularities"),
        riskObservations: form.get("riskObservations"),
        recommendationSummary: form.get("recommendationSummary"),
        overallRiskLevel: form.get("overallRiskLevel"),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not submit report");
      return;
    }
    setMessage("Report submitted for admin review");
    setReportRequestId(null);
    await load();
  }

  async function saveBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/legal-partner/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankCode: form.get("bankCode"),
        accountNumber: form.get("accountNumber"),
        accountName: form.get("accountName"),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? json.message : (json.error ?? "Could not save bank"));
    if (res.ok) await load();
  }

  if (error === "Not a legal partner") {
    return (
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="text-xl font-bold text-navy">Legal partner dashboard</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with an approved partner account, or apply to join the network.
        </p>
        <Link
          href="/become-a-legal-partner"
          className="mt-4 inline-block rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy"
        >
          Apply to become a legal partner
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/auth/login" className="mt-3 inline-block text-sm font-bold text-gold-dark">
          Sign in
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-sm text-muted">Loading…</p>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "assignments", label: "Assignments" },
    { id: "reports", label: "Submit report" },
    { id: "payouts", label: "Payouts" },
    { id: "bank", label: "Bank" },
    { id: "profile", label: "Profile" },
  ];

  const inProgress = data.assignments.filter((a) => a.status === "in_progress");
  const assigned = data.assignments.filter((a) => a.status === "assigned");

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">Legal partner</p>
        <h1 className="text-2xl font-bold text-navy">{data.partner.firmName}</h1>
        <p className="text-sm text-muted">
          {data.partner.code} · {data.partner.city}, {data.partner.state} · {data.partner.status}
        </p>
      </div>

      <p className="mb-4 text-xs text-muted leading-relaxed">{LEGAL_DISCLAIMER}</p>

      {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="mb-6 flex flex-wrap gap-2">
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

      {tab === "assignments" ? (
        <div className="space-y-3">
          {assigned.map((a) => (
            <div key={a.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">{a.propertyTitle ?? "Legal review"}</p>
              <p className="text-xs text-muted">
                {a.reference} · {a.reviewType} · {formatNaira(a.fee)}
              </p>
              <p className="text-xs text-muted mt-1">{a.location}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => acceptAssignment(a.id)}
                className="mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
              >
                Accept assignment
              </button>
            </div>
          ))}
          {inProgress.map((a) => (
            <div key={a.id} className="rounded-xl border bg-white p-4">
              <p className="font-bold text-navy">{a.propertyTitle ?? "In progress"}</p>
              <p className="text-xs text-muted">{a.reference} · in progress</p>
              <button
                type="button"
                onClick={() => {
                  setReportRequestId(a.id);
                  setTab("reports");
                }}
                className="mt-3 rounded-lg border px-3 py-1.5 text-xs font-bold text-navy"
              >
                Submit report
              </button>
            </div>
          ))}
          {!assigned.length && !inProgress.length ? (
            <p className="text-sm text-muted">No active assignments.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "reports" ? (
        <form onSubmit={submitReport} className="space-y-4 rounded-xl border bg-white p-4">
          {!reportRequestId ? (
            <p className="text-sm text-muted">Select an in-progress assignment first.</p>
          ) : (
            <>
              <p className="text-xs font-bold text-navy">Structured legal review report</p>
              <label className="block">
                <span className="text-xs font-semibold">Documents reviewed (comma-separated)</span>
                <input name="documentsReviewed" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input name="registrySearchConducted" type="checkbox" />
                Registry search conducted
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Ownership consistency observed</span>
                <textarea name="ownershipConsistency" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Litigation concerns</span>
                <textarea name="litigationConcerns" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Survey concerns</span>
                <textarea name="surveyConcerns" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Encumbrance concerns</span>
                <textarea name="encumbranceConcerns" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Document irregularities</span>
                <textarea name="documentIrregularities" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Risk observations *</span>
                <textarea name="riskObservations" required rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Recommendation summary *</span>
                <textarea name="recommendationSummary" required rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Overall risk level *</span>
                <select name="overallRiskLevel" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="unclear">Unclear</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy"
              >
                Submit for admin review
              </button>
            </>
          )}
        </form>
      ) : null}

      {tab === "payouts" ? (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted">Pending</p>
              <p className="font-bold text-navy">{formatNaira(data.pendingEarnings)}</p>
            </div>
            <div>
              <p className="text-muted">Payable</p>
              <p className="font-bold text-navy">{formatNaira(data.payableEarnings)}</p>
            </div>
            <div>
              <p className="text-muted">Held</p>
              <p className="font-bold text-navy">{formatNaira(data.heldEarnings)}</p>
            </div>
          </div>
          {!data.partner.payoutEnabled ? (
            <p className="text-xs text-amber-800">
              Payouts paused: {data.partner.payoutHoldReason ?? "Pending bank review"}
            </p>
          ) : null}
          {data.payouts.map((p) => (
            <div key={p.id} className="flex justify-between text-xs border-t pt-2">
              <span>{p.period_year_month}</span>
              <span>
                {formatNaira(Number(p.payable_amount))} · {p.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "bank" ? (
        <form onSubmit={saveBank} className="space-y-4 rounded-xl border bg-white p-4">
          <p className="text-xs text-muted">Commercial bank accounts only. Changes pause payouts until admin review.</p>
          {data.bank ? (
            <p className="text-xs text-navy">
              Current: {data.bank.bankName} · {data.bank.accountName}
              {data.bank.pendingReview ? " (pending review)" : ""}
            </p>
          ) : null}
          <label className="block">
            <span className="text-xs font-semibold">Bank</span>
            <select name="bankCode" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Select bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Account number</span>
            <input name="accountNumber" required maxLength={10} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Account name</span>
            <input name="accountName" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-navy py-2.5 text-sm font-bold text-white">
            Save bank details
          </button>
        </form>
      ) : null}

      {tab === "profile" ? (
        <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
          <p>
            <span className="text-muted">Name:</span> {data.partner.fullName}
          </p>
          <p>
            <span className="text-muted">Email:</span> {data.partner.email}
          </p>
          <p>
            <span className="text-muted">Trust level:</span> {data.partner.trustLevel}
          </p>
          <p>
            <span className="text-muted">Completed reviews:</span> {data.partner.completedReviews}
          </p>
        </div>
      ) : null}
    </div>
  );
}
