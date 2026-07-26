"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MetadataResolver,
  NAMED_VALIDATION_RULES,
  NAMED_VISIBILITY_RULES,
  applyDependencyClears,
  getCategoryManifest,
  getListingCatalogsFromYip,
  photoChecklistStatus,
  resolvePhotoSchemaFromManifest,
  validateValues,
  valuesToPropertyPayload,
  valuesToVehiclePayload,
  type ListingCategoryId,
  type ListingValues,
} from "@/lib/listing-engine";
import { ListingPhotoManager } from "@/components/agent/listing-photo-manager";
import type { ListingPhotoItem } from "@/components/agent/listing-photo-types";
import { FieldRenderer } from "@/components/listing-engine/field-renderer";
import { cn } from "@/lib/utils";
import {
  clearVehicleDraft,
  loadVehicleDraft,
  saveVehicleDraft,
} from "@/lib/marketplace/vehicle-draft";

/** Catalogs resolved via YIP Knowledge Layer (not direct dataset imports). */
const LISTING_CATALOGS = getListingCatalogsFromYip();

type Props = {
  categoryId: ListingCategoryId;
  agentId: string;
  listingId?: string;
  initialValues?: ListingValues;
  /** Keep gates/notices outside; engine only owns the form. */
  className?: string;
};

function urlsToPhotoItems(urls: string[]): ListingPhotoItem[] {
  return urls.map((url, i) => ({
    id: `existing_${i}`,
    image_url: url,
    upload_status: "ready" as const,
    is_cover: i === 0,
    sort_order: i,
  }));
}

function readyMediaUrls(photos: ListingPhotoItem[]): string[] {
  return photos
    .filter((p) => p.upload_status !== "uploading" && p.upload_status !== "error")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => p.image_url || p.webp_url || p.thumbnail_url)
    .filter(Boolean) as string[];
}

export function ListingEngine({
  categoryId,
  agentId,
  listingId,
  initialValues,
  className,
}: Props) {
  const router = useRouter();
  const manifest = useMemo(() => getCategoryManifest(categoryId), [categoryId]);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<ListingValues>(() => {
    const defaults: ListingValues = {};
    for (const field of manifest.fields) {
      if (field.defaultValue !== undefined) defaults[field.id] = field.defaultValue;
    }
    return { ...defaults, ...initialValues };
  });
  const [photos, setPhotos] = useState<ListingPhotoItem[]>(() =>
    urlsToPhotoItems(
      Array.isArray(initialValues?.media_urls) ? (initialValues!.media_urls as string[]) : []
    )
  );
  const [titleTouched, setTitleTouched] = useState(Boolean(initialValues?.title));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const step = manifest.steps[stepIndex] ?? manifest.steps[0];
  const photoCount = readyMediaUrls(photos).length;

  const resolved = useMemo(
    () =>
      MetadataResolver.compute(manifest, values, LISTING_CATALOGS, {
        visibilityEvaluators: NAMED_VISIBILITY_RULES,
        titleTouched,
        photoCount,
      }),
    [manifest, values, titleTouched, photoCount]
  );

  // Draft restore (vehicle only — matches prior device draft behaviour)
  useEffect(() => {
    if (listingId || initialValues || categoryId !== "vehicle") return;
    const draft = loadVehicleDraft(agentId);
    if (!draft?.data) return;
    const snap: ListingValues = {};
    for (const [k, v] of Object.entries(draft.data)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        snap[k] = v;
      }
    }
    if (Array.isArray(draft.data.media_urls)) {
      setPhotos(urlsToPhotoItems(draft.data.media_urls as string[]));
    }
    setValues((prev) => ({ ...prev, ...snap }));
    if (snap.title) setTitleTouched(true);
  }, [agentId, listingId, initialValues, categoryId]);

  // Draft autosave (vehicle)
  useEffect(() => {
    if (categoryId !== "vehicle" || listingId) return;
    const t = window.setTimeout(() => {
      saveVehicleDraft(agentId, {
        ...values,
        media_urls: readyMediaUrls(photos),
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [agentId, listingId, categoryId, values, photos]);

  // Autofill patch from resolver
  useEffect(() => {
    const patch = resolved.autofillPatch;
    if (!patch || Object.keys(patch).length === 0) return;
    setValues((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (prev[k] !== v) {
          next[k] = v;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [resolved.autofillPatch]);

  function setField(id: string, value: unknown) {
    if (id === "title") setTitleTouched(true);
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setValues((prev) => {
      const withChange = { ...prev, [id]: value };
      return applyDependencyClears(manifest, id, withChange, LISTING_CATALOGS);
    });
  }

  function stepFieldIds(): string[] {
    return (resolved.stepFields[step.id] ?? []).map((f) => f.id);
  }

  function validateCurrentStep(): boolean {
    if (step.id === "photos") {
      const status = photoChecklistStatus(manifest.photo, photoCount, values);
      if (!status.ok) {
        setError(`Add at least ${manifest.photo.min} photo${manifest.photo.min === 1 ? "" : "s"}.`);
        return false;
      }
      setError(null);
      return true;
    }
    if (step.id === "review") return true;

    const result = validateValues(manifest, values, {
      visibilityEvaluators: NAMED_VISIBILITY_RULES,
      validationEvaluators: NAMED_VALIDATION_RULES,
    });
    const ids = new Set(stepFieldIds());
    const stepErrors: Record<string, string> = {};
    for (const [id, message] of Object.entries(result.errors)) {
      if (ids.has(id)) stepErrors[id] = message;
    }
    setFieldErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      setError("Check the highlighted fields.");
      return false;
    }
    setError(null);
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setStepIndex((i) => Math.min(i + 1, manifest.steps.length - 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onPublish() {
    const all = validateValues(manifest, values, {
      visibilityEvaluators: NAMED_VISIBILITY_RULES,
      validationEvaluators: NAMED_VALIDATION_RULES,
    });
    if (!all.ok) {
      setFieldErrors(all.errors);
      setError("Complete required details before publishing.");
      const firstBad = Object.keys(all.errors)[0];
      const stepWithError = manifest.steps.findIndex((s) => {
        const ids = s.fieldIds ?? s.sections?.flatMap((sec) => sec.fieldIds) ?? [];
        return ids.includes(firstBad);
      });
      if (stepWithError >= 0) setStepIndex(stepWithError);
      return;
    }
    const status = photoChecklistStatus(manifest.photo, photoCount, values);
    if (!status.ok) {
      setError(`Add at least ${manifest.photo.min} photo${manifest.photo.min === 1 ? "" : "s"}.`);
      const photoStep = manifest.steps.findIndex((s) => s.id === "photos");
      if (photoStep >= 0) setStepIndex(photoStep);
      return;
    }

    setSaving(true);
    setError(null);
    const mediaUrls = readyMediaUrls(photos);

    try {
      const adapter = manifest.submitAdapter;
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (adapter === "vehicle") {
        endpoint = "/api/agent/vehicles/create";
        body = valuesToVehiclePayload(values, { listingId, mediaUrls });
      } else if (adapter === "property") {
        endpoint = "/api/agent/listings/create";
        body = valuesToPropertyPayload(values, {
          listingId,
          mediaUrls,
          mediaItems: photos
            .filter((p) => p.upload_status !== "uploading" && p.upload_status !== "error")
            .map((p) => ({
              image_url: p.image_url,
              webp_url: p.webp_url,
              thumbnail_url: p.thumbnail_url,
              is_cover: p.is_cover,
              sort_order: p.sort_order,
            })),
        });
      } else {
        setError("This category cannot be published yet.");
        setSaving(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      setSaving(false);

      if (!res.ok) {
        if (json.code === "whatsapp_verification_required") {
          window.location.href = "/agent/verify";
          return;
        }
        if (
          json.code === "phone_verification_required" ||
          json.code === "seller_profile_required"
        ) {
          window.location.href = "/agent/verify";
          return;
        }
        setError(typeof json.error === "string" ? json.error : "Could not publish listing.");
        return;
      }

      if (categoryId === "vehicle") clearVehicleDraft(agentId);
      setSuccess(true);
      router.refresh();
    } catch {
      setSaving(false);
      setError("Could not publish listing. Check your connection and try again.");
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-elevated px-6 py-12 text-center shadow-float">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl text-navy">
          ✓
        </div>
        <p className="mt-4 text-lg font-bold text-navy">
          Your listing has been submitted for review.
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Yike checks photos and details before it goes live.
        </p>
        <button
          type="button"
          onClick={() => router.push("/agent/listings")}
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-gold text-sm font-semibold text-navy shadow-sm"
        >
          View my listings
        </button>
      </div>
    );
  }

  const stepFields = (resolved.stepFields[step.id] ?? []).filter(
    (f) => showAdvanced || !f.advanced
  );
  const hasAdvancedHidden = (resolved.stepFields[step.id] ?? []).some((f) => f.advanced);
  const coverUrl =
    photos.find((p) => p.is_cover)?.image_url ||
    photos[0]?.image_url ||
    photos[0]?.webp_url ||
    null;
  const previewTitle = String(values.title ?? "").trim() || "Your listing title";
  const previewPrice = values.price ? `₦${Number(values.price).toLocaleString("en-NG")}` : "Price";
  const previewLoc = [values.area, values.city, values.state].filter(Boolean).join(", ");

  return (
    <div className={cn("mx-auto flex max-w-2xl flex-col gap-5", className)}>
      <nav aria-label="Listing steps" className="flex flex-wrap gap-1.5">
        {manifest.steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
              i === stepIndex
                ? "bg-navy text-gold"
                : i < stepIndex
                  ? "bg-gold/20 text-navy"
                  : "bg-navy/[0.06] text-navy/45"
            )}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </nav>

      <div>
        <h2 className="text-lg font-bold text-navy">{step.title}</h2>
        {step.description ? (
          <p className="mt-1 text-sm text-muted">{step.description}</p>
        ) : null}
      </div>

      {manifest.review.showLivePreview && step.id !== "review" ? (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="relative aspect-[16/10] bg-navy/[0.04]">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill className="object-cover" sizes="640px" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                Cover photo preview
              </div>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="text-base font-bold text-navy">{previewTitle}</p>
            <p className="text-sm font-semibold text-navy/80">{previewPrice}</p>
            {previewLoc ? <p className="text-xs text-muted">{previewLoc}</p> : null}
          </div>
        </div>
      ) : null}

      {step.id === "photos" ? (
        <div className="space-y-3">
          <ListingPhotoManager
            items={photos}
            onChange={setPhotos}
            photoSchema={resolvePhotoSchemaFromManifest(manifest, values)}
          />
          {resolved.photoStatus.tips.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
                Recommended shots
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {resolved.photoStatus.tips.map((tip) => (
                  <li
                    key={tip}
                    className="rounded-full bg-navy/[0.06] px-2.5 py-1 text-[11px] font-medium text-navy/70"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-muted">
            {photoCount} / {manifest.photo.min}+ photos
            {resolved.photoStatus.ok ? " ✓" : ""}
          </p>
        </div>
      ) : null}

      {step.id === "review" ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
            <div className="relative aspect-[16/10] bg-navy/[0.04]">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="640px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="space-y-1 p-4">
              <p className="text-lg font-bold text-navy">{previewTitle}</p>
              <p className="text-base font-semibold text-navy">{previewPrice}</p>
              {previewLoc ? <p className="text-sm text-muted">{previewLoc}</p> : null}
              {values.description ? (
                <p className="mt-2 line-clamp-4 text-sm text-navy/70">{String(values.description)}</p>
              ) : null}
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {manifest.review.checklist.map((item) => {
              const ok =
                item === "photos"
                  ? resolved.photoStatus.ok
                  : item === "price"
                    ? Boolean(values.price)
                    : item === "location"
                      ? Boolean(values.state && values.city)
                      : item === "details"
                        ? Boolean(values.title)
                        : true;
              return (
                <li
                  key={item}
                  className={cn(
                    "rounded-xl border px-3 py-2 font-medium capitalize",
                    ok
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                      : "border-amber-200 bg-amber-50/80 text-amber-950"
                  )}
                >
                  {ok ? "✓" : "○"} {item}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {step.id !== "photos" && step.id !== "review" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {stepFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              options={resolved.optionsByField[field.id] ?? []}
              error={fieldErrors[field.id]}
              onChange={(v) => setField(field.id, v)}
            />
          ))}
        </div>
      ) : null}

      {hasAdvancedHidden && step.id !== "photos" && step.id !== "review" ? (
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-left text-xs font-semibold text-gold-dark hover:underline"
        >
          {showAdvanced ? "Hide advanced" : "Show advanced fields"}
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0 || saving}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy/70 disabled:opacity-40"
        >
          Back
        </button>
        {step.id === "review" ? (
          <button
            type="button"
            onClick={() => void onPublish()}
            disabled={saving}
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-sm disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-gold"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
