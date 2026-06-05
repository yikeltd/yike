"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "./image-uploader";
import { MediaPreviewGrid } from "./media-preview-grid";
import {
  getAreasForSearchCity,
  getCitiesForState,
  LISTING_TYPES,
  MIN_LISTING_IMAGES,
  NIGERIAN_STATES,
  PAYMENT_PERIODS,
  PROPERTY_TYPES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { SubmitOverlay } from "@/components/ui/submit-overlay";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NIGERIAN_AMENITIES } from "@/constants/amenities";
import type { ListingExtras, Property } from "@/types/database";

type ListingFormProps = {
  agentId: string;
  initial?: Property;
};

export function ListingForm({ agentId, initial }: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState(initial?.state ?? "Abia");
  const [city, setCity] = useState(initial?.city ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    initial?.media_urls ?? []
  );
  const [amenities, setAmenities] = useState<string[]>(
    initial?.extras?.amenities ?? []
  );
  const cityOptions = getCitiesForState(state);
  const areas = city ? getAreasForSearchCity(city) : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Supabase is not connected. Add env vars to publish listings.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const price = Number(form.get("price"));
    const mediaRaw = (form.get("media_urls") as string) || "";
    const fromText = mediaRaw
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    const media_urls = [...new Set([...mediaUrls, ...fromText])];

    if (!price || price <= 0) {
      setError("Enter a real numeric price. Call for price is not allowed.");
      return;
    }
    if (media_urls.length < MIN_LISTING_IMAGES) {
      setError(`Add at least ${MIN_LISTING_IMAGES} photos.`);
      return;
    }

    const listingType = form.get("listing_type") as string;
    const extras: ListingExtras = {
      amenities: amenities.length > 0 ? amenities : undefined,
    };

    if (listingType === "rent") {
      const agency = Number(form.get("agency_fee_percent"));
      const caution = Number(form.get("caution_months"));
      const agreement = Number(form.get("agreement_fee"));
      const service = Number(form.get("service_charge"));
      if (agency > 0) extras.agency_fee_percent = agency;
      if (caution > 0) extras.caution_months = caution;
      if (agreement > 0) extras.agreement_fee = agreement;
      if (service > 0) extras.service_charge = service;
    }

    if (listingType === "shortlet") {
      const cleaning = Number(form.get("cleaning_fee"));
      const caution = Number(form.get("caution_deposit"));
      if (cleaning > 0) extras.cleaning_fee = cleaning;
      if (caution > 0) extras.caution_deposit = caution;
    }

    const payload = {
      agent_id: agentId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      listing_type: listingType,
      property_type: form.get("property_type") as string,
      bedrooms: Number(form.get("bedrooms") || 0),
      bathrooms: Number(form.get("bathrooms") || 0),
      toilets: Number(form.get("toilets") || 0),
      price,
      payment_period: form.get("payment_period") as string,
      state: form.get("state") as string,
      city: form.get("city") as string,
      area: form.get("area") as string,
      address_hint: (form.get("address_hint") as string) || null,
      landmark: (form.get("landmark") as string) || null,
      media_urls,
      video_url: (form.get("video_url") as string) || null,
      extras,
      status: initial?.status === "approved" ? "approved" : "pending",
      expires_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    setLoading(true);
    const supabase = createClient();

    if (initial) {
      const { error: updateError } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", initial.id);
      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/agent/listings");
    } else {
      const { error: insertError } = await supabase
        .from("properties")
        .insert(payload);
      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/agent/listings");
        router.refresh();
      }, 1200);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-elevated px-6 py-12 text-center shadow-float">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl">
          ✓
        </div>
        <p className="mt-4 text-lg font-bold text-foreground">Submitted!</p>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll review your listing shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <SubmitOverlay
        show={loading}
        message={initial ? "Updating…" : "Submitting for review…"}
      />
      <form onSubmit={handleSubmit} className="space-y-4 pb-8">
        <FormSection step={1} title="Basics" hint="Rent, buy, or shortlet">
          <Input
            name="title"
            placeholder="e.g. 2-bed flat in Ogbor Hill"
            defaultValue={initial?.title}
            required
          />
          <div className="flex gap-2">
            {LISTING_TYPES.map((t) => (
              <label key={t.value} className="flex-1">
                <input
                  type="radio"
                  name="listing_type"
                  value={t.value}
                  defaultChecked={
                    (initial?.listing_type ?? "rent") === t.value
                  }
                  className="peer sr-only"
                />
                <span className="pressable flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-surface text-sm font-semibold peer-checked:bg-gold peer-checked:text-navy peer-checked:shadow-glow-gold">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          <Select
            name="property_type"
            defaultValue={initial?.property_type ?? "flat"}
            required
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormSection>

        <FormSection step={2} title="Price & rooms">
          <Input
            name="price"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Price in ₦"
            defaultValue={initial?.price}
            required
          />
          <Select
            name="payment_period"
            defaultValue={initial?.payment_period ?? "yearly"}
          >
            {PAYMENT_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-3 gap-2">
            <Input
              name="bedrooms"
              type="number"
              min={0}
              placeholder="Beds"
              defaultValue={initial?.bedrooms ?? 1}
            />
            <Input
              name="bathrooms"
              type="number"
              min={0}
              placeholder="Baths"
              defaultValue={initial?.bathrooms ?? 1}
            />
            <Input
              name="toilets"
              type="number"
              min={0}
              placeholder="Toilets"
              defaultValue={initial?.toilets ?? 1}
            />
          </div>
        </FormSection>

        <FormSection step={3} title="Location">
          <Select
            name="state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity("");
            }}
            required
          >
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          >
            <option value="">Select city</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {areas.length > 0 ? (
            <Select name="area" defaultValue={initial?.area} required>
              <option value="">Select area</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              name="area"
              placeholder="Area / neighbourhood"
              defaultValue={initial?.area}
              required
            />
          )}
          <Input
            name="landmark"
            placeholder="Landmark (optional)"
            defaultValue={initial?.landmark ?? ""}
          />
        </FormSection>

        <FormSection step={4} title="Photos" hint="Min 3 · auto-compressed">
          <ImageUploader
            onUploaded={(u) =>
              setMediaUrls((prev) => [...prev, u.medium || u.url])
            }
          />
          <MediaPreviewGrid
            urls={mediaUrls}
            onRemove={(url) =>
              setMediaUrls((prev) => prev.filter((u) => u !== url))
            }
          />
          <details className="text-xs text-muted">
            <summary className="cursor-pointer font-semibold text-foreground">
              Paste image URLs instead
            </summary>
            <Textarea
              name="media_urls"
              className="mt-2"
              placeholder="One URL per line"
              rows={3}
            />
          </details>
        </FormSection>

        <FormSection
          title="Amenities"
          hint="What renters look for in Nigeria"
        >
          <div className="flex flex-wrap gap-2">
            {NIGERIAN_AMENITIES.map((a) => {
              const on = amenities.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setAmenities((prev) =>
                      on
                        ? prev.filter((x) => x !== a.id)
                        : [...prev, a.id]
                    )
                  }
                  className={`pressable rounded-full px-3 py-2 text-xs font-bold ${
                    on
                      ? "bg-gold text-navy shadow-glow-gold"
                      : "bg-surface text-muted"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection
          title="Rent transparency"
          hint="Helps renters trust your listing"
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="agency_fee_percent"
              type="number"
              min={0}
              max={20}
              placeholder="Agency fee %"
              defaultValue={initial?.extras?.agency_fee_percent ?? 10}
            />
            <Input
              name="caution_months"
              type="number"
              min={0}
              max={24}
              placeholder="Caution (months)"
              defaultValue={initial?.extras?.caution_months ?? 12}
            />
            <Input
              name="agreement_fee"
              type="number"
              min={0}
              placeholder="Agreement fee ₦"
              defaultValue={initial?.extras?.agreement_fee ?? 50000}
            />
            <Input
              name="service_charge"
              type="number"
              min={0}
              placeholder="Service charge ₦"
              defaultValue={initial?.extras?.service_charge ?? 0}
            />
            <Input
              name="cleaning_fee"
              type="number"
              min={0}
              placeholder="Cleaning fee (shortlet)"
              defaultValue={initial?.extras?.cleaning_fee ?? 0}
            />
            <Input
              name="caution_deposit"
              type="number"
              min={0}
              placeholder="Caution deposit (shortlet)"
              defaultValue={initial?.extras?.caution_deposit ?? 0}
            />
          </div>
        </FormSection>

        <FormSection title="Details (optional)">
          <Textarea
            name="description"
            placeholder="What makes this home special?"
            rows={4}
            defaultValue={initial?.description ?? ""}
          />
          <Input
            name="video_url"
            placeholder="Video link (optional)"
            defaultValue={initial?.video_url ?? ""}
          />
        </FormSection>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {initial ? "Save changes" : "Submit for review"}
        </Button>
        <p className="text-center text-xs text-muted">
          Listings go live after Yike review · usually within 24h
        </p>
      </form>
    </>
  );
}
