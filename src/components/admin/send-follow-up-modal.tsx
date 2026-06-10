"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FollowUpQuestion, FollowUpQuestionType } from "@/lib/careers/follow-up/types";
import type { FollowUpGenerationInput } from "@/lib/careers/follow-up/types";
import { generateFollowUpQuestions } from "@/lib/careers/follow-up/generate-questions";
import { resolveInitialFollowUpQuestions } from "@/lib/careers/follow-up/resolve-questions";
import { QUESTION_TYPES } from "@/components/careers/follow-up-form";
import { cn } from "@/lib/utils";

const SEND_TIMEOUT_MS = 25_000;

function newQuestion(): FollowUpQuestion {
  const id = `custom_${Date.now()}`;
  return {
    id,
    label: "New question",
    type: "long_text",
    section: "Custom",
    required: true,
  };
}

export function SendFollowUpModal({
  applicationId,
  applicantName,
  jobTitle,
  generationInput,
  savedTemplate,
  onClose,
}: {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  generationInput: FollowUpGenerationInput;
  savedTemplate?: FollowUpQuestion[] | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const initialQuestions = useMemo(
    () => resolveInitialFollowUpQuestions(generationInput, savedTemplate),
    [generationInput, savedTemplate]
  );
  const [questions, setQuestions] = useState<FollowUpQuestion[]>(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const usingTemplate = Boolean(savedTemplate?.length);

  function resetSuggestions() {
    setQuestions(resolveInitialFollowUpQuestions(generationInput, savedTemplate));
    setError(null);
  }

  function resetToGenerated() {
    setQuestions(generateFollowUpQuestions(generationInput));
    setError(null);
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= questions.length) return;
    const copy = [...questions];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setQuestions(copy);
  }

  function updateQuestion(index: number, patch: Partial<FollowUpQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function send() {
    if (!questions.length) {
      setError("Add at least one question");
      return;
    }
    setSending(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch("/api/admin/careers/follow-up/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          questions,
          saveTemplate: saveTemplate && templateName.trim().length > 0,
          templateName: templateName.trim(),
        }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send follow-up");
        return;
      }
      router.refresh();
      onClose();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Send timed out — check your connection and try again.");
      } else {
        setError("Could not send follow-up");
      }
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-3 sm:items-center">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-labelledby="follow-up-title"
      >
        <div className="border-b border-surface px-5 py-4">
          <p className="text-xs font-semibold text-gold-dark">Send follow-up</p>
          <h2 id="follow-up-title" className="text-lg font-bold text-navy">
            {applicantName}
          </h2>
          <p className="text-sm text-muted">{jobTitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">
                {usingTemplate
                  ? "Loaded saved template for this role — edit freely before sending."
                  : "Smart questions for this applicant — edit before sending."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetSuggestions}
                  className="pressable rounded-lg bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted"
                >
                  Reset
                </button>
                {usingTemplate && (
                  <button
                    type="button"
                    onClick={resetToGenerated}
                    className="pressable rounded-lg bg-surface px-2.5 py-1 text-[10px] font-semibold text-gold-dark"
                  >
                    Use auto-suggested
                  </button>
                )}
              </div>
            </div>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="space-y-2 rounded-xl border border-navy/10 p-3"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg bg-surface px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === questions.length - 1}
                    className="rounded-lg bg-surface px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="ml-auto rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={q.label}
                  onChange={(e) => updateQuestion(index, { label: e.target.value })}
                  className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={q.type}
                    onChange={(e) =>
                      updateQuestion(index, {
                        type: e.target.value as FollowUpQuestionType,
                      })
                    }
                    className="rounded-lg border border-navy/10 px-3 py-2 text-xs"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={q.section ?? ""}
                    onChange={(e) => updateQuestion(index, { section: e.target.value })}
                    placeholder="Section"
                    className="rounded-lg border border-navy/10 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, newQuestion()])}
              className="pressable w-full rounded-xl border border-dashed border-gold/50 py-2 text-xs font-semibold text-gold-dark"
            >
              + Add question
            </button>

            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={saveTemplate}
                onChange={(e) => setSaveTemplate(e.target.checked)}
              />
              Save as template for this role
            </label>
            {saveTemplate && (
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full rounded-lg border border-navy/10 px-3 py-2 text-sm"
              />
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-surface px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="pressable flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sending || !questions.length}
            onClick={() => void send()}
            className={cn(
              "pressable flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
            )}
          >
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
