"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { POPULAR_CITIES } from "@/lib/constants";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { NairaInput } from "@/components/ui/naira-input";
import { parseNairaAmount } from "@/lib/naira-input";
import { FormSection } from "@/components/ui/form-section";
import {
  HumanVerifyField,
  readHumanVerifyFromForm,
} from "@/components/forms/human-verify-field";
import { trackEvent } from "@/lib/analytics";

export function PropertyRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [verifyOk, setVerifyOk] = useState(false);
  const [budgetMax, setBudgetMax] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const check = readHumanVerifyFromForm(form);
    if (!check.ok) {
      setError(check.error ?? "Please solve the math check.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Service temporarily unavailable. Try WhatsApp on our Contact page.");
      return;
    }

    const whatsapp = (form.get("whatsapp") as string).trim();
    const city = (form.get("city") as string).trim();

    if (!whatsapp || !city) {
      setError("City and WhatsApp number are required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("property_requests").insert({
      city,
      area: (form.get("area") as string).trim() || null,
      listing_type: (form.get("listing_type") as string) || "rent",
      property_type: (form.get("property_type") as string) || null,
      bedrooms: Number(form.get("bedrooms")) || null,
      budget_min: parseNairaAmount((form.get("budget_min") as string) ?? "") ?? null,
      budget_max: parseNairaAmount(budgetMax) ?? null,
      whatsapp,
      notes: (form.get("notes") as string).trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError("Could not submit. Please try again.");
      return;
    }

    setDone(true);
    trackEvent("property_request", { city, listing_type: (form.get("listing_type") as string) || "rent" });
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-gold/10 p-8 text-center">
        <p className="text-lg font-bold text-navy">Request received</p>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll match you with agents in your area. Expect WhatsApp contact
          when a fit is available.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Where do you need a home?">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted">City *</span>
            <select
              name="city"
              required
              className="mt-1 w-full rounded-xl border border-surface bg-elevated px-3 py-2.5 text-sm"
            >
              <option value="">Select city</option>
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Input name="area" placeholder="e.g. New Haven" />
        </div>
      </FormSection>

      <FormSection title="What are you looking for?">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted">Deal type</span>
            <select
              name="listing_type"
              className="mt-1 w-full rounded-xl border border-surface bg-elevated px-3 py-2.5 text-sm"
            >
              {SEARCH_DEAL_TYPES.filter((t) => t.value && !t.hub && !t.propertyType).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Property type</span>
            <select
              name="property_type"
              className="mt-1 w-full rounded-xl border border-surface bg-elevated px-3 py-2.5 text-sm"
            >
              <option value="">Any</option>
              {PROPERTY_CATEGORIES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted">Bedrooms</span>
            <Input name="bedrooms" type="number" min={0} placeholder="2" className="mt-1" />
          </label>
          <NairaInput
            label="Max budget (optional)"
            value={budgetMax}
            onChange={setBudgetMax}
          />
        </div>
      </FormSection>

      <FormSection title="How can agents reach you?">
        <label className="block">
          <span className="text-xs font-semibold text-muted">WhatsApp number *</span>
          <Input name="whatsapp" placeholder="08012345678" required className="mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted">Anything else?</span>
          <Textarea
            name="notes"
            placeholder="Must have parking, quiet street, close to UNN…"
            rows={3}
            className="mt-1"
          />
        </label>
      </FormSection>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <HumanVerifyField onValidChange={setVerifyOk} />

      <Button type="submit" disabled={loading || !verifyOk} className="w-full sm:w-auto">
        {loading ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
