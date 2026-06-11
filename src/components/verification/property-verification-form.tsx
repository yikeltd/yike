"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VERIFICATION_LEGAL_DISCLAIMER } from "@/lib/verification/constants";
import { cn } from "@/lib/utils";

type Props = {
  defaultPropertyLink?: string;
  defaultPropertyTitle?: string;
};

type ChipOption = {
  id: string;
  label: string;
};

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "United Kingdom",
  "United States",
  "Canada",
  "South Africa",
  "United Arab Emirates",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Ireland",
  "Netherlands",
  "Australia",
  "Other",
] as const;

const PROPERTY_CHECKS: ChipOption[] = [
  { id: "property_exists", label: "Property exists" },
  { id: "property_available", label: "Property is available" },
  { id: "pictures_match", label: "Pictures match" },
  { id: "area_neighbourhood", label: "Area/neighbourhood" },
  { id: "road_access", label: "Road access" },
  { id: "occupancy_condition", label: "Occupancy condition" },
  { id: "agent_presence", label: "Agent presence" },
  { id: "other_observations", label: "Other observations" },
];

const LAND_CHECKS: ChipOption[] = [
  { id: "land_location", label: "Land location" },
  { id: "road_access", label: "Road access" },
  { id: "area_neighbourhood", label: "Neighbourhood" },
  { id: "encroachment_signs", label: "Occupancy/encroachment signs" },
  { id: "agent_presence", label: "Agent presence" },
  { id: "local_observations", label: "Local observations" },
];

const SITUATION_FLAGS: ChipOption[] = [
  { id: "outside_property_city", label: "Outside property city" },
  { id: "outside_nigeria", label: "Outside Nigeria" },
  { id: "already_paid", label: "Already sent money" },
  { id: "scam_worry", label: "Worried about scam" },
  { id: "cannot_inspect", label: "Cannot inspect physically" },
  { id: "urgent_relocation", label: "Urgent relocation" },
  { id: "fake_picture_concern", label: "Fake picture concern" },
  { id: "land_concern", label: "Land concern" },
];

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: ChipOption[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = Boolean(selected[option.id]);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
              active
                ? "border-gold bg-gold text-navy"
                : "border-border bg-white text-muted hover:border-gold/70 hover:text-navy"
            )}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function selectedKeys(map: Record<string, boolean>): string[] {
  return Object.entries(map)
    .filter(([, value]) => value)
    .map(([key]) => key);
}

function selectedOptionKeys(map: Record<string, boolean>, options: ChipOption[]): string[] {
  const allowed = new Set(options.map((option) => option.id));
  return selectedKeys(map).filter((key) => allowed.has(key));
}

function inputClass(className = "") {
  return cn(
    "mt-1 h-12 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/25",
    className
  );
}

function textareaClass() {
  return cn(
    "mt-1 min-h-[96px] w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-navy outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/25"
  );
}

export function PropertyVerificationForm({
  defaultPropertyLink = "",
  defaultPropertyTitle = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState("Nigeria");
  const [otherCountry, setOtherCountry] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [timeline, setTimeline] = useState("flexible");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [situations, setSituations] = useState<Record<string, boolean>>({});

  const actualCountry = country === "Other" ? otherCountry.trim() : country;
  const nonNigeria = actualCountry.length > 0 && actualCountry !== "Nigeria";
  const checkOptions = purpose === "land" ? LAND_CHECKS : PROPERTY_CHECKS;

  const cityLooksDifferent = useMemo(() => {
    const city = buyerCity.trim().toLowerCase();
    const location = propertyLocation.trim().toLowerCase();
    if (!city || !location) return false;
    return !location.includes(city);
  }, [buyerCity, propertyLocation]);

  const effectiveSituations: Record<string, boolean> = {
    ...situations,
    ...(nonNigeria ? { outside_nigeria: true } : {}),
    ...(cityLooksDifferent ? { outside_property_city: true } : {}),
  };

  function toggle(setter: typeof setChecks, id: string) {
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
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
        buyerCity,
        buyerCountry: actualCountry || "Nigeria",
        preferredContact: form.get("preferredContact"),
        propertyLink: form.get("propertyLink"),
        propertyTitle: form.get("propertyTitle"),
        propertyType: form.get("propertyType"),
        propertyPurpose: purpose,
        propertyLocation,
        agentCompanyName: form.get("agentCompanyName"),
        askingPrice: form.get("askingPrice"),
        checksRequested: selectedOptionKeys(checks, checkOptions),
        situationFlags: selectedKeys(effectiveSituations),
        urgency: timeline,
        outsideCity: Boolean(effectiveSituations.outside_property_city),
        outsideNigeria: Boolean(effectiveSituations.outside_nigeria),
        alreadyPaid: Boolean(effectiveSituations.already_paid),
        additionalNotes: form.get("additionalNotes"),
        preferredTimeline: timeline,
        termsAccepted: form.get("termsAccepted") === "on",
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit request");
      return;
    }
    const requestId = data.requestId as string | undefined;
    if (requestId) {
      router.push(
        `/property-verification/packages?request=${encodeURIComponent(requestId)}&ref=${encodeURIComponent(data.reference ?? "")}`
      );
      return;
    }
    router.push(
      `/property-verification/thank-you?ref=${encodeURIComponent(data.reference ?? "")}`
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Your Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Full Name</span>
            <input name="fullName" required className={inputClass()} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Email</span>
            <input name="email" type="email" required className={inputClass()} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">WhatsApp Number</span>
            <input name="whatsapp" required inputMode="tel" className={inputClass()} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Country</span>
            <select
              name="buyerCountry"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass()}
            >
              {COUNTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {country === "Other" ? (
            <label className="block">
              <span className="text-xs font-semibold text-navy">Enter country</span>
              <input
                value={otherCountry}
                onChange={(e) => setOtherCountry(e.target.value)}
                required
                className={inputClass()}
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold text-navy">City</span>
              <input
                value={buyerCity}
                onChange={(e) => setBuyerCity(e.target.value)}
                name="buyerCity"
                className={inputClass()}
              />
            </label>
          )}
          {country === "Other" ? (
            <label className="block">
              <span className="text-xs font-semibold text-navy">City</span>
              <input
                value={buyerCity}
                onChange={(e) => setBuyerCity(e.target.value)}
                name="buyerCity"
                className={inputClass()}
              />
            </label>
          ) : null}
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Preferred Contact Method</span>
            <select name="preferredContact" defaultValue="whatsapp" className={inputClass()}>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone call</option>
              <option value="email">Email</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Property Details</h2>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Yike Property Link</span>
          <input
            name="propertyLink"
            defaultValue={defaultPropertyLink}
            inputMode="url"
            className={inputClass()}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Property Title</span>
          <input
            name="propertyTitle"
            required
            defaultValue={defaultPropertyTitle}
            className={inputClass()}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-navy">Property Type</span>
            <input name="propertyType" className={inputClass()} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Purpose</span>
            <select
              name="propertyPurpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={inputClass()}
            >
              <option value="">Select</option>
              <option value="rent">Rent</option>
              <option value="buy">Buy</option>
              <option value="shortlet">Shortlet</option>
              <option value="land">Land</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Property Location</span>
          <input
            name="propertyLocation"
            required
            value={propertyLocation}
            onChange={(e) => setPropertyLocation(e.target.value)}
            className={inputClass()}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-navy">Agent / Company Name</span>
            <input name="agentCompanyName" className={inputClass()} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy">Asking Price / Rent</span>
            <input name="askingPrice" inputMode="decimal" className={inputClass()} />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">What Should We Check?</h2>
        <ChipGroup
          options={checkOptions}
          selected={checks}
          onToggle={(id) => toggle(setChecks, id)}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Your Situation</h2>
        <ChipGroup
          options={SITUATION_FLAGS}
          selected={effectiveSituations}
          onToggle={(id) => toggle(setSituations, id)}
        />
        {cityLooksDifferent ? (
          <p className="text-xs text-muted">Outside property city has been selected.</p>
        ) : null}
        {nonNigeria ? (
          <p className="text-xs text-muted">Outside Nigeria has been selected.</p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Timeline</h2>
        <select
          name="preferredTimeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          className={inputClass("mt-0")}
        >
          <option value="flexible">Flexible</option>
          <option value="this_week">This week</option>
          <option value="48_hours">Within 48 hours</option>
          <option value="24_hours">Within 24 hours</option>
          <option value="same_day">Same day if possible</option>
        </select>
        {timeline === "same_day" ? (
          <p className="text-xs text-muted">
            Same-day inspection depends on inspector availability.
          </p>
        ) : null}
        <label className="block">
          <span className="text-xs font-semibold text-navy">Additional Notes</span>
          <textarea name="additionalNotes" className={textareaClass()} />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">{VERIFICATION_LEGAL_DISCLAIMER}</p>
        <label className="flex items-start gap-2 text-sm text-navy">
          <input name="termsAccepted" type="checkbox" required className="mt-1" />
          <span>I understand and want to submit this request.</span>
        </label>
      </section>

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-navy disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit verification request"}
      </button>
    </form>
  );
}
