"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

function ScoreSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-navy">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
        required
      >
        <option value="">Select 1–5</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

function FeedbackForm() {
  const params = useSearchParams();
  const reference = params.get("ref")?.trim() ?? "";
  const [usefulness, setUsefulness] = useState("");
  const [professionalism, setProfessionalism] = useState("");
  const [speed, setSpeed] = useState("");
  const [trustLevel, setTrustLevel] = useState("");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference) {
      setError("Missing verification reference.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    const res = await fetch("/api/property-verification/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference,
        usefulness: Number(usefulness),
        professionalism: Number(professionalism),
        speed: Number(speed),
        trustLevel: Number(trustLevel),
        comments,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Could not submit feedback");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-3 text-lg font-bold text-navy">Thank you</h1>
        <p className="mt-2 text-sm text-muted">
          Your feedback helps Yike improve verification quality. Internal use only.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-gold-dark">
          Back to Yike
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h1 className="text-lg font-bold text-navy">Verification feedback</h1>
        <p className="mt-1 text-sm text-muted">
          Reference: <strong>{reference || "—"}</strong>
        </p>
      </div>
      <ScoreSelect label="How useful was the inspection?" value={usefulness} onChange={setUsefulness} />
      <ScoreSelect label="Verifier professionalism" value={professionalism} onChange={setProfessionalism} />
      <ScoreSelect label="Speed" value={speed} onChange={setSpeed} />
      <ScoreSelect label="Trust level" value={trustLevel} onChange={setTrustLevel} />
      <label className="block text-sm">
        <span className="font-medium text-navy">Comments (optional)</span>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}

export default function VerificationFeedbackPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}
