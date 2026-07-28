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
import {
  Bookmark,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Lock,
  MapPin,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";

/** Catalogs resolved via YIP Knowledge Layer */
const LISTING_CATALOGS = getListingCatalogsFromYip();

type Props = {
  categoryId: ListingCategoryId;
  agentId: string;
  listingId?: string;
  initialValues?: ListingValues;
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

  // Section Accordion State: 0: Details, 1: Photos & Pricing, 2: Location & Review
  const [activeSection, setActiveSection] = useState<number>(0);

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inReviewScreen, setInReviewScreen] = useState(false);

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

  // Compute Overall Completion Percentage (0% to 100%)
  const completionPercentage = useMemo(() => {
    let score = 0;
    // Section 1: Details (Title, Category/Property Type, Bedrooms/Make) -> 35%
    if (values.title && (values.property_type || values.make || values.category)) {
      score += 35;
    } else if (values.title || values.property_type || values.make) {
      score += 20;
    }

    // Section 2: Photos & Pricing -> 35%
    if (photoCount >= 1 && values.price) {
      score += 35;
    } else if (photoCount >= 1 || values.price) {
      score += 18;
    }

    // Section 3: Location -> 30%
    if (values.state && values.city) {
      score += 30;
    } else if (values.state || values.city) {
      score += 15;
    }

    return Math.min(score, 100);
  }, [values, photoCount]);

  // Section completions
  const sec1Complete = Boolean(values.title && (values.property_type || values.make || values.category));
  const sec2Complete = Boolean(photoCount >= 1 && values.price);
  const sec3Complete = Boolean(values.state && values.city);

  const sec1Pct = sec1Complete ? 60 : values.title ? 35 : 0;
  const sec2Pct = sec2Complete ? 35 : photoCount >= 1 || values.price ? 18 : 0;
  const sec3Pct = sec3Complete ? 30 : values.state ? 15 : 0;

  // Auto-collapse completed section & advance
  useEffect(() => {
    if (sec1Complete && activeSection === 0) {
      const t = setTimeout(() => setActiveSection(1), 600);
      return () => clearTimeout(t);
    }
    if (sec2Complete && activeSection === 1) {
      const t = setTimeout(() => setActiveSection(2), 600);
      return () => clearTimeout(t);
    }
  }, [sec1Complete, sec2Complete, activeSection]);

  // Vehicle draft autosave & load
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

  async function onPublishSubmit() {
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
        if (json.code === "whatsapp_verification_required" || json.code === "phone_verification_required") {
          window.location.href = "/agent/verify";
          return;
        }
        setError(typeof json.error === "string" ? json.error : "Could not publish listing.");
        return;
      }

      if (categoryId === "vehicle") clearVehicleDraft(agentId);
      setSuccess(true);
      setInReviewScreen(false);
      router.refresh();
    } catch {
      setSaving(false);
      setError("Could not publish listing. Check connection.");
    }
  }

  const coverUrl =
    photos.find((p) => p.is_cover)?.image_url ||
    photos[0]?.image_url ||
    photos[0]?.webp_url ||
    null;
  const previewTitle = String(values.title ?? "").trim() || "4 Bedroom Duplex in Lekki";
  const previewPrice = values.price ? `₦${Number(values.price).toLocaleString("en-NG")}` : "₦120,000,000";
  const previewLoc = [values.area, values.city, values.state].filter(Boolean).join(", ") || "Lagos, Lekki, Chevron";
  const detailsSummary = [values.property_type || values.vehicle_type || "House", values.bedrooms ? `${values.bedrooms} Beds` : null, values.city || "Lekki"].filter(Boolean).join(" • ");

  const isPublishable = completionPercentage >= 60;

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-navy/[0.06] bg-white p-8 text-center shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 font-black">
          ✓
        </div>
        <p className="mt-4 text-xl font-black text-navy">Submitted for Review</p>
        <p className="mt-2 text-xs text-navy/60">
          Yike moderates photos and details before your listing goes live.
        </p>
        <button
          type="button"
          onClick={() => router.push("/agent/listings")}
          className="pressable mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-gold text-xs font-black text-navy shadow-md"
        >
          View My Listings
        </button>
      </div>
    );
  }

  // REVIEW SCREEN MODAL / OVERLAY
  if (inReviewScreen) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setInReviewScreen(false)}
            className="pressable text-xs font-bold text-navy/60 hover:text-navy"
          >
            ← Back to Editing
          </button>
          <span className="text-xs font-extrabold uppercase text-gold">Final Review</span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-xl">
          <div className="relative aspect-[16/10] bg-navy/5">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={previewTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-navy/40">Cover Photo</div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Ready to Publish
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Trust Score 96
              </span>
            </div>

            <h2 className="text-lg font-black text-navy">{previewTitle}</h2>
            <p className="text-base font-extrabold text-navy/90">{previewPrice}</p>
            <p className="text-xs font-medium text-navy/50 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {previewLoc}
            </p>

            <div className="border-t border-navy/10 pt-3 space-y-2 text-xs">
              <p className="font-bold text-navy">Listing Details:</p>
              <p className="text-navy/70">{detailsSummary}</p>
              <p className="text-navy/70">{photoCount} Photos uploaded</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setInReviewScreen(false)}
            className="pressable flex-1 h-12 rounded-full border border-navy/15 text-xs font-bold text-navy"
          >
            Edit Listing
          </button>

          <button
            type="button"
            onClick={() => void onPublishSubmit()}
            disabled={saving}
            className="pressable flex-1 h-12 rounded-full bg-[#031B4E] text-xs font-black text-gold shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? "Publishing..." : "Final Publish 🚀"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-xl space-y-6 pb-24", className)}>
      
      {/* 2. THREE-STEP PROGRESS INDICATOR */}
      <div className="rounded-3xl border border-navy/[0.06] bg-white p-5 shadow-xs space-y-3">
        <div className="relative flex items-center justify-between">
          {/* Progress Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-1 bg-navy/10 -z-0">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Step 1: Details */}
          <button
            type="button"
            onClick={() => setActiveSection(0)}
            className="relative z-10 flex flex-col items-center gap-1 group"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all",
                sec1Complete
                  ? "bg-gold text-navy shadow-xs"
                  : activeSection === 0
                    ? "bg-[#031B4E] text-white"
                    : "bg-navy/10 text-navy/40"
              )}
            >
              {sec1Complete ? "✓" : "1"}
            </span>
            <span className="text-[11px] font-bold text-navy">Details</span>
            <span className="text-[10px] font-extrabold text-gold">{sec1Pct}%</span>
          </button>

          {/* Step 2: Photos & Pricing */}
          <button
            type="button"
            onClick={() => setActiveSection(1)}
            className="relative z-10 flex flex-col items-center gap-1 group"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all",
                sec2Complete
                  ? "bg-gold text-navy shadow-xs"
                  : activeSection === 1
                    ? "bg-[#031B4E] text-white"
                    : "bg-navy/10 text-navy/40"
              )}
            >
              {sec2Complete ? "✓" : "2"}
            </span>
            <span className="text-[11px] font-bold text-navy">Photos & Pricing</span>
            <span className="text-[10px] font-extrabold text-navy/40">{sec2Pct}%</span>
          </button>

          {/* Step 3: Location & Review */}
          <button
            type="button"
            onClick={() => setActiveSection(2)}
            className="relative z-10 flex flex-col items-center gap-1 group"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all",
                sec3Complete
                  ? "bg-gold text-navy shadow-xs"
                  : activeSection === 2
                    ? "bg-[#031B4E] text-white"
                    : "bg-navy/10 text-navy/40"
              )}
            >
              {sec3Complete ? "✓" : "3"}
            </span>
            <span className="text-[11px] font-bold text-navy">Location & Review</span>
            <span className="text-[10px] font-extrabold text-navy/40">{sec3Pct}%</span>
          </button>
        </div>
      </div>

      {/* 3. ACCORDION SECTION 1: DETAILS */}
      <div className="overflow-hidden rounded-3xl border border-navy/[0.06] bg-white shadow-xs transition-all">
        {activeSection !== 0 ? (
          // Collapsed Summary Card (approx 72–88px tall)
          <div
            onClick={() => setActiveSection(0)}
            className="pressable flex cursor-pointer items-center justify-between p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                ✓
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">1. Property Details</h3>
                <p className="text-[11px] font-medium text-navy/55">{detailsSummary}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-navy/60">
              <span className="flex items-center gap-1 text-gold-dark">
                Edit <Edit2 className="h-3 w-3" />
              </span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          // Expanded Section 1 Form
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <h3 className="text-sm font-black text-navy">1. Property Details</h3>
              <ChevronUp className="h-4 w-4 text-navy/40" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(resolved.stepFields["details"] ?? manifest.fields.slice(0, 4)).map((field) => (
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

            <button
              type="button"
              onClick={() => setActiveSection(1)}
              className="pressable flex w-full h-10 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-xs"
            >
              Save & Continue →
            </button>
          </div>
        )}
      </div>

      {/* 4. ACCORDION SECTION 2: PHOTOS & PRICING */}
      <div className="overflow-hidden rounded-3xl border border-navy/[0.06] bg-white shadow-xs transition-all">
        {activeSection !== 1 ? (
          // Collapsed Summary Card
          <div
            onClick={() => setActiveSection(1)}
            className="pressable flex cursor-pointer items-center justify-between p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Camera className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">2. Photos & Pricing</h3>
                <p className="text-[11px] font-medium text-navy/55">
                  {photoCount > 0 ? `${photoCount} Photos` : "0 Photos"} • {previewPrice} • Negotiable
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-navy/60">
              <span className="flex items-center gap-1 text-gold-dark">
                Edit <Edit2 className="h-3 w-3" />
              </span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          // Expanded Section 2 Form
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <h3 className="text-sm font-black text-navy">2. Photos & Pricing</h3>
              <span className="text-xs font-bold text-navy/40">{photoCount}/20 photos</span>
            </div>

            {/* Photos Manager Grid */}
            <ListingPhotoManager
              items={photos}
              onChange={setPhotos}
              photoSchema={resolvePhotoSchemaFromManifest(manifest, values)}
            />

            {/* Price Box */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-navy/10 p-3.5 space-y-1">
                <label className="text-xs font-bold text-navy">Price (₦)</label>
                <input
                  type="number"
                  value={String(values.price ?? "")}
                  onChange={(e) => setField("price", e.target.value ? Number(e.target.value) : "")}
                  placeholder="120,000,000"
                  className="w-full text-base font-black text-navy focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-navy/10 p-3.5 space-y-1.5">
                <p className="text-xs font-bold text-navy">Pricing options</p>
                <div className="flex items-center gap-4 text-xs font-medium text-navy/70">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-gold" />
                    <span>Negotiable</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-gold" />
                    <span>Accept offers</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="pressable flex w-full h-10 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-xs"
            >
              Save & Continue →
            </button>
          </div>
        )}
      </div>

      {/* 5. ACCORDION SECTION 3: LOCATION (MAP-FREE) & REVIEW */}
      <div className="overflow-hidden rounded-3xl border border-navy/[0.06] bg-white shadow-xs transition-all">
        {activeSection !== 2 ? (
          // Collapsed Summary Card
          <div
            onClick={() => setActiveSection(2)}
            className="pressable flex cursor-pointer items-center justify-between p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">3. Location & Review</h3>
                <p className="text-[11px] font-medium text-navy/55">{previewLoc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-navy/60">
              <span className="flex items-center gap-1 text-gold-dark">
                Edit <Edit2 className="h-3 w-3" />
              </span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          // Expanded Section 3 Form (NO MAPS)
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <h3 className="text-sm font-black text-navy">3. Location (State, City, Area)</h3>
              <ChevronUp className="h-4 w-4 text-navy/40" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-navy">State</label>
                <input
                  type="text"
                  value={String(values.state ?? "")}
                  onChange={(e) => setField("state", e.target.value)}
                  placeholder="Lagos"
                  className="w-full rounded-xl border border-navy/10 p-2.5 text-xs font-medium text-navy focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy">City / LGA</label>
                <input
                  type="text"
                  value={String(values.city ?? "")}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="Lekki"
                  className="w-full rounded-xl border border-navy/10 p-2.5 text-xs font-medium text-navy focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-navy">Area / Estate / Neighbourhood</label>
                <input
                  type="text"
                  value={String(values.area ?? "")}
                  onChange={(e) => setField("area", e.target.value)}
                  placeholder="Chevron Drive, Lekki Phase 1"
                  className="w-full rounded-xl border border-navy/10 p-2.5 text-xs font-medium text-navy focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. FOOTER ACTIONS BAR */}
      <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-xl items-center justify-between rounded-3xl border border-navy/10 bg-white/95 p-3 shadow-2xl backdrop-blur-md">
          {/* Completion Status Subtext */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-navy/70 pl-2">
            <Lock className="h-3.5 w-3.5 text-gold-dark" />
            <span>
              Publishing unlocks at <strong className="text-gold-dark">60%</strong> completion
            </span>
          </div>

          {/* Buttons: Save Draft & Publish Listing */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="pressable flex h-10 items-center gap-1.5 rounded-full border border-navy/15 px-4 text-xs font-bold text-navy hover:bg-surface"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Save draft</span>
            </button>

            <button
              type="button"
              onClick={() => setInReviewScreen(true)}
              disabled={!isPublishable}
              className={cn(
                "pressable flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-black transition-all shadow-md",
                isPublishable
                  ? "bg-[#031B4E] text-gold hover:bg-navy-light"
                  : "bg-navy/20 text-navy/40 cursor-not-allowed"
              )}
            >
              <span>Publish Listing</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
