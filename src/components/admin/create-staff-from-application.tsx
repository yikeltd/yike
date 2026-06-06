"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import type { StaffRole } from "@/types/database";

type ApplicationPreview = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  jobs?: { title?: string; department?: string; category?: string } | null;
};

const ROLES: StaffRole[] = [
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
  "admin",
];

export function CreateStaffFromApplication({ application }: { application: ApplicationPreview }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [form, setForm] = useState({
    role: "support" as StaffRole,
    department: application.jobs?.department ?? application.jobs?.category ?? "",
    password: "",
  });

  async function submit() {
    const res = await fetch("/api/admin/staff/from-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: application.id,
        role: form.role,
        department: form.department,
        password: form.password,
      }),
    });
    if (res.ok) {
      setOpen(false);
      setShowPin(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable rounded-xl bg-navy px-3 py-2 text-xs font-bold text-gold"
      >
        Create staff account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-navy">Convert to staff</h2>
            <p className="mt-1 text-sm text-muted">
              Pre-filled from {application.full_name}&apos;s application
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted">Name</dt><dd className="font-medium">{application.full_name}</dd></div>
              <div><dt className="text-muted">Email</dt><dd>{application.email}</dd></div>
              <div><dt className="text-muted">Role applied</dt><dd>{application.jobs?.title ?? "—"}</dd></div>
            </dl>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-muted">
                Staff role
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
              <label className="block text-xs font-semibold text-muted">
                Temporary password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl py-2 text-sm text-muted">Cancel</button>
              <button type="button" onClick={() => setShowPin(true)} className="flex-1 rounded-xl bg-gold py-2 text-sm font-bold text-navy">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showPin && (
        <PinConfirmModal
          onVerified={submit}
          onCancel={() => setShowPin(false)}
        />
      )}
    </>
  );
}
