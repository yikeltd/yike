"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import {
  DEALER_BUSINESS_TYPES,
  DEALER_ONBOARD_STEPS,
  type DealerBusinessTypeId,
  type DealerOnboardStep,
} from "@/lib/dealer/business-types";

const STEP_LABELS: Record<DealerOnboardStep, string> = {
  business_type: "Business type",
  business_details: "Details",
  address: "Address",
  identity: "Identity",
  branding: "Branding",
  plan: "Plan",
};

type Props = {
  profile: Profile;
};

export function DealerOnboardWizard({ profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [businessTypeId, setBusinessTypeId] = useState<DealerBusinessTypeId | "">(
    "",
  );
  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [cacNumber, setCacNumber] = useState(profile.cac_number ?? "");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState(profile.company_bio ?? "");
  const [years, setYears] = useState("");
  const [officeAddress, setOfficeAddress] = useState(
    profile.office_address ?? profile.residential_address ?? "",
  );
  const [state, setState] = useState(profile.residential_state ?? "");
  const [city, setCity] = useState(profile.residential_city ?? "");
  const [phone, setPhone] = useState(profile.phone ?? profile.whatsapp ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? profile.phone ?? "");
  const [tagline, setTagline] = useState("");

  const step = DEALER_ONBOARD_STEPS[stepIndex]!;
  const progress = Math.round(((stepIndex + 1) / DEALER_ONBOARD_STEPS.length) * 100);

  const canContinue = useMemo(() => {
    if (step === "business_type") return Boolean(businessTypeId);
    if (step === "business_details") return companyName.trim().length >= 2;
    if (step === "address") {
      return officeAddress.trim() && state.trim() && city.trim();
    }
    if (step === "identity") return phone.trim().length >= 8;
    return true;
  }, [step, businessTypeId, companyName, officeAddress, state, city, phone]);

  function next() {
    setError(null);
    if (stepIndex < DEALER_ONBOARD_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function saveProgress() {
    setError(null);
    const res = await fetch("/api/agent/dealer-onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessTypeId,
        companyName: companyName.trim(),
        cacNumber: cacNumber.trim() || undefined,
        officeAddress: officeAddress.trim(),
        residentialState: state.trim(),
        residentialCity: city.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        companyBio: [
          description.trim(),
          tagline.trim() && `Tagline: ${tagline.trim()}`,
          website.trim() && `Website: ${website.trim()}`,
          years.trim() && `Years: ${years.trim()}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(json?.error ?? "Could not save profile");
    }
  }

  function finish() {
    startTransition(() => {
      void (async () => {
        try {
          await saveProgress();
          router.push("/agent/plans");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      })();
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
        Enterprise onboarding
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">
        Join Yike as a professional seller
      </h1>
      <p className="mt-2 text-sm text-navy/60">
        Six short steps — then pick a plan and start listing.
      </p>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-navy/[0.06]">
        <div
          className="h-full rounded-full bg-gold transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-navy/50">
        Step {stepIndex + 1} of {DEALER_ONBOARD_STEPS.length} · {STEP_LABELS[step]}
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(3,27,78,0.12)]">
        {step === "business_type" ? (
          <div className="grid gap-2">
            {DEALER_BUSINESS_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setBusinessTypeId(t.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  businessTypeId === t.id
                    ? "border-gold bg-gold/10 ring-1 ring-gold/50"
                    : "border-navy/10 hover:border-navy/20",
                )}
              >
                <span className="block text-sm font-semibold text-navy">{t.label}</span>
                <span className="mt-0.5 block text-xs text-navy/55">{t.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === "business_details" ? (
          <div className="space-y-3">
            <Field label="Business name" value={companyName} onChange={setCompanyName} required />
            <Field label="Registration / CAC number" value={cacNumber} onChange={setCacNumber} />
            <Field label="Years in business" value={years} onChange={setYears} />
            <Field label="Website" value={website} onChange={setWebsite} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy/80">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>
        ) : null}

        {step === "address" ? (
          <div className="space-y-3">
            <Field label="Country" value="Nigeria" onChange={() => undefined} disabled />
            <Field label="State" value={state} onChange={setState} required />
            <Field label="City" value={city} onChange={setCity} required />
            <Field label="Office address" value={officeAddress} onChange={setOfficeAddress} required />
            <p className="text-xs text-navy/45">Maps pin coming later — address is enough for now.</p>
          </div>
        ) : null}

        {step === "identity" ? (
          <div className="space-y-3">
            <Field label="Support phone" value={phone} onChange={setPhone} required />
            <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
            <p className="rounded-xl bg-navy/[0.03] px-3 py-2 text-xs text-navy/60">
              Email is already verified. Upload CAC / ID on{" "}
              <Link href="/agent/company" className="font-semibold text-gold-dark underline">
                Business verification
              </Link>{" "}
              when you are ready — not required to finish this wizard.
            </p>
          </div>
        ) : null}

        {step === "branding" ? (
          <div className="space-y-3">
            <Field label="Tagline" value={tagline} onChange={setTagline} />
            <p className="text-sm text-navy/60">
              Add your logo and cover from your{" "}
              <Link href="/agent/company" className="font-semibold text-gold-dark underline">
                company profile
              </Link>{" "}
              after onboarding. Working hours can be added in bio.
            </p>
          </div>
        ) : null}

        {step === "plan" ? (
          <div className="space-y-3 text-sm text-navy/70">
            <p>
              Choose Free, Premium, or Enterprise on the next screen. Payments run through
              Yike’s Financial Capability (Paystack).
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Free — get listed and build trust</li>
              <li>Premium — boosts and featured slots</li>
              <li>Enterprise — agency / developer scale</li>
            </ul>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0 || pending}
            className="rounded-full px-4 py-2 text-sm font-semibold text-navy/60 disabled:opacity-40"
          >
            Back
          </button>
          {step === "plan" ? (
            <button
              type="button"
              disabled={pending}
              onClick={finish}
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-50"
            >
              {pending ? "Saving…" : "Continue to plans"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || pending}
              onClick={next}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-navy/45">
        Already set up?{" "}
        <Link href="/agent" className="font-semibold text-navy underline">
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-navy/80">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 disabled:bg-navy/[0.03]"
      />
    </label>
  );
}
