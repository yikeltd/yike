"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FollowUpQuestion, FollowUpQuestionType } from "@/lib/careers/follow-up/types";
import { cn } from "@/lib/utils";

const QUESTION_TYPES: { value: FollowUpQuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "salary", label: "Salary" },
  { value: "availability_date", label: "Availability" },
  { value: "years_experience", label: "Years of experience" },
  { value: "portfolio", label: "Portfolio / link" },
  { value: "yes_no", label: "Yes / No" },
  { value: "rating", label: "Rating scale" },
];

type LoadPayload = {
  ok: boolean;
  requestId: string;
  applicantName: string;
  jobTitle: string;
  questions: FollowUpQuestion[];
  status: string;
  expiresAt: string;
  submitted: boolean;
};

function storageKey(token: string) {
  return `yike-career-follow-up-${token}`;
}

function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: FollowUpQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const base =
    "w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-60";

  if (question.type === "long_text" || question.type === "portfolio") {
    return (
      <textarea
        rows={4}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className={cn(base, "resize-y min-h-[100px]")}
      />
    );
  }

  if (question.type === "multiple_choice" && question.options?.length) {
    return (
      <div className="space-y-2">
        {question.options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              value === opt ? "border-gold bg-gold/10 text-navy" : "border-navy/10 text-muted"
            )}
          >
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
              className="accent-gold"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="flex gap-2">
        {(["yes", "no"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "pressable flex-1 rounded-xl px-3 py-2 text-sm font-semibold capitalize",
              value === opt ? "bg-gold text-navy" : "bg-surface text-muted"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "rating") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(String(n))}
            className={cn(
              "pressable h-10 w-10 rounded-full text-sm font-bold",
              value === String(n) ? "bg-gold text-navy" : "bg-surface text-muted"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      type={question.type === "availability_date" ? "text" : "text"}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className={base}
    />
  );
}

export function CareerFollowUpForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<LoadPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/careers/follow-up/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as LoadPayload & { error?: string };
      if (!res.ok) {
        if (data.error === "expired") setError("This follow-up link has expired.");
        else if (data.error === "not_found") setError("This link is invalid or no longer available.");
        else setError("We could not load this follow-up. Please try again.");
        setPayload(null);
        return;
      }
      setPayload(data);
      if (data.submitted) {
        setDone(true);
        return;
      }
      const saved = localStorage.getItem(storageKey(token));
      if (saved) {
        try {
          setAnswers(JSON.parse(saved) as Record<string, string>);
        } catch {
          /* ignore */
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (done || !payload) return;
    localStorage.setItem(storageKey(token), JSON.stringify(answers));
  }, [answers, token, done, payload]);

  const sections = useMemo(() => {
    const map = new Map<string, FollowUpQuestion[]>();
    for (const q of payload?.questions ?? []) {
      const section = q.section ?? "Questions";
      const list = map.get(section) ?? [];
      list.push(q);
      map.set(section, list);
    }
    return Array.from(map.entries());
  }, [payload?.questions]);

  async function submit() {
    if (!payload) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/careers/follow-up/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error === "expired") setError("This follow-up link has expired.");
        else if (data.error === "already_submitted") setDone(true);
        else if (data.error === "not_found") setError("This link is invalid.");
        else setError("Could not submit. Please check required answers and try again.");
        return;
      }
      localStorage.removeItem(storageKey(token));
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-float">
        Loading your follow-up…
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-float">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-float">
        <p className="text-lg font-bold text-navy">Thank you</p>
        <p className="mt-2 text-sm text-muted">
          We received your follow-up for {payload?.jobTitle ?? "this role"}. Our team will review
          your answers and contact you if we move forward.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-float sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
          Yike Careers
        </p>
        <h1 className="mt-1 text-xl font-bold text-navy sm:text-2xl">Application follow-up</h1>
        <p className="mt-2 text-sm text-muted">
          Hi {payload?.applicantName?.split(" ")[0] ?? "there"} — a few short questions about{" "}
          <strong className="text-navy">{payload?.jobTitle}</strong>. Your progress saves locally on
          this device until you submit.
        </p>
      </div>

      {sections.map(([section, questions]) => (
        <section key={section} className="rounded-2xl bg-white p-5 shadow-float sm:p-6">
          <h2 className="text-sm font-bold text-navy">{section}</h2>
          <div className="mt-4 space-y-5">
            {questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-navy">
                  {q.label}
                  {q.required !== false && <span className="text-gold-dark"> *</span>}
                </label>
                <div className="mt-2">
                  <QuestionField
                    question={q}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    disabled={submitting}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="pressable w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit follow-up"}
      </button>
    </div>
  );
}

export { QUESTION_TYPES };
