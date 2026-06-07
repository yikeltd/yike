"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEGAL_DISCLAIMER, REVIEW_TYPE_OPTIONS } from "@/lib/legal-partner/constants";

type Props = {
  defaultPropertyTitle?: string;
  propertyId?: string;
};

export function LegalVerificationForm({
  defaultPropertyTitle = "",
  propertyId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/legal-verification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        propertyTitle: form.get("propertyTitle"),
        propertyLocation: form.get("propertyLocation"),
        reviewType: form.get("reviewType"),
        notes: form.get("notes"),
        outsideNigeria: form.get("outsideNigeria") === "on",
        propertyId: propertyId ?? null,
        termsAccepted: form.get("termsAccepted") === "on",
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit request");
      return;
    }
    router.push(`/legal-verification/thank-you?ref=${encodeURIComponent(data.reference ?? "")}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <p className="text-sm text-muted leading-relaxed">{LEGAL_DISCLAIMER}</p>

      <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Full name *</span>
            <input name="fullName" required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Email *</span>
            <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">WhatsApp *</span>
            <input name="whatsapp" required placeholder="0803..." className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input name="outsideNigeria" type="checkbox" />
          I am based outside Nigeria (diaspora request)
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Property</h2>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Property title / description *</span>
          <input
            name="propertyTitle"
            required
            defaultValue={defaultPropertyTitle}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Location (city, area, state) *</span>
          <input name="propertyLocation" required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Review type *</span>
          <select name="reviewType" required className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
            {REVIEW_TYPE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id} disabled={o.phase > 1}>
                {o.label}
                {o.phase > 1 ? " (coming soon)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Notes (documents available, concerns)</span>
          <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <label className="flex gap-3 text-xs text-muted leading-relaxed">
          <input name="termsAccepted" type="checkbox" required className="mt-1" />
          <span>
            I understand Yike coordinates independent legal review assistance and does not guarantee
            ownership, title, or protection from future disputes. I will submit documents when Yike
            contacts me on WhatsApp.
          </span>
        </label>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Request legal review assistance"}
      </button>
    </form>
  );
}
