"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONCERN_FLAG_OPTIONS,
  VERIFICATION_LEGAL_DISCLAIMER,
  VERIFICATION_LEGAL_DISCLAIMER_SHORT,
  VERIFICATION_NEED_OPTIONS,
} from "@/lib/verification/constants";

type Props = {
  defaultPropertyLink?: string;
  defaultPropertyTitle?: string;
};

export function PropertyVerificationForm({
  defaultPropertyLink = "",
  defaultPropertyTitle = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needs, setNeeds] = useState<Record<string, boolean>>({});
  const [concerns, setConcerns] = useState<Record<string, boolean>>({});

  function toggle(map: Record<string, boolean>, set: typeof setNeeds, id: string) {
    set({ ...map, [id]: !map[id] });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/property-verification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        whatsapp: form.get("whatsapp"),
        buyerCity: form.get("buyerCity"),
        buyerCountry: form.get("buyerCountry"),
        preferredContact: form.get("preferredContact"),
        propertyLink: form.get("propertyLink"),
        propertyTitle: form.get("propertyTitle"),
        propertyType: form.get("propertyType"),
        propertyPurpose: form.get("propertyPurpose"),
        propertyLocation: form.get("propertyLocation"),
        agentCompanyName: form.get("agentCompanyName"),
        askingPrice: form.get("askingPrice"),
        verificationNeeds: needs,
        outsideCity: form.get("outsideCity") === "on",
        outsideNigeria: form.get("outsideNigeria") === "on",
        urgency: form.get("urgency"),
        alreadyPaid: form.get("alreadyPaid") === "on",
        additionalNotes: form.get("additionalNotes"),
        preferredTimeline: form.get("preferredTimeline"),
        concernFlags: concerns,
        termsAccepted: form.get("termsAccepted") === "on",
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit request");
      return;
    }
    router.push(
      `/property-verification/thank-you?ref=${encodeURIComponent(data.reference ?? "")}`
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
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
          <label className="block">
            <span className="text-xs font-semibold text-navy">Your city</span>
            <input name="buyerCity" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Country</span>
            <input name="buyerCountry" defaultValue="Nigeria" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Preferred contact</span>
            <select name="preferredContact" defaultValue="whatsapp" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone call</option>
              <option value="email">Email</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Property details</h2>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Yike property link (optional)</span>
          <input name="propertyLink" defaultValue={defaultPropertyLink} placeholder="https://yike.ng/properties/..." className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Property title *</span>
          <input name="propertyTitle" required defaultValue={defaultPropertyTitle} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-navy">Property type</span>
            <input name="propertyType" placeholder="Flat, duplex, land…" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Purpose</span>
            <select name="propertyPurpose" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="">Select</option>
              <option value="rent">Rent</option>
              <option value="buy">Buy</option>
              <option value="shortlet">Shortlet</option>
              <option value="land">Land</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Property location *</span>
          <input name="propertyLocation" required placeholder="Area, city, state" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-navy">Agent / company (if known)</span>
            <input name="agentCompanyName" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Asking price / rent</span>
            <input name="askingPrice" placeholder="₦…" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">What should we verify?</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {VERIFICATION_NEED_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(needs[opt.id])}
                onChange={() => toggle(needs, setNeeds, opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Your situation</h2>
        <label className="flex items-center gap-2 text-sm">
          <input name="outsideCity" type="checkbox" /> I am currently outside the property city
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="outsideNigeria" type="checkbox" /> I am outside Nigeria (diaspora)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="alreadyPaid" type="checkbox" /> I have already sent money
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">How urgent is this?</span>
          <select name="urgency" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
            <option value="normal">Normal — within a few days</option>
            <option value="high">High — within 24–48 hours</option>
            <option value="urgent">Urgent — same day if possible</option>
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONCERN_FLAG_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(concerns[opt.id])}
                onChange={() => toggle(concerns, setConcerns, opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <textarea
          name="additionalNotes"
          rows={3}
          placeholder="Anything else we should know?"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </section>

      <section className="space-y-3 rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Operations</h2>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Preferred timeline</span>
          <select name="preferredTimeline" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
            <option value="flexible">Flexible</option>
            <option value="this_week">This week</option>
            <option value="48_hours">Within 48 hours</option>
            <option value="24_hours">Within 24 hours</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input name="termsAccepted" type="checkbox" required className="mt-1" />
          <span>{VERIFICATION_LEGAL_DISCLAIMER_SHORT}</span>
        </label>
        <details className="text-xs text-muted">
          <summary className="cursor-pointer font-semibold text-navy">View details</summary>
          <p className="mt-2 leading-relaxed">{VERIFICATION_LEGAL_DISCLAIMER}</p>
        </details>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit verification request"}
      </button>
    </form>
  );
}
