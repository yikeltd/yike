"use client";

import { useEffect, useState } from "react";
import {
  STAFF_WORK_AREAS,
  STAFF_WORK_AREA_LABELS,
  type StaffWorkArea,
} from "@/lib/admin/staff-work-areas";
import type { StaffProfile } from "@/types/database";

type Assignment = {
  id: string;
  staff_id: string;
  work_area: StaffWorkArea;
  priority: number;
  is_active: boolean;
  notes: string | null;
};

export function StaffAssignmentPanel() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [staffId, setStaffId] = useState("");
  const [workArea, setWorkArea] = useState<StaffWorkArea>("listing_review");
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const [staffRes, assignRes] = await Promise.all([
      fetch("/api/admin/staff"),
      fetch("/api/admin/staff/assignments"),
    ]);
    const staffJson = (await staffRes.json()) as { staff?: StaffProfile[] };
    const assignJson = (await assignRes.json()) as { assignments?: Assignment[] };
    setStaff(staffJson.staff ?? []);
    setAssignments(assignJson.assignments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/staff/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        work_area: workArea,
        priority,
        notes,
        is_active: true,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save assignment");
      return;
    }
    setNotes("");
    await refresh();
  }

  async function revoke(id: string) {
    await fetch(`/api/admin/staff/assignments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading assignments…</p>;
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-4">
      <h2 className="text-base font-bold text-navy">Task assignments</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Chief admin assigns work areas — staff APK routes staff to their highest-priority room.
      </p>

      <form onSubmit={assign} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="font-semibold text-navy">Staff member</span>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            required
          >
            <option value="">Select…</option>
            {staff
              .filter((s) => s.status === "active")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-navy">Work area</span>
          <select
            value={workArea}
            onChange={(e) => setWorkArea(e.target.value as StaffWorkArea)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
          >
            {STAFF_WORK_AREAS.map((area) => (
              <option key={area} value={area}>
                {STAFF_WORK_AREA_LABELS[area]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-navy">Priority</span>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:col-span-2 lg:col-span-1">
          <span className="font-semibold text-navy">Notes</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            placeholder="Optional"
          />
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={saving}
            className="pressable min-h-11 rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-60"
          >
            {saving ? "Saving…" : "Assign task area"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-4">Staff</th>
              <th className="py-2 pr-4">Area</th>
              <th className="py-2 pr-4">Priority</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-muted-foreground">
                  No explicit assignments yet — staff still land by role defaults.
                </td>
              </tr>
            ) : (
              assignments.map((row) => {
                const member = staff.find((s) => s.id === row.staff_id);
                return (
                  <tr key={row.id} className="border-b border-navy/5">
                    <td className="py-3 pr-4">{member?.full_name ?? row.staff_id.slice(0, 8)}</td>
                    <td className="py-3 pr-4">{STAFF_WORK_AREA_LABELS[row.work_area]}</td>
                    <td className="py-3 pr-4">{row.priority}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => void revoke(row.id)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
