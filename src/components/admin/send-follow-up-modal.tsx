"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FollowUpQuestion, FollowUpQuestionType } from "@/lib/careers/follow-up/types";
import { QUESTION_TYPES } from "@/components/careers/follow-up-form";
import { cn } from "@/lib/utils";

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
  onClose,
}: {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/careers/follow-up/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = (await res.json()) as {
        questions?: FollowUpQuestion[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not generate questions");
        return;
      }
      setQuestions(data.questions ?? []);
    } catch {
      setError("Could not generate questions");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

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
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send follow-up");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Could not send follow-up");
    } finally {
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
          {loading ? (
            <p className="text-sm text-muted">Generating suggested questions…</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Review and edit questions before sending. Nothing is emailed until you confirm.
              </p>
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-navy/10 p-3 space-y-2"
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
                  {q.section && (
                    <p className="text-[10px] text-muted">Section: {q.section}</p>
                  )}
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
                Save as template
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
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-surface px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="pressable flex-1 rounded-xl bg-surface py-2.5 text-sm font-semibold text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || sending || !questions.length}
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
