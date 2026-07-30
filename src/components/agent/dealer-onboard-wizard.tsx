"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Building2,
  Building,
  User,
  Truck,
  Wrench,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import {
  DEALER_BUSINESS_TYPES,
  type DealerBusinessTypeId,
} from "@/lib/dealer/business-types";
import { SellerPlansView } from "@/components/subscriptions/seller-plans-view";

type Props = {
  profile: Profile;
};

const YEARS_IN_BUSINESS_OPTIONS = ["< 1 Year", "1–3 Years", "3–5 Years", "5+ Years"];

const VEHICLE_CATEGORIES = [
  "New Cars",
  "Foreign Used (Tokunbo)",
  "Nigerian Used",
  "Commercial Vehicles",
  "Luxury & Exotic",
];

const FLEET_CATEGORIES = [
  "Buses & Coasters",
  "Heavy Trucks & Trailers",
  "Delivery Vans",
  "Sedans & SUVs",
  "Logistics Equipment",
];

const EQUIPMENT_CATEGORIES = [
  "Construction Machinery",
  "Agricultural Equipment",
  "Industrial Machinery",
  "Power Generators & Plants",
];

export function DealerOnboardWizard({ profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessTypeId, setBusinessTypeId] = useState<DealerBusinessTypeId | "">(
    "car_dealership"
  );
  const [businessName, setBusinessName] = useState(profile.company_name ?? "");
  const [cacNumber, setCacNumber] = useState(profile.cac_number ?? "");
  const [yearsInBusiness, setYearsInBusiness] = useState("1–3 Years");
  const [existingProjects, setExistingProjects] = useState("");
  const [ninNumber, setNinNumber] = useState("");
  const [selectedVehicleCats, setSelectedVehicleCats] = useState<string[]>([
    "Foreign Used (Tokunbo)",
  ]);
  const [selectedFleetCats, setSelectedFleetCats] = useState<string[]>([
    "Delivery Vans",
  ]);
  const [selectedEquipCats, setSelectedEquipCats] = useState<string[]>([
    "Construction Machinery",
  ]);
  const [officeAddress, setOfficeAddress] = useState(
    profile.office_address ?? profile.residential_address ?? ""
  );
  const [state, setState] = useState(profile.residential_state ?? "Lagos");
  const [city, setCity] = useState(profile.residential_city ?? "Ikeja");
  const [phone, setPhone] = useState(profile.phone ?? profile.whatsapp ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? profile.phone ?? "");
  const [description, setDescription] = useState(profile.company_bio ?? "");

  // Progressive Steps
  const steps = ["type", "details", "contact", "plan"] as const;
  const currentStep = steps[stepIndex] ?? "type";
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const selectedTypeObj = useMemo(
    () => DEALER_BUSINESS_TYPES.find((t) => t.id === businessTypeId),
    [businessTypeId]
  );

  const canContinue = useMemo(() => {
    if (currentStep === "type") return Boolean(businessTypeId);
    if (currentStep === "details") {
      if (businessTypeId === "individual_agent") return (profile.full_name || businessName).trim().length >= 2;
      return businessName.trim().length >= 2;
    }
    if (currentStep === "contact") return phone.trim().length >= 8;
    return true;
  }, [currentStep, businessTypeId, businessName, profile.full_name, phone]);

  function next() {
    setError(null);
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function saveProgress() {
    setError(null);
    const compiledBio = [
      description.trim(),
      yearsInBusiness && `Years: ${yearsInBusiness}`,
      existingProjects.trim() && `Projects: ${existingProjects.trim()}`,
      ninNumber.trim() && `NIN: ${ninNumber.trim()}`,
      selectedVehicleCats.length > 0 && `Vehicles: ${selectedVehicleCats.join(", ")}`,
      selectedFleetCats.length > 0 && `Fleet: ${selectedFleetCats.join(", ")}`,
      selectedEquipCats.length > 0 && `Equipment: ${selectedEquipCats.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("/api/agent/dealer-onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessTypeId,
        companyName: (businessName || profile.full_name || "Agent").trim(),
        cacNumber: cacNumber.trim() || undefined,
        officeAddress: officeAddress.trim(),
        residentialState: state.trim(),
        residentialCity: city.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        companyBio: compiledBio,
      }),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(json?.error ?? "Could not save onboarding profile");
    }
  }

  function toggleVehicleCategory(cat: string) {
    setSelectedVehicleCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleFleetCategory(cat: string) {
    setSelectedFleetCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleEquipCategory(cat: string) {
    setSelectedEquipCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 select-none">
      {/* ONBOARDING HEADER & PROGRESS */}
      {currentStep !== "plan" && (
        <div className="space-y-4 text-center max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E4B547]/40 bg-[#E4B547]/10 px-3.5 py-1 text-xs font-bold text-[#E4B547]">
            <Sparkles className="h-3.5 w-3.5 text-[#E4B547]" />
            <span>Intelligent Seller Onboarding</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#031B4E]">
            {currentStep === "type" && "What best describes you?"}
            {currentStep === "details" && `Tell us about your ${selectedTypeObj?.label ?? "business"}`}
            {currentStep === "contact" && "Verification & Contact Details"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {currentStep === "type" && "Select your primary business type to customize your listing tools and verification."}
            {currentStep === "details" && "We've tailored these fields specifically for your selected seller profile."}
            {currentStep === "contact" && "Ensure your buyer contact info and identity details are accurate."}
          </p>

          {/* PROGRESS BAR */}
          <div className="pt-2 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E4B547] to-amber-500 transition-all duration-300 shadow-2xs"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <span>{progress}% Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: BUSINESS TYPE SELECTION */}
      {currentStep === "type" && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEALER_BUSINESS_TYPES.map((t) => {
            const isSelected = businessTypeId === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setBusinessTypeId(t.id)}
                className={cn(
                  "pressable group flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all shadow-2xs",
                  isSelected
                    ? "border-[#E4B547] bg-[#E4B547]/10 ring-2 ring-[#E4B547]/30 shadow-md"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-[#E4B547] text-[#031B4E]"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  )}
                >
                  {t.id === "car_dealership" && <Car className="h-5 w-5" />}
                  {t.id === "property_agency" && <Building2 className="h-5 w-5" />}
                  {t.id === "property_developer" && <Building className="h-5 w-5" />}
                  {t.id === "individual_agent" && <User className="h-5 w-5" />}
                  {t.id === "fleet_company" && <Truck className="h-5 w-5" />}
                  {t.id === "equipment_dealer" && <Wrench className="h-5 w-5" />}
                  {t.id === "other" && <Store className="h-5 w-5" />}
                </div>

                <div className="space-y-0.5">
                  <span className="block text-sm font-bold text-[#031B4E]">
                    {t.label}
                  </span>
                  <span className="block text-xs font-medium text-slate-500 leading-snug">
                    {t.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 2: ADAPTIVE DYNAMIC FIELDS */}
      {currentStep === "details" && (
        <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          {/* PROPERTY AGENCY FIELDS */}
          {businessTypeId === "property_agency" && (
            <div className="space-y-4">
              <InputField
                label="Agency Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Primrose Real Estate Agency"
              />
              <InputField
                label="CAC Registration Number (Optional)"
                value={cacNumber}
                onChange={setCacNumber}
                placeholder="RC / BN Number"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-[#031B4E] mb-1.5">
                  Years in Business
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {YEARS_IN_BUSINESS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setYearsInBusiness(opt)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                        yearsInBusiness === opt
                          ? "border-[#E4B547] bg-[#E4B547]/15 text-[#031B4E] font-black"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Operating State *" value={state} onChange={setState} />
                <InputField label="Primary City *" value={city} onChange={setCity} />
              </div>
            </div>
          )}

          {/* CAR DEALERSHIP FIELDS */}
          {businessTypeId === "car_dealership" && (
            <div className="space-y-4">
              <InputField
                label="Dealership Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Stankings Motors Lagos"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-[#031B4E] mb-1.5">
                  Vehicle Categories Handled
                </label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_CATEGORIES.map((cat) => {
                    const active = selectedVehicleCats.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleVehicleCategory(cat)}
                        className={cn(
                          "py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
                          active
                            ? "border-amber-400 bg-amber-50 text-amber-900"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <InputField
                label="CAC Registration Number"
                value={cacNumber}
                onChange={setCacNumber}
                placeholder="RC-XXXXXX"
              />
              <InputField
                label="Dealership Showroom Address *"
                value={officeAddress}
                onChange={setOfficeAddress}
                placeholder="Street address & location"
              />
            </div>
          )}

          {/* PROPERTY DEVELOPER FIELDS */}
          {businessTypeId === "property_developer" && (
            <div className="space-y-4">
              <InputField
                label="Developer / Company Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Apex Luxury Developments"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-[#031B4E] mb-1">
                  Current & Past Projects
                </label>
                <textarea
                  value={existingProjects}
                  onChange={(e) => setExistingProjects(e.target.value)}
                  rows={3}
                  placeholder="e.g. Haven Estate Lekki Phase 1, Grand Horizon Towers..."
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs outline-none focus:border-[#E4B547] focus:ring-2 focus:ring-[#E4B547]/20"
                />
              </div>
              <InputField
                label="CAC Registration Number"
                value={cacNumber}
                onChange={setCacNumber}
              />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Operating State *" value={state} onChange={setState} />
                <InputField label="Primary City *" value={city} onChange={setCity} />
              </div>
            </div>
          )}

          {/* INDIVIDUAL AGENT FIELDS */}
          {businessTypeId === "individual_agent" && (
            <div className="space-y-4">
              <InputField
                label="Full Name *"
                value={businessName || profile.full_name || ""}
                onChange={setBusinessName}
                placeholder="Your full legal name"
              />
              <InputField
                label="National Identity Number (NIN) for Verification"
                value={ninNumber}
                onChange={setNinNumber}
                placeholder="11-digit NIN"
              />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Primary State *" value={state} onChange={setState} />
                <InputField label="Operating Cities *" value={city} onChange={setCity} />
              </div>
            </div>
          )}

          {/* FLEET COMPANY FIELDS */}
          {businessTypeId === "fleet_company" && (
            <div className="space-y-4">
              <InputField
                label="Fleet Company Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Trans-Express Fleet Ltd"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-[#031B4E] mb-1.5">
                  Fleet Vehicle Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {FLEET_CATEGORIES.map((cat) => {
                    const active = selectedFleetCats.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleFleetCategory(cat)}
                        className={cn(
                          "py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
                          active
                            ? "border-blue-400 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <InputField label="CAC Registration Number" value={cacNumber} onChange={setCacNumber} />
            </div>
          )}

          {/* EQUIPMENT DEALER FIELDS */}
          {businessTypeId === "equipment_dealer" && (
            <div className="space-y-4">
              <InputField
                label="Equipment Dealership Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Sahara Heavy Machinery Ltd"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-[#031B4E] mb-1.5">
                  Machinery & Equipment Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_CATEGORIES.map((cat) => {
                    const active = selectedEquipCats.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleEquipCategory(cat)}
                        className={cn(
                          "py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
                          active
                            ? "border-purple-400 bg-purple-50 text-purple-900"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <InputField label="Office Address" value={officeAddress} onChange={setOfficeAddress} />
            </div>
          )}

          {/* OTHER PROFESSIONAL SELLER FIELDS */}
          {businessTypeId === "other" && (
            <div className="space-y-4">
              <InputField
                label="Business / Merchant Name *"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Prestige Commercial Services"
              />
              <InputField
                label="CAC / Registration Number (Optional)"
                value={cacNumber}
                onChange={setCacNumber}
              />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Operating State *" value={state} onChange={setState} />
                <InputField label="City *" value={city} onChange={setCity} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CONTACT & VERIFICATION */}
      {currentStep === "contact" && (
        <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <InputField
            label="Support Phone Number *"
            value={phone}
            onChange={setPhone}
            placeholder="+234 800 000 0000"
          />

          <InputField
            label="WhatsApp Contact Number"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="+234 800 000 0000"
          />

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Identity & Business Verification Readiness</span>
            </div>
            <p className="leading-relaxed text-emerald-800">
              Your email is verified. Upload CAC documents or Government ID in your business settings anytime after picking a seller plan.
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: EMBEDDED SELLER PLANS */}
      {currentStep === "plan" && (
        <div className="mt-4 space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
              Onboarding Complete!
            </span>
            <h2 className="text-xl font-bold text-[#031B4E]">Choose your Seller Plan</h2>
            <p className="text-xs text-slate-500 font-medium">Select a plan to unlock listing limits and buyer lead routing.</p>
          </div>

          <SellerPlansView />
        </div>
      )}

      {error && <p className="mt-3 text-xs font-bold text-rose-600 text-center">{error}</p>}

      {/* NAVIGATION CONTROLS */}
      {currentStep !== "plan" && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0 || pending}
            className="pressable flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-[#031B4E] hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {currentStep === "contact" ? (
            <button
              type="button"
              disabled={!canContinue || pending}
              onClick={() => {
                startTransition(() => {
                  void (async () => {
                    try {
                      await saveProgress();
                      next();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Save failed");
                    }
                  })();
                });
              }}
              className="pressable flex items-center gap-1.5 rounded-2xl bg-[#F59E0B] px-6 py-2.5 text-xs font-black text-[#031B4E] shadow-md hover:bg-amber-400 active:scale-98 disabled:opacity-50"
            >
              <span>{pending ? "Saving…" : "Continue to Plans"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || pending}
              onClick={next}
              className="pressable flex items-center gap-1.5 rounded-2xl bg-[#031B4E] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#072263] active:scale-98 disabled:opacity-40"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs font-medium text-slate-400">
        Already registered?{" "}
        <Link href="/agent" className="font-bold text-[#031B4E] underline">
          Go to Seller Dashboard
        </Link>
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-bold uppercase text-[#031B4E]">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-[#E4B547] focus:ring-2 focus:ring-[#E4B547]/20"
      />
    </label>
  );
}
