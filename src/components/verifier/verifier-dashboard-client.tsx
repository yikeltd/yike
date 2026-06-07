"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { LEGAL_DISCLAIMER } from "@/lib/verifier/constants";
import { OCCUPANCY_OPTIONS, PHOTO_CHECKLIST_ITEMS } from "@/lib/verification/constants";

type Tab = "assignments" | "reports" | "payouts" | "bank" | "profile";

type BankOption = { name: string; code: string };

type Assignment = {
  id: string;
  status: string;
  verifierFee: number;
  requesterNotes: string | null;
  assignmentNotes: string | null;
  requestedAt: string;
  property: { id: string; title: string; city: string; area: string; addressHint: string | null } | null;
};

type DashboardData = {
  verifier: {
    code: string;
    city: string;
    state: string;
    status: string;
    trustLevel: string;
    completedInspections: number;
    totalEarnings: number;
    totalPaid: number;
    payoutEnabled: boolean;
    payoutHoldReason: string | null;
    bankChangePendingReview: boolean;
    fullName: string | null;
    email: string | null;
    whatsappNumber: string | null;
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

export function VerifierDashboardClient() {
  const [tab, setTab] = useState<Tab>("assignments");
  const [data, setData] = useState<DashboardData | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportRequestId, setReportRequestId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [photoChecklist, setPhotoChecklist] = useState<Record<string, boolean>>({});
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(
    data?.verifier.email
  );

  const load = useCallback(async () => {
    const [dashRes, banksRes] = await Promise.all([
      fetch("/api/verifier/dashboard"),
      fetch("/api/verifier/banks"),
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
    const res = await fetch("/api/verifier/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", requestId: id }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? "Assignment accepted" : (json.error ?? "Failed"));
    if (res.ok) await load();
  }

  async function uploadImage(file: File, requestId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("requestId", requestId);
    const res = await fetch("/api/verifier/media/upload", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Upload failed");
    return json.url as string;
  }

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reportRequestId) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/verifier/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: reportRequestId,
        propertyFound: form.get("propertyFound") === "on",
        propertyAccessible: form.get("propertyAccessible") === "on",
        photosMatchListing: form.get("photosMatchListing") === "on",
        occupancyStatus: form.get("occupancyStatus"),
        neighborhoodNotes: form.get("neighborhoodNotes"),
        roadAccessNotes: form.get("roadAccessNotes"),
        physicalConditionNotes: form.get("physicalConditionNotes"),
        metAgentOrContact: form.get("metAgentOrContact") === "on",
        contactPersonName: form.get("contactPersonName"),
        inspectionSummary: form.get("inspectionSummary"),
        verifierConfidenceLevel: form.get("verifierConfidenceLevel"),
        uploadedImages,
        photoChecklist,
        neighborhoodQuality: form.get("neighborhoodQuality"),
        localFeedback: form.get("localFeedback"),
        suspiciousSigns: form.get("suspiciousSigns"),
        overallObservation: form.get("overallObservation"),
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
    setUploadedImages([]);
    await load();
  }

  async function saveBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const gate = await gateSensitiveAction("change_payout_bank");
    if (!gate.ok) return;

    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/verifier/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankCode: form.get("bankCode"),
        accountNumber: form.get("accountNumber"),
        accountName: form.get("accountName"),
        sensitiveConfirmationToken: gate.confirmationToken,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? json.message : (json.error ?? "Could not save bank"));
    if (res.ok) await load();
  }

  if (error === "Not a field verifier") {
    return (
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="text-xl font-bold text-navy">Verifier dashboard</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with an approved verifier account, or apply to join the network.
        </p>
        <Link href="/become-a-field-verifier" className="mt-4 inline-block rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy">
          Apply to become a verifier
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

  const { verifier } = data;
  const tabs: { id: Tab; label: string }[] = [
    { id: "assignments", label: "Assignments" },
    { id: "reports", label: "Submit report" },
    { id: "payouts", label: "Payouts" },
    { id: "bank", label: "Bank" },
    { id: "profile", label: "Profile" },
  ];

  const activeAssignments = data.assignments.filter((a) =>
    ["assigned", "accepted", "in_progress"].includes(a.status)
  );

  return (
    <div className="mx-auto max-w-3xl px-4">
      {sensitiveActionModals}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">Field verifier</p>
        <h1 className="text-2xl font-bold text-navy">{verifier.fullName ?? "Dashboard"}</h1>
        <p className="text-sm text-muted">
          {verifier.code} · {verifier.city}, {verifier.state} · {verifier.status}
        </p>
      </div>

      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Completed" value={String(verifier.completedInspections)} />
        <Stat label="Payable" value={formatNaira(data.payableEarnings)} />
        <Stat label="Pending" value={formatNaira(data.pendingEarnings)} />
        <Stat label="Paid" value={formatNaira(verifier.totalPaid)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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

      {tab === "assignments" ? (
        <div className="space-y-3">
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted">No active assignments. Yike assigns jobs — you cannot self-pick.</p>
          ) : (
            activeAssignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-surface bg-white p-4">
                <p className="font-bold text-navy">{a.property?.title ?? "Property"}</p>
                <p className="text-xs text-muted">
                  {a.property?.area}, {a.property?.city} · {formatNaira(a.verifierFee)} · {a.status}
                </p>
                {a.assignmentNotes ? <p className="mt-2 text-xs text-muted">Note: {a.assignmentNotes}</p> : null}
                {a.status === "assigned" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => acceptAssignment(a.id)}
                    className="mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
                  >
                    Accept assignment
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReportRequestId(a.id);
                      setTab("reports");
                    }}
                    className="mt-3 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-gold"
                  >
                    Submit report
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="rounded-xl border border-surface bg-white p-4">
          {!reportRequestId ? (
            <p className="text-sm text-muted">Select an accepted assignment first, or pick one below.</p>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            {activeAssignments
              .filter((a) => a.status !== "assigned")
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setReportRequestId(a.id)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    reportRequestId === a.id ? "bg-navy text-gold" : "bg-surface text-muted"
                  }`}
                >
                  {a.property?.title?.slice(0, 24) ?? a.id.slice(0, 8)}
                </button>
              ))}
          </div>
          {reportRequestId ? (
            <form onSubmit={submitReport} className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input name="propertyFound" type="checkbox" /> Property found at location
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="propertyAccessible" type="checkbox" /> Property accessible for viewing
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="photosMatchListing" type="checkbox" /> Photos roughly match listing
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="metAgentOrContact" type="checkbox" /> Met agent or contact on site
              </label>
              <select name="occupancyStatus" required className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Property status observation *</option>
                {OCCUPANCY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <textarea name="neighborhoodNotes" placeholder="Neighborhood notes" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea name="roadAccessNotes" placeholder="Road access" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea name="physicalConditionNotes" placeholder="Physical condition" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input name="contactPersonName" placeholder="Contact person name (optional)" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea name="inspectionSummary" required placeholder="Inspection summary *" rows={4} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <select name="verifierConfidenceLevel" className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="medium">Confidence: medium</option>
                <option value="high">Confidence: high</option>
                <option value="low">Confidence: low</option>
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                {PHOTO_CHECKLIST_ITEMS.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(photoChecklist[item.id])}
                      onChange={() =>
                        setPhotoChecklist((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-navy">Photos ({uploadedImages.length} — min 3)</p>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !reportRequestId) return;
                    void uploadImage(file, reportRequestId)
                      .then((url) => setUploadedImages((prev) => [...prev, url]))
                      .catch((err) => setMessage(err instanceof Error ? err.message : "Upload failed"));
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-xs text-muted">{LEGAL_DISCLAIMER}</p>
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy">
                {busy ? "Submitting…" : "Submit report"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {tab === "payouts" ? (
        <div className="space-y-2">
          {!verifier.payoutEnabled ? (
            <p className="text-sm text-amber-800">
              Payouts paused{verifier.payoutHoldReason ? `: ${verifier.payoutHoldReason}` : ""}.
            </p>
          ) : null}
          {data.payouts.length === 0 ? (
            <p className="text-sm text-muted">No payouts yet.</p>
          ) : (
            data.payouts.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
                {p.period_year_month} · {formatNaira(Number(p.payable_amount))} · {p.status}
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "bank" ? (
        <form onSubmit={saveBank} className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-xs text-muted">Traditional commercial banks only. Changes pause payouts until admin review.</p>
          <select name="bankCode" required defaultValue={data.bank?.bankCode ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Select bank</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <input name="accountNumber" required maxLength={10} placeholder="Account number" defaultValue="" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input name="accountName" required placeholder="Account name" defaultValue={data.bank?.accountName ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm" />
          {data.bank ? (
            <p className="text-xs text-muted">
              Current: {data.bank.bankName} · {data.bank.accountName}
              {data.bank.pendingReview ? " · pending review" : ""}
            </p>
          ) : null}
          <button type="submit" disabled={busy} className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold">
            Save bank details
          </button>
        </form>
      ) : null}

      {tab === "profile" ? (
        <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
          <p>
            <span className="text-muted">Email:</span> {verifier.email}
          </p>
          <p>
            <span className="text-muted">WhatsApp:</span> {verifier.whatsappNumber ?? "—"}
          </p>
          <p>
            <span className="text-muted">Trust level:</span> {verifier.trustLevel}
          </p>
          <p className="text-xs text-muted pt-2">{LEGAL_DISCLAIMER}</p>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-navy">{value}</p>
    </div>
  );
}
