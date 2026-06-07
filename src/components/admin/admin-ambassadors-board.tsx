"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type Tab =
  | "applications"
  | "approved"
  | "payouts"
  | "slots"
  | "commissions";

type Application = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  status: string;
  waitlisted: boolean;
  why_apply: string;
  created_at: string;
};

type Ambassador = {
  id: string;
  ambassador_code: string;
  assigned_city: string;
  assigned_state: string;
  status: string;
  commission_percentage: number;
  onboarding_count: number;
  total_visible_earnings: number;
  current_month_earnings: number;
  total_paid: number;
};

type Slot = {
  id: string;
  city: string;
  state: string;
  max_slots: number;
  active_slots: number;
  recruitment_paused: boolean;
};

type Commission = {
  id: string;
  commission_amount: number;
  status: string;
  hidden_from_ambassador: boolean;
  revenue_source_type: string;
  created_at: string;
  city_ambassadors?: { ambassador_code: string; assigned_city: string };
};

export function AdminAmbassadorsBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<
    Array<{
      id: string;
      payable_amount: number;
      status: string;
      period_year_month: string;
      city_ambassadors?: { ambassador_code: string };
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/ambassadors?tab=${tab}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return;
    if (tab === "applications") setApplications(json.applications ?? []);
    if (tab === "approved") setAmbassadors(json.ambassadors ?? []);
    if (tab === "slots") setSlots(json.slots ?? []);
    if (tab === "commissions") setCommissions(json.commissions ?? []);
    if (tab === "payouts") setPayouts(json.payouts ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approveApplication(id: string) {
    await requirePin(async () => {
      const res = await fetch(`/api/admin/ambassadors/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? `Approved · code ${json.code}` : (json.error ?? "Failed"));
      await load();
    });
  }

  async function rejectApplication(id: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/ambassadors/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      await load();
    });
  }

  async function setAmbassadorStatus(id: string, status: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/ambassadors/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    });
  }

  async function updateSlot(slot: Slot, maxSlots: number) {
    await fetch("/api/admin/ambassadors/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slot.id, maxSlots, recruitmentPaused: slot.recruitment_paused }),
    });
    await load();
  }

  async function hideCommission(id: string) {
    await requirePin(async () => {
      await fetch(`/api/admin/ambassadors/commissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide", hiddenReason: "admin_discretion" }),
      });
      await load();
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "applications", label: "Applications" },
    { id: "approved", label: "Approved" },
    { id: "payouts", label: "Payout Queue" },
    { id: "slots", label: "City Slots" },
    { id: "commissions", label: "Commission Ledger" },
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
              tab === t.id ? "bg-navy text-white" : "bg-white border border-surface text-muted"
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
            <div key={app.id} className="rounded-xl border border-surface bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">{app.full_name}</p>
                  <p className="text-xs text-muted">
                    {app.city}, {app.state} · {app.email} · {app.status}
                    {app.waitlisted ? " · waitlisted" : ""}
                  </p>
                </div>
                {app.status === "pending" || app.status === "waitlisted" || app.status === "under_review" ? (
                  <div className="flex gap-2">
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
                      className="rounded-lg border border-surface px-3 py-1 text-xs font-bold text-muted"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted line-clamp-3">{app.why_apply}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "approved" ? (
        <div className="space-y-3">
          {ambassadors.map((amb) => (
            <div key={amb.id} className="rounded-xl border border-surface bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    {amb.ambassador_code} · {amb.assigned_city}
                  </p>
                  <p className="text-xs text-muted">
                    {amb.status} · {amb.onboarding_count} onboarded · ₦
                    {Number(amb.current_month_earnings).toLocaleString()} this month
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmbassadorStatus(amb.id, "paused")}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmbassadorStatus(amb.id, "disabled")}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                  >
                    Disable
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "slots" ? (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-surface bg-white p-4">
              <div className="min-w-[140px]">
                <p className="font-bold text-navy">
                  {slot.city}, {slot.state}
                </p>
                <p className="text-xs text-muted">
                  {slot.active_slots}/{slot.max_slots} active
                </p>
              </div>
              <input
                type="number"
                min={0}
                defaultValue={slot.max_slots}
                className="w-20 rounded border border-surface px-2 py-1 text-sm"
                onBlur={(e) => updateSlot(slot, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      ) : null}

      {tab === "commissions" ? (
        <div className="space-y-3">
          {commissions.map((c) => (
            <div key={c.id} className="rounded-xl border border-surface bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    ₦{Number(c.commission_amount).toLocaleString()} · {c.status}
                  </p>
                  <p className="text-xs text-muted">
                    {c.city_ambassadors?.ambassador_code} · {c.revenue_source_type}
                    {c.hidden_from_ambassador ? " · hidden" : ""}
                  </p>
                </div>
                {!c.hidden_from_ambassador ? (
                  <button
                    type="button"
                    onClick={() => hideCommission(c.id)}
                    className="rounded-lg border px-2 py-1 text-xs font-bold"
                  >
                    Hide
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "payouts" ? (
        <div className="space-y-3">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted">No payout queue entries yet.</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="rounded-xl border border-surface bg-white p-4">
                <p className="font-bold text-navy">
                  {p.city_ambassadors?.ambassador_code} · ₦
                  {Number(p.payable_amount).toLocaleString()}
                </p>
                <p className="text-xs text-muted">
                  {p.period_year_month} · {p.status}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
