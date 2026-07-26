"use client";

/**
 * @deprecated Engine-1 — create/edit routes now use ListingEngine.
 * Kept for FAT rollback until founder confirms parity, then delete (M5).
 * See docs/implementation/ENGINE_1_IMPLEMENTATION.md
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  VEHICLE_CATEGORIES,
  specsForCategory,
  type VehicleCategoryId,
  type VehicleSpecField,
} from "@/lib/marketplace/vehicle-specs";
import {
  VEHICLE_MAKES,
  VEHICLE_MAKE_TYPES,
} from "@/lib/marketplace/vehicle-makes";
import { ListingPhotoManager } from "@/components/agent/listing-photo-manager";
import type { ListingPhotoItem } from "@/components/agent/listing-photo-types";
import { resolveVehiclePhotoSchema } from "@/lib/listing-engine/photo-schema";
import {
  clearVehicleDraft,
  loadVehicleDraft,
  saveVehicleDraft,
} from "@/lib/marketplace/vehicle-draft";
import { cn } from "@/lib/utils";

type Props = {
  listingId?: string;
  agentId?: string;
  initial?: Record<string, unknown>;
};

const STEPS = [
  { id: "category", label: "Category" },
  { id: "basics", label: "Basics" },
  { id: "specs", label: "Specs" },
  { id: "photos", label: "Photos" },
  { id: "pricing", label: "Pricing" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const BASIC_KEYS = new Set([
  "make",
  "model",
  "year",
  "condition",
  "vehicle_condition",
]);
const ADVANCED_KEYS = new Set([
  "vin",
  "engine",
  "drivetrain",
  "interior_color",
  "financing_available",
]);

function urlsToPhotoItems(urls: string[]): ListingPhotoItem[] {
  return urls.map((url, i) => ({
    id: `existing_${i}`,
    image_url: url,
    upload_status: "ready" as const,
    is_cover: i === 0,
    sort_order: i,
  }));
}

function suggestTitle(snap: Record<string, string>): string {
  const year = snap.year?.trim();
  const make = snap.make?.trim();
  const model = snap.model?.trim();
  const trim = snap.trim?.trim();
  const transmission = snap.transmission?.trim();
  const condition = (snap.vehicle_condition || snap.condition || "")
    .replace(/_/g, " ")
    .trim();
  const parts = [year, make, model, trim].filter(Boolean);
  if (parts.length === 0) return "";
  let title = parts.join(" ");
  if (transmission) {
    title += ` ${transmission.charAt(0).toUpperCase()}${transmission.slice(1)}`;
  }
  if (condition) {
    title += ` – ${condition.replace(/\b\w/g, (c) => c.toUpperCase())}`;
  }
  return title;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: VehicleSpecField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name={field.key}
          checked={value === "true" || value === "on"}
          onChange={(e) => onChange(e.target.checked ? "on" : "")}
        />
        {field.label}
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <select
          name={field.key}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2"
        >
          <option value="">Select</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      <input
        name={field.key}
        type={field.type === "number" || field.type === "year" ? "number" : "text"}
        required={field.required}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2"
      />
    </div>
  );
}

export function VehicleListingForm({ listingId, agentId, initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("category");
  const [category, setCategory] = useState<VehicleCategoryId>(
    (initial?.auto_category as VehicleCategoryId) || "car",
  );
  const [photos, setPhotos] = useState<ListingPhotoItem[]>(() =>
    urlsToPhotoItems(
      Array.isArray(initial?.media_urls)
        ? (initial?.media_urls as string[])
        : [],
    ),
  );
  const [formSnapshot, setFormSnapshot] = useState<Record<string, string>>({});
  const [titleTouched, setTitleTouched] = useState(Boolean(initial?.title));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = useMemo(() => specsForCategory(category), [category]);

  const modelsForMake = useMemo(() => {
    const make = formSnapshot.make;
    if (!make) return [] as string[];
    return [...(VEHICLE_MAKE_TYPES[make] ?? [])];
  }, [formSnapshot.make]);

  useEffect(() => {
    if (listingId || !agentId || initial) return;
    const draft = loadVehicleDraft(agentId);
    if (!draft?.data) return;
    const d = draft.data;
    if (d.auto_category) setCategory(d.auto_category as VehicleCategoryId);
    if (Array.isArray(d.media_urls)) {
      setPhotos(urlsToPhotoItems(d.media_urls as string[]));
    }
    const snap: Record<string, string> = {};
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        snap[k] = String(v);
      }
    }
    setFormSnapshot(snap);
    if (snap.title) setTitleTouched(true);
  }, [agentId, listingId, initial]);

  useEffect(() => {
    if (!agentId || listingId) return;
    const t = window.setTimeout(() => {
      const media_urls = photos
        .filter((p) => p.upload_status !== "error")
        .map((p) => p.image_url || p.webp_url || "")
        .filter(Boolean);
      saveVehicleDraft(agentId, {
        ...formSnapshot,
        auto_category: category,
        media_urls,
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [agentId, listingId, category, photos, formSnapshot]);

  useEffect(() => {
    if (titleTouched) return;
    const suggested = suggestTitle(formSnapshot);
    if (!suggested) return;
    setFormSnapshot((prev) =>
      prev.title === suggested ? prev : { ...prev, title: suggested },
    );
  }, [
    formSnapshot.make,
    formSnapshot.model,
    formSnapshot.year,
    formSnapshot.trim,
    formSnapshot.transmission,
    formSnapshot.vehicle_condition,
    formSnapshot.condition,
    titleTouched,
  ]);

  function onFieldChange(name: string, value: string) {
    setFormSnapshot((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "make") next.model = "";
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const media_urls = photos
      .filter((p) => p.upload_status !== "uploading" && p.upload_status !== "error")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => p.image_url || p.webp_url || p.thumbnail_url)
      .filter(Boolean) as string[];

    if (media_urls.length < 1) {
      setSaving(false);
      setError("Add at least one photo before submitting.");
      setStep("photos");
      return;
    }

    const body: Record<string, unknown> = {
      id: listingId,
      auto_category: category,
      title: formSnapshot.title,
      description: formSnapshot.description,
      price: Number(formSnapshot.price),
      state: formSnapshot.state,
      city: formSnapshot.city,
      area: formSnapshot.area,
      media_urls,
    };
    for (const field of fields) {
      const raw = formSnapshot[field.key] ?? "";
      if (field.type === "boolean") {
        if (field.column === "financing_available" || field.key === "financing_available") {
          body.financing_available =
            formSnapshot.financing_available === "on" ||
            formSnapshot.financing_available === "true";
        }
        continue;
      }
      if (field.column === "vehicle_condition" || field.key === "condition") {
        body.vehicle_condition = raw;
        continue;
      }
      body[field.key] = raw;
    }

    const res = await fetch("/api/agent/vehicles/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Could not save vehicle listing");
      return;
    }
    if (agentId) clearVehicleDraft(agentId);
    router.push("/agent/listings");
    router.refresh();
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const basicFields = fields.filter((f) => BASIC_KEYS.has(f.key) || BASIC_KEYS.has(f.column ?? ""));
  const primarySpecFields = fields.filter(
    (f) =>
      !BASIC_KEYS.has(f.key) &&
      !BASIC_KEYS.has(f.column ?? "") &&
      !ADVANCED_KEYS.has(f.key),
  );
  const advancedFields = fields.filter((f) => ADVANCED_KEYS.has(f.key));

  function goNext() {
    const next = STEPS[Math.min(stepIndex + 1, STEPS.length - 1)];
    setStep(next.id);
  }
  function goBack() {
    const prev = STEPS[Math.max(stepIndex - 1, 0)];
    setStep(prev.id);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-5">
      <nav aria-label="Listing steps" className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
              i === stepIndex
                ? "bg-navy text-gold"
                : i < stepIndex
                  ? "bg-gold/20 text-navy"
                  : "bg-navy/[0.06] text-navy/45",
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </nav>

      {step === "category" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            What are you listing?
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VEHICLE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-bold transition",
                  category === c.id
                    ? "border-gold bg-gold/15 text-navy"
                    : "border-navy/10 bg-white text-navy/70 hover:border-gold/40",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "basics" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Make *
            </label>
            <select
              name="make"
              required
              value={formSnapshot.make ?? ""}
              onChange={(e) => onFieldChange("make", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            >
              <option value="">Select make</option>
              {VEHICLE_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Model *
            </label>
            {modelsForMake.length > 0 ? (
              <select
                name="model"
                required
                value={formSnapshot.model ?? ""}
                onChange={(e) => onFieldChange("model", e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              >
                <option value="">Select model</option>
                {modelsForMake.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__other">Other…</option>
              </select>
            ) : (
              <input
                name="model"
                required
                value={formSnapshot.model ?? ""}
                onChange={(e) => onFieldChange("model", e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Model"
              />
            )}
            {formSnapshot.model === "__other" ? (
              <input
                className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2"
                placeholder="Enter model"
                onChange={(e) => onFieldChange("model", e.target.value)}
              />
            ) : null}
          </div>
          {basicFields
            .filter((f) => f.key !== "make" && f.key !== "model")
            .map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={formSnapshot[field.key] ?? ""}
                onChange={(v) => onFieldChange(field.key, v)}
              />
            ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">State *</label>
            <input
              name="state"
              required
              value={formSnapshot.state ?? ""}
              onChange={(e) => onFieldChange("state", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">City *</label>
            <input
              name="city"
              required
              value={formSnapshot.city ?? ""}
              onChange={(e) => onFieldChange("city", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-navy">Area</label>
            <input
              name="area"
              value={formSnapshot.area ?? ""}
              onChange={(e) => onFieldChange("area", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
        </div>
      ) : null}

      {step === "specs" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {primarySpecFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={formSnapshot[field.key] ?? ""}
                onChange={(v) => onFieldChange(field.key, v)}
              />
            ))}
          </div>
          <details
            className="rounded-xl border border-navy/10 bg-white"
            open={showAdvanced || undefined}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-navy [&::-webkit-details-marker]:hidden">
              Advanced options
            </summary>
            <div className="grid gap-4 border-t border-navy/8 px-4 py-4 sm:grid-cols-2">
              {advancedFields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={formSnapshot[field.key] ?? ""}
                  onChange={(v) => onFieldChange(field.key, v)}
                />
              ))}
            </div>
          </details>
        </div>
      ) : null}

      {step === "photos" ? (
        <div>
          <p className="mb-2 text-sm font-medium text-navy">Photos</p>
          <ListingPhotoManager
            propertyId={listingId}
            items={photos}
            onChange={setPhotos}
            photoSchema={resolveVehiclePhotoSchema()}
            listingType="sale"
          />
          <p className="mt-1 text-xs text-black/50">
            Clear photos build trust. The existing media pipeline compresses and
            protects uploads.
          </p>
        </div>
      ) : null}

      {step === "pricing" ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Title *
            </label>
            <input
              name="title"
              required
              value={formSnapshot.title ?? ""}
              onChange={(e) => {
                setTitleTouched(true);
                onFieldChange("title", e.target.value);
              }}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Auto-suggested from make, model, year"
            />
            <p className="mt-1 text-[11px] text-navy/45">
              Suggested from your basics — edit anytime.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Price (₦) *
            </label>
            <input
              name="price"
              type="number"
              required
              min={1}
              value={formSnapshot.price ?? ""}
              onChange={(e) => onFieldChange("price", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formSnapshot.description ?? ""}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              placeholder="Optional — highlight condition and history"
            />
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-3 rounded-2xl border border-navy/10 bg-white p-4">
          <h2 className="text-base font-bold text-navy">Preview</h2>
          <p className="text-2xl font-black tabular-nums text-navy">
            {formSnapshot.price
              ? `₦${Number(formSnapshot.price).toLocaleString("en-NG")}`
              : "—"}
          </p>
          <p className="font-bold text-navy">{formSnapshot.title || "Untitled"}</p>
          <p className="text-sm text-navy/55">
            {[formSnapshot.make, formSnapshot.model, formSnapshot.year]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-sm text-navy/55">
            {[formSnapshot.area, formSnapshot.city, formSnapshot.state]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="text-xs text-navy/40">
            {photos.filter((p) => p.upload_status !== "error").length} photo(s) ·{" "}
            {VEHICLE_CATEGORIES.find((c) => c.id === category)?.label}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-navy/15 bg-white px-4 py-3 text-sm font-bold text-navy"
          >
            Back
          </button>
        ) : null}
        {step !== "review" ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-navy px-4 py-3 text-sm font-bold text-gold"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gold px-4 py-3 font-semibold text-navy disabled:opacity-60"
          >
            {saving ? "Saving…" : listingId ? "Update vehicle" : "Submit for review"}
          </button>
        )}
      </div>
    </form>
  );
}
