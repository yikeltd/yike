"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader, StatusBadge } from "@/components/admin/dashboard/admin-ui";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { AdminPinResetPanel } from "@/components/admin/admin-pin-reset-panel";
import { StaffAssignmentPanel } from "@/components/admin/staff-assignment-panel";
import type { StaffProfile, StaffRole } from "@/types/database";

const ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
];

export default function StaffManagementPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "support" as StaffRole,
    department: "",
    password: "",
    admin_pin: "",
  });

  useEffect(() => {
    void fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((d: { staff?: StaffProfile[] }) => {
        setStaff(d.staff ?? []);
        setLoading(false);
      });
  }, []);

  function handleCreateClick(e: React.FormEvent) {
    e.preventDefault();
    setShowPin(true);
  }

  async function submitCreate() {
    setPendingSubmit(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPendingSubmit(false);
    if (res.ok) {
      setShowCreate(false);
      setShowPin(false);
      router.refresh();
      const data = await fetch("/api/admin/staff").then((r) => r.json());
      setStaff(data.staff ?? []);
    }
  }

  async function toggleStatus(id: string, disable: boolean) {
    setShowPin(true);
    // PIN gate handled via modal then PATCH
    window.__staffAction = async () => {
      await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: disable ? "disable" : "enable" }),
      });
      router.refresh();
      const data = await fetch("/api/admin/staff").then((r) => r.json());
      setStaff(data.staff ?? []);
    };
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Staff accounts"
        description="Create and manage internal team access"
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
        <div className="space-y-3">
          {staff.map((s) => (
            <article
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-bold text-navy">{s.full_name}</p>
                <p className="text-sm text-muted">{s.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {s.role.replace("_", " ")} · {s.department ?? "General"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={s.status} />
                <AdminPinResetPanel
                  profileId={s.id}
                  pinType="admin"
                  label="Reset admin PIN"
                  compact
                />
                <button
                  type="button"
                  onClick={() => void toggleStatus(s.id, s.status === "active")}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy/10 hover:bg-surface"
                >
                  {s.status === "active" ? "Disable" : "Enable"}
                </button>
              </div>
            </article>
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
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
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
            else if (typeof window.__staffAction === "function") await window.__staffAction();
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

declare global {
  interface Window {
    __staffAction?: () => Promise<void>;
  }
}
