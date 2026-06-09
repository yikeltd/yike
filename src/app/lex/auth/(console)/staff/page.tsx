"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { AdminPinResetPanel } from "@/components/admin/admin-pin-reset-panel";
import { StaffAssignmentPanel } from "@/components/admin/staff-assignment-panel";
import { StaffAccessSummaryCard } from "@/components/admin/staff-access-summary-card";
import type { StaffOnboardingEvent, StaffProfile } from "@/types/database";

export default function StaffManagementPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [eventsByStaff, setEventsByStaff] = useState<
    Record<string, (StaffOnboardingEvent & { actor_name?: string | null })[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "support" as StaffProfile["role"],
    department: "",
    password: "",
    admin_pin: "",
  });

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/admin/staff");
    const d = (await res.json()) as { staff?: StaffProfile[] };
    setStaff(d.staff ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  function handleCreateClick(e: React.FormEvent) {
    e.preventDefault();
    setShowPin(true);
  }

  async function submitCreate() {
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setShowPin(false);
      router.refresh();
      await loadStaff();
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Staff accounts"
        description="Lifecycle management — onboard, suspend, archive. Deletion requires archive first."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="pressable rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy"
          >
            Create staff
          </button>
        }
      />

      <StaffAssignmentPanel />

      {loading ? (
        <p className="text-sm text-muted">Loading staff…</p>
      ) : staff.length === 0 ? (
        <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
          No staff profiles yet. Create the first team member above.
        </p>
      ) : (
        <div className="space-y-4">
          {staff.map((s) => (
            <div key={s.id} className="space-y-2">
              <StaffAccessSummaryCard
                staff={s}
                events={eventsByStaff[s.id]}
                onUpdated={() => {
                  void loadStaff();
                  void fetch(`/api/admin/staff/${s.id}`)
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.events) {
                        setEventsByStaff((prev) => ({ ...prev, [s.id]: d.events }));
                      }
                    });
                }}
              />
              <div className="flex justify-end px-1">
                <AdminPinResetPanel
                  profileId={s.id}
                  pinType="admin"
                  label="Reset admin PIN"
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
          <form
            onSubmit={handleCreateClick}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-navy">Create staff account</h2>
            <div className="mt-4 space-y-3">
              <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <label className="block text-xs font-semibold text-muted">
                Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffProfile["role"] })}
                  className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                >
                  {["super_admin", "admin", "support", "tech", "content", "careers", "moderator"].map((r) => (
                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                  ))}
                </select>
              </label>
              <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <Field label="Temporary password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Field label="Admin PIN (6 digits, optional)" value={form.admin_pin} onChange={(v) => setForm({ ...form, admin_pin: v.replace(/\D/g, "").slice(0, 6) })} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl py-2 text-sm text-muted">Cancel</button>
              <button type="submit" className="flex-1 rounded-xl bg-gold py-2 text-sm font-bold text-navy">Continue</button>
            </div>
          </form>
        </div>
      )}

      {showPin && (
        <PinConfirmModal
          onVerified={async () => {
            if (showCreate) await submitCreate();
            setShowPin(false);
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-muted">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={type !== "text" || label !== "Phone"}
        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm text-navy"
      />
    </label>
  );
}
