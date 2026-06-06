"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRow, RoleQuestion } from "@/lib/careers/constants";
import {
  AGE_RANGES,
  EDUCATION_LEVELS,
} from "@/lib/careers/constants";
import { cn } from "@/lib/utils";

type FormState = {
  fullName: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  ageRange: string;
  educationLevel: string;
  currentOccupation: string;
  whyApply: string;
  yearsExperience: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  github: string;
  linkedin: string;
  portfolio: string;
  stackExperience: string;
  extraAnswers: Record<string, string>;
};

const STEPS = ["You", "Background", "Fit", "Social"] as const;

function storageKey(slug: string) {
  return `yike-career-draft:${slug}`;
}

export function CareerApplicationForm({ job }: { job: JobRow }) {
  const router = useRouter();
  const isTech = job.category === "tech";
  const questions = (job.role_questions ?? []) as RoleQuestion[];

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    ageRange: "",
    educationLevel: "",
    currentOccupation: "",
    whyApply: "",
    yearsExperience: "0",
    facebook: "",
    instagram: "",
    tiktok: "",
    github: "",
    linkedin: "",
    portfolio: "",
    stackExperience: "",
    extraAnswers: {},
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(job.slug));
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>;
        setForm((f) => ({ ...f, ...saved, extraAnswers: saved.extraAnswers ?? {} }));
      }
    } catch {
      /* ignore */
    }
  }, [job.slug]);

  const persist = useCallback(
    (next: FormState) => {
      try {
        localStorage.setItem(storageKey(job.slug), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [job.slug]
  );

  const update = useCallback(
    (patch: Partial<FormState>) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  async function handleCv(file: File | null) {
    if (!file) return;
    setCvUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/careers/upload-cv", { method: "POST", body: fd });
    const data = await res.json();
    setCvUploading(false);
    if (!res.ok) {
      setError(data.error ?? "CV upload failed");
      return;
    }
    setCvUrl(data.url ?? data.path);
    setCvName(file.name);
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.fullName.trim()) return "Full name is required";
      if (!form.email.trim()) return "Email is required";
      if (!form.whatsapp.trim()) return "WhatsApp number is required";
      if (!form.city.trim() || !form.state.trim()) return "City and state are required";
    }
    if (step === 1) {
      if (!form.ageRange) return "Select your age range";
      if (!form.educationLevel) return "Select education level";
      if (!form.currentOccupation.trim()) return "Current occupation is required";
    }
    if (step === 2) {
      if (!form.whyApply.trim() || form.whyApply.trim().length < 20) {
        return "Tell us a bit more about why you want this role (20+ characters)";
      }
      for (const q of questions.filter((x) => x.required)) {
        if (!form.extraAnswers[q.id]?.trim()) return `Please answer: ${q.label}`;
      }
      if (isTech && !form.stackExperience.trim()) return "Share your stack experience";
    }
    return null;
  }

  async function submit() {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/careers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        ...form,
        cvUrl,
        yearsExperience: Number(form.yearsExperience) || 0,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    localStorage.removeItem(storageKey(job.slug));
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-float ring-1 ring-black/[0.04]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-bold text-navy">You&apos;re in!</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Thanks for applying to <strong className="text-foreground">{job.title}</strong>.
          We&apos;ll review your application and reach out if you&apos;re shortlisted.
        </p>
        <button
          type="button"
          onClick={() => router.push("/careers")}
          className="pressable mt-6 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-navy"
        >
          Back to careers
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < STEPS.length - 1) {
          const v = validateStep();
          if (v) {
            setError(v);
            return;
          }
          setError(null);
          setStep((s) => s + 1);
        } else {
          void submit();
        }
      }}
    >
      <div>
        <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
          <span>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" className="sm:col-span-2">
            <input
              required
              value={form.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
              className={inputClass}
              placeholder="Ada Okafor"
            />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp *">
            <input
              required
              value={form.whatsapp}
              onChange={(e) => update({ whatsapp: e.target.value })}
              className={inputClass}
              placeholder="08012345678"
            />
          </Field>
          <Field label="City *">
            <input
              required
              value={form.city}
              onChange={(e) => update({ city: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="State *">
            <input
              required
              value={form.state}
              onChange={(e) => update({ state: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age range *">
            <select
              required
              value={form.ageRange}
              onChange={(e) => update({ ageRange: e.target.value })}
              className={inputClass}
            >
              <option value="">Select</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Education *">
            <select
              required
              value={form.educationLevel}
              onChange={(e) => update({ educationLevel: e.target.value })}
              className={inputClass}
            >
              <option value="">Select</option>
              {EDUCATION_LEVELS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current occupation *" className="sm:col-span-2">
            <input
              required
              value={form.currentOccupation}
              onChange={(e) => update({ currentOccupation: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Years of experience">
            <input
              type="number"
              min={0}
              max={40}
              value={form.yearsExperience}
              onChange={(e) => update({ yearsExperience: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="CV (optional)" className="sm:col-span-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => void handleCv(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {cvUploading && <p className="mt-1 text-xs text-muted">Uploading…</p>}
            {cvName && !cvUploading && (
              <p className="mt-1 text-xs text-gold-dark">Attached: {cvName}</p>
            )}
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Why do you want this role? *">
            <textarea
              required
              rows={4}
              value={form.whyApply}
              onChange={(e) => update({ whyApply: e.target.value })}
              className={cn(inputClass, "resize-y")}
              placeholder="Be honest and specific — we're rooting for you."
            />
          </Field>
          {isTech && (
            <Field label="Stack experience *">
              <textarea
                rows={3}
                value={form.stackExperience}
                onChange={(e) => update({ stackExperience: e.target.value })}
                className={cn(inputClass, "resize-y")}
                placeholder="React, Next.js, Supabase, Flutter…"
              />
            </Field>
          )}
          {questions.map((q) => (
            <Field key={q.id} label={`${q.label}${q.required ? " *" : ""}`}>
              {q.type === "select" ? (
                <select
                  value={form.extraAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    update({
                      extraAnswers: { ...form.extraAnswers, [q.id]: e.target.value },
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {(q.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : q.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={form.extraAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    update({
                      extraAnswers: { ...form.extraAnswers, [q.id]: e.target.value },
                    })
                  }
                  className={cn(inputClass, "resize-y")}
                  placeholder={q.placeholder}
                />
              ) : (
                <input
                  value={form.extraAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    update({
                      extraAnswers: { ...form.extraAnswers, [q.id]: e.target.value },
                    })
                  }
                  className={inputClass}
                  placeholder={q.placeholder}
                />
              )}
            </Field>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Share social profiles so we can understand your work — optional but helpful.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook">
              <input
                value={form.facebook}
                onChange={(e) => update({ facebook: e.target.value })}
                className={inputClass}
                placeholder="Profile URL or username"
              />
            </Field>
            <Field label="Instagram">
              <input
                value={form.instagram}
                onChange={(e) => update({ instagram: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="TikTok">
              <input
                value={form.tiktok}
                onChange={(e) => update({ tiktok: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          {isTech && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GitHub">
                <input
                  value={form.github}
                  onChange={(e) => update({ github: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  value={form.linkedin}
                  onChange={(e) => update({ linkedin: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Portfolio" className="sm:col-span-2">
                <input
                  value={form.portfolio}
                  onChange={(e) => update({ portfolio: e.target.value })}
                  className={inputClass}
                  placeholder="https://"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="pressable rounded-xl border border-navy/15 px-5 py-3 text-sm font-semibold text-navy"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={busy || cvUploading}
          className="pressable flex-1 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-navy disabled:opacity-60 sm:flex-none"
        >
          {busy ? "Submitting…" : step < STEPS.length - 1 ? "Continue" : "Submit application"}
        </button>
      </div>
      <p className="text-center text-[11px] text-muted">Draft autosaved on this device</p>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}
