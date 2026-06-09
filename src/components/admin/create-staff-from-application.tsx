"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { AdminPasswordField } from "@/components/admin/admin-password-field";
import {
  DEFAULT_YIKE_STAFF_LOGIN_URL,
  DEFAULT_ZOHO_MAIL_LOGIN_URL,
  ONBOARDING_ROLE_OPTIONS,
  getOnboardingRoleOption,
  type OnboardingRoleKey,
} from "@/lib/admin/staff-onboarding/constants";
import {
  ACCESS_CHECKLIST_ITEMS,
  defaultAccessChecklist,
  type AccessChecklist,
} from "@/lib/admin/staff-onboarding/checklist";
import { generateTemporaryPassword } from "@/lib/admin/staff-onboarding/password";
import { STAFF_WORK_AREA_LABELS } from "@/lib/admin/staff-work-areas";
import { cn } from "@/lib/utils";

type ApplicationPreview = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  jobs?: { title?: string; department?: string; category?: string } | null;
};

type StaffOption = { id: string; full_name: string; role: string };

type Step = "form" | "preview";

function suggestWorkEmail(fullName: string, roleKey: OnboardingRoleKey): string {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "team";
  const roleHints: Partial<Record<OnboardingRoleKey, string>> = {
    support: "support",
    trust_ops: "trust",
    legal_ops: "legal",
    listings_review: "listings",
    content: "content",
  };
  const local = roleHints[roleKey] ?? first.slice(0, 12);
  return `${local}@yike.ng`;
}

export function CreateStaffFromApplication({ application }: { application: ApplicationPreview }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [supervisors, setSupervisors] = useState<StaffOption[]>([]);

  const [form, setForm] = useState(() => ({
    onboarding_role: "support" as OnboardingRoleKey,
    department: application.jobs?.department ?? "",
    supervisor_id: "",
    work_email: suggestWorkEmail(application.full_name, "support"),
    zoho_temp_password: "",
    yike_login_email: application.email.trim().toLowerCase(),
    yike_temp_password: "",
    yike_login_url: DEFAULT_YIKE_STAFF_LOGIN_URL,
    zoho_login_url: DEFAULT_ZOHO_MAIL_LOGIN_URL,
    welcome_note: "Welcome to Yike. We're excited to have you on the team.",
    instructions: "",
    access_checklist: defaultAccessChecklist(),
    require_password_reset: true,
    internal_notes: "",
  }));

  const roleOpt = useMemo(
    () => getOnboardingRoleOption(form.onboarding_role),
    [form.onboarding_role]
  );

  const accessSummary = useMemo(
    () => roleOpt.workAreas.map((a) => STAFF_WORK_AREA_LABELS[a]),
    [roleOpt]
  );

  const loadSupervisors = useCallback(async () => {
    const res = await fetch("/api/admin/staff");
    if (!res.ok) return;
    const data = (await res.json()) as { staff?: StaffOption[] };
    setSupervisors(
      (data.staff ?? []).filter((s) =>
        ["admin", "super_admin", "support", "tech", "moderator"].includes(s.role)
      )
    );
  }, []);

  useEffect(() => {
    if (open) void loadSupervisors();
  }, [open, loadSupervisors]);

  function resetModal() {
    setStep("form");
    setPreviewHtml(null);
    setError(null);
    setShowPin(false);
  }

  function close() {
    setOpen(false);
    resetModal();
  }

  function onRoleChange(key: OnboardingRoleKey) {
    const opt = getOnboardingRoleOption(key);
    setForm((f) => ({
      ...f,
      onboarding_role: key,
      department: f.department || opt.defaultDepartment,
      work_email: suggestWorkEmail(application.full_name, key),
    }));
  }

  async function loadPreview() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff/onboarding/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: application.full_name,
          job_title: application.jobs?.title,
          onboarding_role: form.onboarding_role,
          department: form.department || roleOpt.defaultDepartment,
          work_email: form.work_email,
          zoho_temp_password: form.zoho_temp_password || "••••••••",
          yike_login_email: form.yike_login_email,
          yike_temp_password: form.yike_temp_password || "••••••••",
          yike_login_url: form.yike_login_url,
          zoho_login_url: form.zoho_login_url,
          welcome_note: form.welcome_note,
          instructions: form.instructions,
          access_checklist: form.access_checklist,
          require_password_reset: form.require_password_reset,
          internal_notes: form.internal_notes,
        }),
      });
      const data = (await res.json()) as { html?: string; subject?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not load preview");
        return;
      }
      setPreviewHtml(data.html ?? null);
      setPreviewSubject(data.subject ?? "Welcome to Yike Crew");
      setStep("preview");
    } catch {
      setError("Could not load preview");
    } finally {
      setBusy(false);
    }
  }

  function validateForm(): string | null {
    if (!form.work_email.trim().endsWith("@yike.ng")) {
      return "Work email must be a @yike.ng address (create it in Zoho first).";
    }
    if (!form.zoho_temp_password || form.zoho_temp_password.length < 8) {
      return "Enter the Zoho work email temporary password.";
    }
    if (!form.yike_temp_password || form.yike_temp_password.length < 8) {
      return "Set a Yike staff login password (at least 8 characters).";
    }
    if (!form.yike_login_email.trim()) {
      return "Yike login email is required.";
    }
    return null;
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff/from-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: application.id,
          onboarding_role: form.onboarding_role,
          department: form.department,
          supervisor_id: form.supervisor_id || null,
          work_email: form.work_email,
          zoho_temp_password: form.zoho_temp_password,
          yike_login_email: form.yike_login_email,
          yike_temp_password: form.yike_temp_password,
          yike_login_url: form.yike_login_url,
          zoho_login_url: form.zoho_login_url,
          welcome_note: form.welcome_note,
          instructions: form.instructions,
          access_checklist: form.access_checklist,
          require_password_reset: form.require_password_reset,
          internal_notes: form.internal_notes,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? data.message ?? "Onboarding failed");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Onboarding failed");
    } finally {
      setBusy(false);
      setShowPin(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable rounded-xl bg-navy px-3 py-2 text-xs font-bold text-gold"
      >
        Onboard as staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-3 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-surface px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
                Staff onboarding
              </p>
              <h2 className="text-lg font-bold text-navy">Convert to Yike Crew</h2>
              <p className="mt-1 text-sm text-muted">
                {application.full_name} · {application.jobs?.title ?? "Applicant"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === "form" ? (
                <div className="space-y-5">
                  <section className="rounded-xl bg-surface/60 p-4 text-sm">
                    <p className="font-semibold text-navy">Zoho workflow</p>
                    <p className="mt-1 text-muted text-xs leading-relaxed">
                      Create the work email in Zoho Mail first, set a temporary password there,
                      then paste both into this form. Yike will send one premium onboarding email
                      with all access details.
                    </p>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-muted sm:col-span-2">
                      Assigned role
                      <select
                        value={form.onboarding_role}
                        onChange={(e) => onRoleChange(e.target.value as OnboardingRoleKey)}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                      >
                        {ONBOARDING_ROLE_OPTIONS.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block font-normal text-[11px]">{roleOpt.description}</span>
                    </label>

                    <label className="block text-xs font-semibold text-muted">
                      Department / workspace
                      <input
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                        placeholder={roleOpt.defaultDepartment}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-muted">
                      Supervisor (optional)
                      <select
                        value={form.supervisor_id}
                        onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        {supervisors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                      Zoho work email
                    </p>
                    <label className="block text-xs font-semibold text-muted">
                      Work email
                      <input
                        type="email"
                        value={form.work_email}
                        onChange={(e) => setForm({ ...form, work_email: e.target.value })}
                        placeholder="name@yike.ng"
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                        required
                      />
                    </label>
                    <AdminPasswordField
                      label="Work email temporary password"
                      hint="From Zoho — not stored after send"
                      value={form.zoho_temp_password}
                      onChange={(v) => setForm({ ...form, zoho_temp_password: v })}
                      required
                    />
                    <label className="block text-xs font-semibold text-muted">
                      Zoho Mail login URL
                      <input
                        value={form.zoho_login_url}
                        onChange={(e) => setForm({ ...form, zoho_login_url: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-navy/10 bg-white p-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-navy">
                      Yike staff login
                    </p>
                    <label className="block text-xs font-semibold text-muted">
                      Yike login email
                      <input
                        type="email"
                        value={form.yike_login_email}
                        onChange={(e) => setForm({ ...form, yike_login_email: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                        required
                      />
                    </label>
                    <AdminPasswordField
                      label="Yike staff login password"
                      hint="Separate from Zoho — for yike.ng/lex"
                      value={form.yike_temp_password}
                      onChange={(v) => setForm({ ...form, yike_temp_password: v })}
                      required
                    />
                    <label className="block text-xs font-semibold text-muted">
                      Yike staff login URL
                      <input
                        value={form.yike_login_url}
                        onChange={(e) => setForm({ ...form, yike_login_url: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-semibold text-muted">
                    Welcome note
                    <textarea
                      rows={2}
                      value={form.welcome_note}
                      onChange={(e) => setForm({ ...form, welcome_note: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-muted">
                    Work instructions
                    <textarea
                      rows={5}
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      placeholder="Expectations, hours, reporting, onboarding steps…"
                      className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="rounded-xl border border-navy/10 bg-surface/40 p-4">
                    <p className="text-xs font-bold text-navy">Access included</p>
                    <p className="mt-1 text-[11px] text-muted">
                      Tick what is ready before sending onboarding.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {ACCESS_CHECKLIST_ITEMS.map((item) => (
                        <li key={item.key}>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                            <input
                              type="checkbox"
                              checked={Boolean(form.access_checklist[item.key])}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  access_checklist: {
                                    ...f.access_checklist,
                                    [item.key]: e.target.checked,
                                  } as AccessChecklist,
                                }))
                              }
                              className="rounded border-navy/20 text-gold focus:ring-gold"
                            />
                            {item.label}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/10 p-4">
                    <input
                      type="checkbox"
                      checked={form.require_password_reset}
                      onChange={(e) =>
                        setForm({ ...form, require_password_reset: e.target.checked })
                      }
                      className="mt-0.5 rounded border-navy/20 text-gold focus:ring-gold"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-navy">
                        Require password reset on first login
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Recommended — staff must set a new Yike login password before access.
                      </span>
                    </span>
                  </label>

                  <label className="block text-xs font-semibold text-muted">
                    Internal admin notes (private)
                    <textarea
                      rows={2}
                      value={form.internal_notes}
                      onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                      placeholder="Strong communication, part-time only, needs supervision…"
                      className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="rounded-xl bg-surface p-4">
                    <p className="text-xs font-bold text-navy">Access summary</p>
                    <ul className="mt-2 list-inside list-disc text-xs text-muted">
                      <li>Staff role: {roleOpt.staffRole.replace("_", " ")}</li>
                      {accessSummary.map((a) => (
                        <li key={a}>{a} workspace</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-navy">Email preview · {previewSubject}</p>
                  <p className="text-xs text-muted">
                    Passwords appear in the email once — they are not stored in Yike after send.
                  </p>
                  {previewHtml ? (
                    <iframe
                      title="Onboarding email preview"
                      srcDoc={previewHtml}
                      className="h-[420px] w-full rounded-xl border border-navy/10 bg-white"
                      sandbox=""
                    />
                  ) : (
                    <p className="text-sm text-muted">Loading preview…</p>
                  )}
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-2 border-t border-surface px-5 py-4">
              {step === "preview" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="pressable flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-muted"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowPin(true)}
                    className="pressable flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
                  >
                    Send onboarding email
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={close}
                    className="pressable flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const err = validateForm();
                      if (err) {
                        setError(err);
                        return;
                      }
                      if (!form.yike_temp_password) {
                        setForm((f) => ({ ...f, yike_temp_password: generateTemporaryPassword() }));
                      }
                      void loadPreview();
                    }}
                    className={cn(
                      "pressable flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
                    )}
                  >
                    {busy ? "Loading…" : "Preview email"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPin && (
        <PinConfirmModal onVerified={() => void submit()} onCancel={() => setShowPin(false)} />
      )}
    </>
  );
}
