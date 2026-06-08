"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload, X } from "lucide-react";
import type { JobRow, RoleQuestion } from "@/lib/careers/constants";
import {
  AGE_RANGES,
  EDUCATION_LEVELS,
} from "@/lib/careers/constants";
import { cn } from "@/lib/utils";
import { createMathChallenge } from "@/lib/signup-math-challenge";

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
  const [mathChallenge] = useState(createMathChallenge);
  const [mathAnswer, setMathAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const cvInputRef = useRef<HTMLInputElement>(null);

  const mathOk =
    mathAnswer.trim() !== "" &&
    Number(mathAnswer) === mathChallenge.a + mathChallenge.b;

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

  function clearCv() {
    setCvUrl(null);
    setCvName(null);
    if (cvInputRef.current) cvInputRef.current.value = "";
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
    if (step === 3) {
      if (!mathOk) return "Please solve the quick math check correctly";
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
        jobSlug: job.slug,
        ...form,
        cvUrl,
        yearsExperience: Number(form.yearsExperience) || 0,
        mathA: mathChallenge.a,
        mathB: mathChallenge.b,
        mathAnswer: Number(mathAnswer),
        website: honeypot,
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
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              disabled={cvUploading}
              onChange={(e) => void handleCv(e.target.files?.[0] ?? null)}
            />
            <div className="rounded-xl border border-navy/10 bg-surface/60 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={cvUploading}
                  onClick={() => cvInputRef.current?.click()}
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-sm disabled:opacity-60"
                >
                  {cvUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {cvUploading ? "Uploading…" : cvName ? "Replace CV" : "Choose CV"}
                </button>

                {cvName && !cvUploading && (
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-navy/8">
                    <FileText className="h-4 w-4 shrink-0 text-gold-dark" />
                    <span className="truncate text-sm font-medium text-navy">{cvName}</span>
                    <button
                      type="button"
                      onClick={clearCv}
                      className="pressable ml-auto shrink-0 rounded-lg p-1 text-muted hover:bg-navy/5 hover:text-navy"
                      aria-label="Remove CV"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">PDF or Word · max 5MB · optional</p>
            </div>
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
            Share social profiles so we can understand your work and online presence.
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
                placeholder="Profile URL or username"
              />
            </Field>
            <Field label="TikTok (optional)">
              <input
                value={form.tiktok}
                onChange={(e) => update({ tiktok: e.target.value })}
                className={inputClass}
                placeholder="Profile URL or username"
              />
            </Field>
            <Field label="LinkedIn (optional)">
              <input
                value={form.linkedin}
                onChange={(e) => update({ linkedin: e.target.value })}
                className={inputClass}
                placeholder="Profile URL or username"
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
                  placeholder="github.com/username"
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
          <div className="rounded-xl bg-surface/80 p-4 ring-1 ring-navy/5">
            <Field label="Quick check *">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <p className="text-sm text-muted sm:shrink-0">
                  What is {mathChallenge.a} + {mathChallenge.b}?
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mathAnswer}
                  onChange={(e) =>
                    setMathAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className={cn(
                    inputClass,
                    "sm:max-w-[9.5rem]",
                    mathAnswer && !mathOk && "ring-2 ring-red-400/50"
                  )}
                  placeholder="Your answer"
                  aria-label={`Answer: ${mathChallenge.a} plus ${mathChallenge.b}`}
                  autoComplete="off"
                  required
                />
              </div>
            </Field>
          </div>
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor={`career-hp-${job.slug}`}>Company website</label>
            <input
              id={`career-hp-${job.slug}`}
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="pressable inline-flex min-h-11 items-center justify-center rounded-xl border border-navy/15 bg-white px-6 py-2.5 text-sm font-bold text-navy shadow-sm"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={busy || cvUploading || (step === STEPS.length - 1 && !mathOk)}
          className="pressable inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-navy shadow-sm disabled:opacity-60 sm:flex-none"
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
