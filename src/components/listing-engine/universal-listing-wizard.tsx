"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCategoryConfig } from "@/lib/listing-engine/configs";
import { isFieldVisible } from "@/lib/listing-engine/questions/evaluator";
import { validateStep, type FieldErrorMap } from "@/lib/listing-engine/validation/validator";
import { calculateProgress } from "@/lib/listing-engine/progress/calculator";
import { loadDraftLocal, saveDraftLocal, clearDraftLocal } from "@/lib/listing-engine/drafts/store";
import { trackListingEngineEvent } from "@/lib/listing-engine/analytics/tracker";
import type { FlowState } from "@/lib/listing-engine/types";
import { OnboardingLayoutContainer } from "@/components/onboarding/onboarding-layout-container";
import { QuestionRenderer } from "./question-renderer";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

type Props = {
  categoryId: string;
};

export function UniversalListingWizard({ categoryId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const config = useMemo(() => getCategoryConfig(categoryId), [categoryId]);

  const [stepIndex, setStepIndex] = useState(0);
  const [currentState, setCurrentState] = useState<FlowState>("category_selected");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Load draft on mount
  useEffect(() => {
    async function initDraft() {
      const draft = await loadDraftLocal(categoryId);
      if (draft && draft.data) {
        setFormData(draft.data);
        setStepIndex(draft.stepIndex || 0);
        setCurrentState(draft.currentState || "details_started");
      }
    }

    initDraft();
    trackListingEngineEvent("flow_started", { categoryId });
  }, [categoryId]);

  const currentStep = config.steps[stepIndex] ?? config.steps[0];

  // Calculate dynamic progress
  const progressMetrics = useMemo(
    () => calculateProgress(config, formData),
    [config, formData]
  );

  // Visible fields for current step
  const visibleStepFields = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.fields.filter((f) => isFieldVisible(f, formData));
  }, [currentStep, formData]);

  // Handle real-time field change & auto-save
  function handleFieldChange(fieldId: string, value: unknown) {
    const updatedData = { ...formData, [fieldId]: value };
    setFormData(updatedData);

    // Clear field error on edit
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }

    // Real-time Auto Save
    saveDraftLocal(categoryId, currentState, stepIndex, updatedData);
    trackListingEngineEvent("draft_saved", { categoryId, stepId: currentStep.id, stepIndex });
  }

  function handleNext() {
    // Validate current step
    const stepErrors = validateStep(visibleStepFields, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrField = Object.keys(stepErrors)[0];
      trackListingEngineEvent("validation_error_triggered", {
        categoryId,
        stepId: currentStep.id,
        errorField: firstErrField,
        errorMessage: stepErrors[firstErrField],
      });
      return;
    }

    trackListingEngineEvent("step_completed", { categoryId, stepId: currentStep.id, stepIndex });

    if (stepIndex < config.steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setCurrentState(nextIdx === config.steps.length - 1 ? "media_uploaded" : "details_started");
      saveDraftLocal(categoryId, "details_started", nextIdx, formData);
      trackListingEngineEvent("step_viewed", { categoryId, stepId: config.steps[nextIdx].id, stepIndex: nextIdx });
    } else {
      // Final step submit
      handlePublish();
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      trackListingEngineEvent("back_navigated", { categoryId, stepId: currentStep.id, stepIndex: prevIdx });
    }
  }

  function handlePublish() {
    setIsPublishing(true);
    setCurrentState("publishing");
    trackListingEngineEvent("publish_attempted", { categoryId });

    startTransition(() => {
      setTimeout(() => {
        setIsPublishing(false);
        setPublished(true);
        setCurrentState("published");
        clearDraftLocal(categoryId);
        trackListingEngineEvent("publish_succeeded", { categoryId });
      }, 1200);
    });
  }

  if (published) {
    return (
      <OnboardingLayoutContainer
        stepIndex={config.steps.length - 1}
        totalSteps={config.steps.length}
        title="Listing Published Successfully!"
        subtitle="Your listing has passed automated checks and is now live on Yike Marketplace."
        showNavigation={false}
      >
        <div className="mx-auto max-w-md text-center rounded-3xl border border-emerald-200 bg-white p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#031B4E]">Ready to Receive Buyer Leads</h2>
          <p className="text-xs text-slate-500 font-medium">
            Buyers can now inspect, inquiry, and book viewings for your {config.label} listing.
          </p>
          <button
            type="button"
            onClick={() => router.push("/agent")}
            className="pressable min-h-[48px] w-full rounded-2xl bg-[#031B4E] py-3 text-xs md:text-sm font-bold text-white shadow-md hover:bg-[#072263]"
          >
            Go to Seller Dashboard
          </button>
        </div>
      </OnboardingLayoutContainer>
    );
  }

  return (
    <OnboardingLayoutContainer
      stepIndex={stepIndex}
      totalSteps={config.steps.length}
      title={currentStep.title}
      subtitle={currentStep.subtitle}
      onBack={stepIndex > 0 ? handleBack : undefined}
      onNext={handleNext}
      isSubmitting={isPublishing || pending}
      nextLabel={stepIndex === config.steps.length - 1 ? "Publish Listing" : "Continue"}
    >
      {/* TELEMETRY METRICS BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 max-w-4xl mx-auto mb-6 shadow-xs">
        <div className="flex items-center gap-1.5 text-[#031B4E]">
          <Sparkles className="h-4 w-4 text-[#E4B547]" />
          <span>{progressMetrics.completedFields} fields completed</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Est. {progressMetrics.estimatedMinutesLeft} min remaining</span>
        </div>
      </div>

      {/* DYNAMIC QUESTIONS FORM */}
      <div className="space-y-6 max-w-4xl mx-auto">
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
    </OnboardingLayoutContainer>
  );
}
