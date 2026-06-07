"use client";

import { useState } from "react";
import { NIGERIAN_STATES } from "@/lib/constants";
import { LEGAL_DISCLAIMER } from "@/lib/legal-partner/constants";

export function LegalPartnerApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/legal-partner/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        phoneNumber: form.get("phoneNumber"),
        firmName: form.get("firmName"),
        yearsOfPractice: form.get("yearsOfPractice"),
        specializations: form.get("specializations"),
        operatingCities: form.get("operatingCities"),
        propertyLawExperience: form.get("propertyLawExperience"),
        cacNumber: form.get("cacNumber"),
        enrollmentNumber: form.get("enrollmentNumber"),
        officeAddress: form.get("officeAddress"),
        city: form.get("city"),
        state: form.get("state"),
        nearestLandmark: form.get("nearestLandmark"),
        whyApply: form.get("whyApply"),
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
      <p className="text-xs text-muted leading-relaxed">{LEGAL_DISCLAIMER}</p>

      <h3 className="text-sm font-bold text-navy">Personal</h3>
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
      </div>

      <h3 className="text-sm font-bold text-navy pt-2">Professional</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Law firm / chamber name *</span>
          <input name="firmName" required className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Years of practice</span>
          <input name="yearsOfPractice" type="number" min={0} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Areas of specialization</span>
          <input name="specializations" placeholder="Property, conveyancing…" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Operating cities / states</span>
          <input name="operatingCities" placeholder="Aba, Enugu, Owerri…" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Property law experience</span>
          <textarea name="propertyLawExperience" rows={2} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">CAC number (optional)</span>
          <input name="cacNumber" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Supreme Court enrollment (optional)</span>
          <input name="enrollmentNumber" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
      </div>

      <h3 className="text-sm font-bold text-navy pt-2">Office location</h3>
      <label className="block">
        <span className="text-xs font-semibold text-navy">Office address *</span>
        <textarea name="officeAddress" required rows={2} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Nearest landmark (optional)</span>
          <input name="nearestLandmark" className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-navy">Why do you want to partner with Yike? *</span>
        <textarea name="whyApply" required rows={3} className="mt-1 w-full rounded-xl border border-surface px-3 py-2.5 text-sm" />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-navy disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
