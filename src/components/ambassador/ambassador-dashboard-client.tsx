"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { NIGERIAN_STATES } from "@/lib/constants";
import { REVENUE_SOURCE_LABELS } from "@/lib/ambassador/constants";
import type { RevenueSourceType } from "@/lib/ambassador/constants";

type Tab = "overview" | "earnings" | "onboarded" | "payouts" | "referral" | "account";

type BankOption = { name: string; code: string };

type DashboardData = {
  ambassador: {
    code: string;
    referralLink: string;
    city: string;
    state: string;
    status: string;
    commissionRate: number;
    onboardingCount: number;
    activeRevenueAccounts: number;
    totalVisibleEarnings: number;
    currentMonthEarnings: number;
    totalPaid: number;
    payoutEnabled: boolean;
    payoutHoldReason: string | null;
    bankChangePendingReview: boolean;
    verificationLevel: string;
    verificationStatus: string;
    residentialAddress: string | null;
    residentialCity: string | null;
    residentialState: string | null;
    nearestLandmark: string | null;
    whatsappNumber: string | null;
    phoneNumber: string | null;
    fullName: string | null;
    email: string | null;
  };
  bank: {
    bankName: string;
    bankCode: string;
    accountName: string;
    pendingReview: boolean;
    updatedAt: string;
  } | null;
  pendingEarnings: number;
  payableEarnings: number;
  heldEarnings: number;
  commissions: Array<{
    id: string;
    commission_amount: number;
    status: string;
    revenue_source_type: string;
    created_at: string;
  }>;
  onboarded: Array<{
    id: string;
    name: string;
    role: string;
    plan: string;
    attributedAt: string | null;
    isPaying: boolean;
  }>;
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

export function AmbassadorDashboardClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bankSaving, setBankSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(
    data?.ambassador.email
  );

  const load = useCallback(async () => {
    const [dashRes, banksRes] = await Promise.all([
      fetch("/api/ambassador/dashboard"),
      fetch("/api/ambassador/banks"),
    ]);
    const json = await dashRes.json().catch(() => ({}));
    const banksJson = await banksRes.json().catch(() => ({}));
    if (!dashRes.ok) {
      setError(json.error ?? "Could not load dashboard");
      return;
    }
    setData(json);
    setBanks(banksJson.banks ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  async function saveBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const gate = await gateSensitiveAction("change_payout_bank");
    if (!gate.ok) return;

    setBankSaving(true);
    setActionMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/ambassador/bank", {
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
    setBankSaving(false);
    setActionMessage(res.ok ? json.message ?? "Bank details saved" : (json.error ?? "Could not save"));
    if (res.ok) await load();
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const gate = await gateSensitiveAction("change_identity");
    if (!gate.ok) return;

    setProfileSaving(true);
    setActionMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/ambassador/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        residentialAddress: form.get("residentialAddress"),
        residentialCity: form.get("residentialCity"),
        residentialState: form.get("residentialState"),
        nearestLandmark: form.get("nearestLandmark"),
        phoneNumber: form.get("phoneNumber"),
        whatsappNumber: form.get("whatsappNumber"),
        sensitiveConfirmationToken: gate.confirmationToken,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setProfileSaving(false);
    setActionMessage(res.ok ? "Profile updated" : (json.error ?? "Could not save"));
    if (res.ok) await load();
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-surface bg-white p-6 text-center">
        <p className="text-sm text-muted">{error}</p>
        <Link href="/become-an-ambassador" className="mt-3 inline-block text-sm font-bold text-gold-dark">
          Apply to become an ambassador
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="mx-auto max-w-3xl animate-pulse rounded-2xl bg-surface/60 p-8">Loading…</div>;
  }

  const a = data.ambassador;
  const inactive = a.status === "inactive" || a.status === "paused" || a.status === "disabled";
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "earnings", label: "Earnings" },
    { id: "onboarded", label: "Onboarded" },
    { id: "payouts", label: "Payouts" },
    { id: "referral", label: "Tools" },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 pb-16">
      {sensitiveActionModals}
      {inactive ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your ambassador account is {a.status}. Onboarding may be paused — contact Yike support if you need help.
        </div>
      ) : null}

      {!a.payoutEnabled || a.bankChangePendingReview ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {a.payoutHoldReason ??
            "Payouts are paused until your bank details are reviewed by the Yike team."}
        </div>
      ) : null}

      <div className="rounded-2xl bg-navy p-5 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide text-white/70">City Ambassador · {a.verificationLevel}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {a.fullName ?? a.city}, {a.state}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {a.onboardingCount} onboarded · {a.activeRevenueAccounts} paying accounts
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t.id ? "bg-gold text-navy" : "bg-white text-muted border border-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {actionMessage ? <p className="text-sm text-emerald-700">{actionMessage}</p> : null}

      {tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "This month", value: formatNaira(a.currentMonthEarnings) },
            { label: "Pending (hold)", value: formatNaira(data.pendingEarnings) },
            { label: "Payable", value: formatNaira(data.payableEarnings) },
            { label: "Total paid", value: formatNaira(a.totalPaid) },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-surface bg-white p-4">
              <p className="text-xs text-muted">{card.label}</p>
              <p className="mt-1 text-xl font-bold text-navy">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "earnings" ? (
        <div className="space-y-2">
          {data.commissions.length === 0 ? (
            <p className="text-sm text-muted">
              No visible earnings yet. Commission appears only after real, settled platform revenue from your referrals.
            </p>
          ) : (
            data.commissions.map((c) => (
              <div key={c.id} className="rounded-xl border border-surface bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{formatNaira(Number(c.commission_amount))}</p>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                    {c.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {REVENUE_SOURCE_LABELS[c.revenue_source_type as RevenueSourceType] ??
                    c.revenue_source_type}{" "}
                  · {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "onboarded" ? (
        <div className="space-y-2">
          {data.onboarded.length === 0 ? (
            <p className="text-sm text-muted">No onboarded accounts yet. Share your referral link to get started.</p>
          ) : (
            data.onboarded.map((o) => (
              <div key={o.id} className="rounded-xl border border-surface bg-white p-4">
                <p className="font-semibold text-navy">{o.name}</p>
                <p className="text-xs text-muted">
                  {o.role} · {o.plan} {o.isPaying ? "· paying" : ""}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "payouts" ? (
        <div className="space-y-3">
          {data.bank ? (
            <div className="rounded-xl border border-surface bg-white p-4 text-sm">
              <p className="font-semibold text-navy">Payout account</p>
              <p className="mt-1 text-muted">
                {data.bank.bankName} · {data.bank.accountName}
                {data.bank.pendingReview ? " · pending review" : ""}
              </p>
            </div>
          ) : null}
          {data.payouts.length === 0 ? (
            <p className="text-sm text-muted">No payouts yet. Payouts are reviewed manually by the Yike team.</p>
          ) : (
            data.payouts.map((p) => (
              <div key={p.id} className="rounded-xl border border-surface bg-white p-4">
                <p className="font-semibold text-navy">{formatNaira(Number(p.payable_amount))}</p>
                <p className="text-xs text-muted">
                  {p.period_year_month} · {p.status}
                  {p.paid_at ? ` · paid ${new Date(p.paid_at).toLocaleDateString()}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "referral" ? (
        <div className="rounded-xl border border-surface bg-white p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-navy">Referral code</p>
            <div className="mt-1 flex gap-2">
              <code className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm font-bold">{a.code}</code>
              <button type="button" onClick={() => copyText(a.code)} className="rounded-lg bg-gold px-3 text-xs font-bold text-navy">
                Copy
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-navy">Referral link</p>
            <div className="mt-1 flex gap-2">
              <input readOnly value={a.referralLink} className="flex-1 rounded-lg border border-surface px-3 py-2 text-xs" />
              <button type="button" onClick={() => copyText(a.referralLink)} className="rounded-lg bg-navy px-3 text-xs font-bold text-white">
                Copy
              </button>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join Yike with my ambassador link: ${a.referralLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white"
          >
            Share on WhatsApp
          </a>
          <p className="text-xs text-muted">
            Onboard agents and property businesses with your link. You earn 10% commission on net revenue only — not free signups.
          </p>
        </div>
      ) : null}

      {tab === "account" ? (
        <div className="space-y-4">
          <form onSubmit={saveProfile} className="rounded-xl border border-surface bg-white p-5 space-y-3">
            <p className="text-sm font-bold text-navy">Address & contact</p>
            <textarea
              name="residentialAddress"
              required
              defaultValue={a.residentialAddress ?? ""}
              placeholder="Residential address"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
              rows={2}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="residentialCity"
                required
                defaultValue={a.residentialCity ?? a.city}
                placeholder="City"
                className="rounded-lg border border-surface px-3 py-2 text-sm"
              />
              <select
                name="residentialState"
                required
                defaultValue={a.residentialState ?? a.state}
                className="rounded-lg border border-surface px-3 py-2 text-sm"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="nearestLandmark"
              defaultValue={a.nearestLandmark ?? ""}
              placeholder="Nearest landmark (optional)"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            />
            <input
              name="whatsappNumber"
              defaultValue={a.whatsappNumber ?? ""}
              placeholder="WhatsApp number"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            />
            <input
              name="phoneNumber"
              defaultValue={a.phoneNumber ?? ""}
              placeholder="Phone (optional)"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted">
              Verification: {a.verificationStatus} · Assigned city: {a.city}, {a.state}
            </p>
            <button type="submit" disabled={profileSaving} className="w-full rounded-xl bg-navy py-3 text-sm font-bold text-white">
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
          </form>

          <form onSubmit={saveBank} className="rounded-xl border border-surface bg-white p-5 space-y-3">
            <p className="text-sm font-bold text-navy">Bank details (traditional banks only)</p>
            <p className="text-xs text-muted">
              Changing bank details pauses payouts until admin review.
            </p>
            <select
              name="bankCode"
              required
              defaultValue={data.bank?.bankCode ?? ""}
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            >
              <option value="">Select bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              name="accountNumber"
              required
              pattern="\d{10}"
              maxLength={10}
              placeholder="10-digit account number"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            />
            <input
              name="accountName"
              required
              defaultValue={data.bank?.accountName ?? ""}
              placeholder="Account name (as on bank statement)"
              className="w-full rounded-lg border border-surface px-3 py-2 text-sm"
            />
            <button type="submit" disabled={bankSaving} className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy">
              {bankSaving ? "Saving…" : "Save bank details"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
