"use client";

import { useState } from "react";
import { NIGERIAN_STATES } from "@/lib/constants";

export function VerifierApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/verifier/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        phoneNumber: form.get("phoneNumber"),
        gender: form.get("gender"),
        city: form.get("city"),
        state: form.get("state"),
        residentialAddress: form.get("residentialAddress"),
        nearestLandmark: form.get("nearestLandmark"),
        occupation: form.get("occupation"),
        realEstateFamiliarity: form.get("realEstateFamiliarity"),
        inspectionExperience: form.get("inspectionExperience"),
        transportationAvailable: form.get("transportationAvailable") === "on",
        coverageAreas: form.get("coverageAreas"),
        whyApply: form.get("whyApply"),
        idType: form.get("idType"),
      }),
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
          <input name="fullName" required className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Email *</span>
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">WhatsApp *</span>
          <input name="whatsapp" required placeholder="0803..." className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Phone number</span>
          <input name="phoneNumber" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Gender (optional)</span>
          <select name="gender" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">City *</span>
          <input name="city" required className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">State *</span>
          <select name="state" required className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm">
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Residential address *</span>
        <textarea name="residentialAddress" required rows={2} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Nearest landmark</span>
        <input name="nearestLandmark" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-navy">Occupation</span>
          <input name="occupation" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Real estate familiarity</span>
          <input name="realEstateFamiliarity" placeholder="e.g. 2 years viewing homes" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Inspection experience (optional)</span>
        <textarea name="inspectionExperience" rows={2} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Areas you can cover *</span>
        <textarea name="coverageAreas" required rows={2} placeholder="e.g. Aba North, Osisioma, Umuahia" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input name="transportationAvailable" type="checkbox" defaultChecked className="rounded" />
        I have reliable transportation for field visits
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Why do you want to verify properties for Yike? *</span>
        <textarea name="whyApply" required rows={4} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-navy">ID type (optional for now)</span>
        <select name="idType" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm">
          <option value="">Will provide later</option>
          <option value="nin">NIN</option>
          <option value="drivers_license">Driver&apos;s licence</option>
          <option value="voters_card">Voter&apos;s card</option>
          <option value="passport">International passport</option>
        </select>
      </label>

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
