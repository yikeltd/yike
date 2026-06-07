"use client";

import { useState } from "react";
import { NIGERIAN_STATES } from "@/lib/constants";

type Props = {
  defaultCity?: string;
  defaultState?: string;
};

export function AmbassadorApplicationForm({ defaultCity, defaultState }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      whatsapp: form.get("whatsapp"),
      city: form.get("city"),
      state: form.get("state"),
      occupation: form.get("occupation"),
      yearsExperience: form.get("yearsExperience"),
      whyApply: form.get("whyApply"),
      marketKnowledge: form.get("marketKnowledge"),
      referralSource: form.get("referralSource"),
      residentialAddress: form.get("residentialAddress"),
      nearestLandmark: form.get("nearestLandmark"),
      instagram: form.get("instagram"),
      linkedin: form.get("linkedin"),
    };

    const res = await fetch("/api/ambassador/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit application");
      return;
    }

    setMessage(data.message ?? "Application submitted.");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-surface bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Full name *</span>
          <input
            name="fullName"
            required
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Email *</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">WhatsApp *</span>
          <input
            name="whatsapp"
            required
            placeholder="0803..."
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">City *</span>
          <input
            name="city"
            required
            defaultValue={defaultCity}
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">State *</span>
          <select
            name="state"
            required
            defaultValue={defaultState ?? ""}
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Occupation</span>
          <input
            name="occupation"
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Years in real estate / sales</span>
          <input
            name="yearsExperience"
            type="number"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Residential address *</span>
        <textarea
          name="residentialAddress"
          required
          rows={2}
          placeholder="Street, area, city"
          className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Nearest landmark</span>
        <input
          name="nearestLandmark"
          placeholder="e.g. near Shoprite, beside police station"
          className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Why do you want to join Yike? *</span>
        <textarea
          name="whyApply"
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Local market knowledge</span>
        <textarea
          name="marketKnowledge"
          rows={3}
          className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-navy">Instagram (optional)</span>
          <input name="instagram" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">LinkedIn (optional)</span>
          <input name="linkedin" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">How did you hear about us?</span>
          <input name="referralSource" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-bold text-navy disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
