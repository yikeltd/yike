"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCategoryConfig } from "@/lib/listing-engine/configs";
import { isFieldVisible } from "@/lib/listing-engine/questions/evaluator";
import { validateStep, type FieldErrorMap } from "@/lib/listing-engine/validation/validator";
import { calculateProgress } from "@/lib/listing-engine/progress/calculator";
import { loadDraftLocal, saveDraftLocal, clearDraftLocal } from "@/lib/listing-engine/drafts/store";
import { trackListingEngineEvent } from "@/lib/listing-engine/analytics/tracker";
import type { FlowState } from "@/lib/listing-engine/types";
import { QuestionRenderer } from "./question-renderer";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Bot,
  Eye,
  ShieldCheck,
  ChevronDown,
  Car,
  Building2,
  Rocket,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  categoryId: string;
};

export function UniversalListingWizard({ categoryId: initialCategoryId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState<string>(initialCategoryId);
  const config = useMemo(() => getCategoryConfig(activeCategory), [activeCategory]);

  const [stepIndex, setStepIndex] = useState(0);
  const [currentState, setCurrentState] = useState<FlowState>("category_selected");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Accordion states
  const [openFeatures, setOpenFeatures] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);

  // Load draft on mount
  useEffect(() => {
    async function initDraft() {
      const draft = await loadDraftLocal(activeCategory);
      if (draft && draft.data) {
        setFormData(draft.data);
        setStepIndex(draft.stepIndex || 0);
        setCurrentState(draft.currentState || "details_started");
      }
    }

    initDraft();
    trackListingEngineEvent("flow_started", { categoryId: activeCategory });
  }, [activeCategory]);

  const currentStep = config.steps[stepIndex] ?? config.steps[0];

  const progressMetrics = useMemo(
    () => calculateProgress(config, formData),
    [config, formData]
  );

  const visibleStepFields = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.fields.filter((f) => isFieldVisible(f, formData));
  }, [currentStep, formData]);

  function handleFieldChange(fieldId: string, value: unknown) {
    const updatedData = { ...formData, [fieldId]: value };
    setFormData(updatedData);

    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }

    saveDraftLocal(activeCategory, currentState, stepIndex, updatedData);
    trackListingEngineEvent("draft_saved", { categoryId: activeCategory, stepId: currentStep.id, stepIndex });
  }

  function handleNext() {
    const stepErrors = validateStep(visibleStepFields, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrField = Object.keys(stepErrors)[0];
      trackListingEngineEvent("validation_error_triggered", {
        categoryId: activeCategory,
        stepId: currentStep.id,
        errorField: firstErrField,
        errorMessage: stepErrors[firstErrField],
      });
      return;
    }

    trackListingEngineEvent("step_completed", { categoryId: activeCategory, stepId: currentStep.id, stepIndex });

    if (stepIndex < config.steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setCurrentState(nextIdx === config.steps.length - 1 ? "media_uploaded" : "details_started");
      saveDraftLocal(activeCategory, "details_started", nextIdx, formData);
      trackListingEngineEvent("step_viewed", { categoryId: activeCategory, stepId: config.steps[nextIdx].id, stepIndex: nextIdx });
    } else {
      handlePublish();
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      trackListingEngineEvent("back_navigated", { categoryId: activeCategory, stepId: currentStep.id, stepIndex: prevIdx });
    }
  }

  function handlePublish() {
    setIsPublishing(true);
    setCurrentState("publishing");
    trackListingEngineEvent("publish_attempted", { categoryId: activeCategory });

    startTransition(() => {
      setTimeout(() => {
        setIsPublishing(false);
        setPublished(true);
        setCurrentState("published");
        clearDraftLocal(activeCategory);
        trackListingEngineEvent("publish_succeeded", { categoryId: activeCategory });
      }, 1200);
    });
  }

  // Switch between Vehicle and Property flows
  function handleCategorySwitch(newCat: "vehicles" | "properties") {
    if (newCat === activeCategory) return;
    setActiveCategory(newCat);
    setStepIndex(0);
    router.push(`/agent/listings/${newCat === "vehicles" ? "vehicle" : "property"}`);
  }

  if (published) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] pb-16">
        {/* NAVY HEADER */}
        <header className="bg-[#031B4E] text-white py-6 px-4 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E4B547]/20 text-[#E4B547]">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black">Listing Published!</h1>
            <p className="text-xs text-slate-300">
              Your {config.label} listing is live on Yike Marketplace and receiving traffic.
            </p>
            <button
              type="button"
              onClick={() => router.push("/agent")}
              className="pressable min-h-[48px] w-full rounded-2xl bg-[#F59E0B] py-3 text-xs md:text-sm font-black text-[#031B4E] shadow-md hover:bg-amber-400"
            >
              Go to Dashboard
            </button>
          </div>
        </header>
      </main>
    );
  }

  const makeVal = String(formData.make || "Toyota");
  const modelVal = String(formData.model || "Corolla");
  const yearVal = String(formData.year || "2018");
  const priceVal = formData.price ? Number(formData.price).toLocaleString() : "9,500,000";
  const conditionVal = String(formData.condition || "Foreign Used");
  const mileageVal = String(formData.mileage || "95,000");
  const transVal = String(formData.transmission || "Automatic");
  const fuelVal = String(formData.fuel_type || "Petrol");
  const doorsVal = String(formData.doors || "4 Doors");
  const negotiableVal = String(formData.negotiable || "Yes");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between select-none">
      <div>
        {/* DEEP NAVY HEADER BAR */}
        <header className="bg-[#031B4E] text-white pt-4 pb-6 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (stepIndex > 0) handleBack();
                else router.push("/agent");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-[#E4B547]">
              SELL ON YIKE
            </h1>
            <div className="w-10" />
          </div>

          {/* STEPPER HEADER */}
          <div className="mx-auto max-w-md flex items-center justify-between relative px-4">
            <div className="absolute left-10 right-10 top-4 h-0.5 bg-slate-700/80 -z-0" />
            
            {/* Step 1 Node */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all shadow-md",
                  stepIndex >= 0
                    ? "bg-[#F59E0B] text-[#031B4E] ring-4 ring-[#F59E0B]/20"
                    : "bg-slate-700 text-slate-300"
                )}
              >
                {stepIndex > 0 ? <Check className="h-4 w-4 stroke-[3]" /> : "1"}
              </div>
              <span className={cn("text-[11px] font-bold", stepIndex === 0 ? "text-[#E4B547]" : "text-slate-300")}>
                Item Type
              </span>
            </div>

            {/* Step 2 Node */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all shadow-md",
                  stepIndex >= 1
                    ? "bg-[#F59E0B] text-[#031B4E] ring-4 ring-[#F59E0B]/20"
                    : "bg-slate-700 text-slate-300"
                )}
              >
                {stepIndex > 1 ? <Check className="h-4 w-4 stroke-[3]" /> : "2"}
              </div>
              <span className={cn("text-[11px] font-bold", stepIndex === 1 ? "text-[#E4B547]" : "text-slate-300")}>
                Details
              </span>
            </div>

            {/* Step 3 Node */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all shadow-md",
                  stepIndex === 2
                    ? "bg-[#F59E0B] text-[#031B4E] ring-4 ring-[#F59E0B]/20"
                    : "bg-slate-700 text-slate-300"
                )}
              >
                3
              </div>
              <span className={cn("text-[11px] font-bold", stepIndex === 2 ? "text-[#E4B547]" : "text-slate-300")}>
                Photos & Publish
              </span>
            </div>
          </div>
        </header>

        {/* MAIN FORM BODY */}
        <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 py-6 space-y-6">
          {/* STEP INDICATOR BADGE & TITLE */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-block rounded-full bg-[#E4B547]/15 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#F59E0B]">
              STEP {stepIndex + 1} OF 3
            </span>
            <h2 className="text-xl md:text-3xl font-black text-[#031B4E]">
              {currentStep.title}
            </h2>
            <p className="text-xs md:text-sm font-medium text-slate-500">
              {currentStep.subtitle}
            </p>
          </div>

          {/* STEP 1: CATEGORY SWITCHER & CARDS */}
          {stepIndex === 0 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Category Switcher Tabs */}
              <div className="flex items-center justify-center gap-3 max-w-md mx-auto p-1 rounded-2xl bg-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleCategorySwitch("vehicles")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all min-h-[48px]",
                    activeCategory === "vehicles"
                      ? "bg-white text-[#031B4E] border border-[#E4B547] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Car className="h-4 w-4 text-[#F59E0B]" />
                  <span>Vehicle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCategorySwitch("properties")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all min-h-[48px]",
                    activeCategory === "properties"
                      ? "bg-white text-[#031B4E] border border-[#E4B547] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>Property</span>
                </button>
              </div>

              {/* Vehicle Type Questions */}
              {visibleStepFields.map((field) => (
                <QuestionRenderer
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  error={errors[field.id]}
                  onChange={(val) => handleFieldChange(field.id, val)}
                />
              ))}
            </div>
          )}

          {/* STEP 2: DETAILS FORM & GROUPED SECTIONS */}
          {stepIndex === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* SMART FILL ACTIVE BANNER */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-[#031B4E]">
                    <Sparkles className="h-4 w-4 text-[#F59E0B]" />
                    <span>Smart Fill Active</span>
                  </div>
                  <span className="text-xs font-black text-[#F59E0B]">
                    {progressMetrics.completionPercent}%
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  We&apos;ll detect more details from your photos later.
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#F59E0B] transition-all duration-300"
                    style={{ width: `${progressMetrics.completionPercent}%` }}
                  />
                </div>
              </div>

              {/* BASIC INFORMATION SECTION */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-[#031B4E]">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleStepFields
                    .filter((f) => ["make", "model", "year", "condition", "body_type", "color"].includes(f.id))
                    .map((field) => (
                      <QuestionRenderer
                        key={field.id}
                        field={field}
                        value={formData[field.id]}
                        error={errors[field.id]}
                        onChange={(val) => handleFieldChange(field.id, val)}
                      />
                    ))}
                </div>
              </div>

              {/* PRICE & NEGOTIATION SECTION */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-[#031B4E]">
                  Price & Negotiation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleStepFields
                    .filter((f) => ["price", "negotiable"].includes(f.id))
                    .map((field) => (
                      <QuestionRenderer
                        key={field.id}
                        field={field}
                        value={formData[field.id]}
                        error={errors[field.id]}
                        onChange={(val) => handleFieldChange(field.id, val)}
                      />
                    ))}
                </div>
              </div>

              {/* KEY SPECIFICATIONS SECTION */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-[#031B4E]">
                  Key Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleStepFields
                    .filter((f) =>
                      [
                        "mileage",
                        "transmission",
                        "fuel_type",
                        "drive_type",
                        "engine_capacity",
                        "doors",
                      ].includes(f.id)
                    )
                    .map((field) => (
                      <QuestionRenderer
                        key={field.id}
                        field={field}
                        value={formData[field.id]}
                        error={errors[field.id]}
                        onChange={(val) => handleFieldChange(field.id, val)}
                      />
                    ))}
                </div>
              </div>

              {/* EXPANDABLE SECTIONS */}
              <div className="space-y-3">
                {/* Features Accordion */}
                <button
                  type="button"
                  onClick={() => setOpenFeatures(!openFeatures)}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-[#07142B] px-5 py-3.5 text-xs md:text-sm font-bold text-white shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>🔐 Features & Specifications</span>
                    <span className="text-[10px] text-slate-400">(0 selected)</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openFeatures && "rotate-180")} />
                </button>

                {/* Location Accordion */}
                <button
                  type="button"
                  onClick={() => setOpenLocation(!openLocation)}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-[#031B4E] shadow-xs hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span>⚙️ Location</span>
                    <span className="text-[10px] text-slate-400">(Not set)</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openLocation && "rotate-180")} />
                </button>

                {/* Vehicle Documents Accordion */}
                <button
                  type="button"
                  onClick={() => setOpenDocs(!openDocs)}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs md:text-sm font-bold text-[#031B4E] shadow-xs hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span>📄 Vehicle Documents</span>
                    <span className="text-[10px] text-slate-400">(Not set)</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openDocs && "rotate-180")} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS, AI PHOTO CHECK & REVIEW */}
          {stepIndex === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* PHOTO UPLOAD FIELD */}
              {visibleStepFields.map((field) => (
                <QuestionRenderer
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  error={errors[field.id]}
                  onChange={(val) => handleFieldChange(field.id, val)}
                />
              ))}

              {/* AI PHOTO CHECK GAUGE WIDGET */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="space-y-2">
                  <h4 className="text-xs md:text-sm font-black uppercase text-[#031B4E]">
                    AI Photo Check
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Front view: Good</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Rear view: Good</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Interior: Good</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Lighting: Good</span>
                    </div>
                  </div>
                </div>

                {/* Circular Gauge */}
                <div className="flex flex-col items-center justify-center h-20 w-20 rounded-full border-4 border-emerald-500 bg-emerald-50 text-center">
                  <span className="text-base font-black text-emerald-700">9/10</span>
                  <span className="text-[9px] font-bold text-emerald-600">Great job!</span>
                </div>
              </div>

              {/* LISTING PREVIEW CARD */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs md:text-sm font-black uppercase text-[#031B4E]">
                    Listing Preview
                  </h4>
                  <button
                    type="button"
                    onClick={() => setStepIndex(1)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative h-24 w-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <Image
                      src="/assets/onboarding/cars/car.webp"
                      alt="Vehicle preview"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm md:text-base font-black text-[#031B4E]">
                        {makeVal} {modelVal} {yearVal}
                      </h3>
                      <div className="text-right">
                        <span className="text-sm md:text-base font-black text-[#031B4E]">
                          ₦{priceVal}
                        </span>
                        <p className="text-[10px] font-bold text-emerald-600">
                          {negotiableVal === "Yes" ? "Negotiable" : "Fixed"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600">
                      {conditionVal}
                    </span>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 pt-1">
                      <span>🚘 {mileageVal} km</span>
                      <span>•</span>
                      <span>⚙️ {transVal}</span>
                      <span>•</span>
                      <span>⛽ {fuelVal}</span>
                      <span>•</span>
                      <span>🚪 {doorsVal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ALMOST DONE HIGHLIGHT BOX */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#F59E0B] flex-shrink-0" />
                <p className="text-xs font-bold text-[#031B4E]">
                  You&apos;re almost done! Your listing looks great and is ready to go live.
                </p>
              </div>
            </div>
          )}

          {/* FOOTER ACTION BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 max-w-3xl mx-auto">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isPublishing || pending}
                className="pressable min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-3 text-xs md:text-sm font-bold text-[#031B4E] hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isPublishing || pending}
              className="pressable min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-10 py-3.5 text-xs md:text-sm font-black text-[#031B4E] shadow-md hover:bg-amber-400 active:scale-98 disabled:opacity-40"
            >
              <span>
                {isPublishing
                  ? "Publishing…"
                  : stepIndex === 2
                  ? "Publish Listing 🚀"
                  : "Continue"}
              </span>
              {stepIndex < 2 && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          {stepIndex === 0 && (
            <p className="text-center text-xs font-bold text-slate-500 pt-2">
              Already have a listing?{" "}
              <button
                type="button"
                onClick={() => router.push("/agent")}
                className="text-[#F59E0B] hover:underline"
              >
                Go to dashboard
              </button>
            </p>
          )}

          {/* TRUST FOOTER (STEP 3) */}
          {stepIndex === 2 && (
            <p className="text-center text-[11px] font-bold text-slate-400 pt-1">
              🛡️ Safe • Secure • Trusted by thousands
            </p>
          )}
        </main>
      </div>

      {/* BOTTOM DEEP NAVY FEATURE HIGHLIGHTS BAR */}
      <footer className="bg-[#07142B] border-t border-slate-800 text-white py-4 px-4 mt-8">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#E4B547] flex-shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-white">Fast & Easy</h5>
              <p className="text-[10px] text-slate-400">List in under 60 seconds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#E4B547] flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-white">Smart Detection</h5>
              <p className="text-[10px] text-slate-400">Auto-detect details from photos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#E4B547] flex-shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-white">Maximum Visibility</h5>
              <p className="text-[10px] text-slate-400">Reach thousands of buyers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#E4B547] flex-shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-white">Secure & Trusted</h5>
              <p className="text-[10px] text-slate-400">Safe payments & verified users</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
