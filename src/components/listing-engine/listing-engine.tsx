"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MetadataResolver,
  NAMED_VALIDATION_RULES,
  NAMED_VISIBILITY_RULES,
  applyDependencyClears,
  buildListingReviewSummary,
  clearEngineListingDraft,
  getOrCreateListingDraftSessionId,
  markEngineListingDraftConsumed,
  parseEngineListingDraftFromStorageEvent,
  computeListingWizardProgress,
  listListingWizardBlockers,
  resolveListingWizardNextAction,
  fieldJumpTarget,
  getCategoryManifestOrNull,
  getListingCatalogsFromYip,
  getManifestDetailsStepIds,
  isListingCategoryCreatable,
  loadEngineListingDraft,
  loadEngineListingDraftWithLegacyFallback,
  migrateLegacyVehicleDraft,
  resetListingDraftSessionId,
  resolvePhotoSchemaFromManifest,
  sanitizeMediaItemLabels,
  saveEngineListingDraft,
  validateValues,
  buildPropertyCreateApiBody,
  valuesToVehiclePayload,
  valuesToElectronicsPayload,
  type CategoryManifest,
  type ListingCategoryId,
  type ListingValues,
} from "@/lib/listing-engine";
import { ListingPhotoManager } from "@/components/agent/listing-photo-manager";
import type { ListingPhotoItem } from "@/components/agent/listing-photo-types";
import { FieldRenderer } from "@/components/listing-engine/field-renderer";
import { ListingSmartDescribe } from "@/components/listing-engine/listing-smart-describe";
import { cn } from "@/lib/utils";
import {
  applyListingSuggestions,
  firstLineAsTitle,
  parseListingText,
} from "@/lib/listing-engine/intelligence";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { deterministicListingCreateId } from "@/lib/listing-create/idempotency";
import { readyListingPhotoUrls } from "@/lib/listing-create/photo-readiness";
import {
  clearDraftMediaRegistry,
  markDraftMediaCommitted,
  trackDraftMediaUrl,
} from "@/lib/listing-create/draft-media-registry";
import {
  clearListingSubmitIdempotencyKey,
  clearPendingListingId,
  getListingSubmitIdempotencyKey,
  getPendingListingId,
  setPendingListingId,
} from "@/lib/listing-submit-log";
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

type DraftUiStatus =
  | "idle"
  | "saving"
  | "saved"
  | "restored"
  | "error"
  | "quota_exceeded"
  | "storage_unavailable"
  | "conflict";

export function ListingEngine(props: Props) {
  const manifest = getCategoryManifestOrNull(props.categoryId);
  if (!manifest || !isListingCategoryCreatable(props.categoryId)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-navy/10 bg-white p-6 text-center shadow-xs">
        <p className="text-base font-bold text-navy">This category is not available yet</p>
        <p className="mt-2 text-sm text-muted">
          Yike supports property, vehicles, and electronics listing creation when enabled.
          Jobs, services, boats, and other verticals stay read-only until a manifest ships.
        </p>
        <Link
          href="/agent/listings/choose"
          className="pressable mt-5 inline-flex h-11 items-center justify-center rounded-full bg-navy px-6 text-sm font-bold text-gold"
        >
          Choose a category
        </Link>
      </div>
    );
  }
  return <ListingEngineInner {...props} manifest={manifest} />;
}

function ListingEngineInner({
  categoryId,
  agentId,
  listingId,
  initialValues,
  className,
  manifest,
}: Props & { manifest: CategoryManifest }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hintConsumedRef = useRef(false);

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
  const [draftStatus, setDraftStatus] = useState<DraftUiStatus>("idle");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const saveGenerationRef = useRef(0);
  const draftLoadedRef = useRef(false);
  const draftRevisionRef = useRef(0);
  const draftSessionIdRef = useRef(
    getOrCreateListingDraftSessionId(agentId, categoryId),
  );
  const [draftConflictRemote, setDraftConflictRemote] = useState(false);
  const [smartDescribeText, setSmartDescribeText] = useState("");
  const [inferredFieldIds, setInferredFieldIds] = useState<Set<string>>(() => new Set());
  const [pendingSuggestionsByField, setPendingSuggestionsByField] = useState<
    Record<string, { value: unknown; label?: string }[]>
  >({});
  const confirmedFieldIdsRef = useRef<Set<string>>(new Set());
  const [descriptionTouched, setDescriptionTouched] = useState(
    Boolean(String(initialValues?.description ?? "").trim()),
  );
  const [dependencyNotice, setDependencyNotice] = useState<string | null>(null);

  const photoCount = readyListingPhotoUrls(photos).length;

  const activePhotoSchema = useMemo(
    () => resolvePhotoSchemaFromManifest(manifest, values),
    [manifest, values],
  );

  const resolved = useMemo(
    () =>
      MetadataResolver.compute(manifest, values, LISTING_CATALOGS, {
        visibilityEvaluators: NAMED_VISIBILITY_RULES,
        titleTouched,
        photoCount,
      }),
    [manifest, values, titleTouched, photoCount]
  );

  const wizard = useMemo(
    () =>
      computeListingWizardProgress(
        manifest,
        values,
        resolved.stepFields,
        resolved.photoStatus,
      ),
    [manifest, values, resolved.stepFields, resolved.photoStatus],
  );

  const detailsStepIds = useMemo(
    () => getManifestDetailsStepIds(manifest),
    [manifest],
  );

  const visibleFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fields of Object.values(resolved.stepFields)) {
      for (const f of fields) ids.add(f.id);
    }
    return ids;
  }, [resolved.stepFields]);

  const reviewRows = useMemo(
    () => buildListingReviewSummary(manifest, values, visibleFieldIds),
    [manifest, values, visibleFieldIds],
  );

  const nextAction = useMemo(
    () =>
      resolveListingWizardNextAction({
        manifest,
        values,
        stepFields: resolved.stepFields,
        photoStatus: resolved.photoStatus,
      }),
    [manifest, values, resolved.stepFields, resolved.photoStatus],
  );

  const reviewBlockers = useMemo(
    () =>
      listListingWizardBlockers({
        manifest,
        values,
        stepFields: resolved.stepFields,
        photoStatus: resolved.photoStatus,
      }),
    [manifest, values, resolved.stepFields, resolved.photoStatus],
  );

  function runClientValidation(markAttempted = false): boolean {
    if (markAttempted) setValidationAttempted(true);
    const result = validateValues(manifest, values, {
      visibilityEvaluators: NAMED_VISIBILITY_RULES,
      validationEvaluators: NAMED_VALIDATION_RULES,
    });
    if (markAttempted) {
      setFieldErrors(result.errors);
    }
    return result.ok && resolved.photoStatus.ok;
  }

  useEffect(() => {
    setPhotos((prev) => sanitizeMediaItemLabels(prev, activePhotoSchema));
  }, [activePhotoSchema.id]);

  function jumpToField(fieldId: string) {
    const target = fieldJumpTarget(fieldId, manifest);
    setInReviewScreen(false);
    setActiveSection(target.sectionIndex);
    window.requestAnimationFrame(() => {
      document.getElementById(`le-${fieldId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function handleOpenReview() {
    setError(null);
    setValidationAttempted(true);
    runClientValidation(true);
    setInReviewScreen(true);
  }

  function performPrimaryAction() {
    if (nextAction.kind === "ready") {
      handleOpenReview();
      return;
    }
    setInReviewScreen(false);
    setActiveSection(nextAction.sectionIndex);
    if (nextAction.fieldId) {
      window.requestAnimationFrame(() => {
        document.getElementById(`le-${nextAction.fieldId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }

  useEffect(() => {
    if (hintConsumedRef.current) return;
    const hint = searchParams.get("hint")?.trim();
    if (hint) {
      hintConsumedRef.current = true;
      setSmartDescribeText(hint);
    }
  }, [searchParams]);

  useEffect(() => {
    if (listingId || initialValues || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const draftSessionId = draftSessionIdRef.current;
    if (categoryId === "vehicle") {
      migrateLegacyVehicleDraft(agentId, draftSessionId);
    }
    const draft = loadEngineListingDraftWithLegacyFallback(
      agentId,
      categoryId,
      draftSessionId,
    );
    if (!draft) return;
    const snap: ListingValues = {};
    for (const [k, v] of Object.entries(draft.values)) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        Array.isArray(v)
      ) {
        snap[k] = v;
      }
    }
    if (draft.media_urls.length > 0) {
      setPhotos(urlsToPhotoItems(draft.media_urls));
    }
    setValues((prev) => ({ ...prev, ...snap }));
    if (typeof draft.activeSection === "number") {
      setActiveSection(Math.min(2, Math.max(0, draft.activeSection)));
    }
    if (snap.title) setTitleTouched(true);
    draftRevisionRef.current = draft.revision ?? 0;
    setDraftStatus("restored");
  }, [agentId, listingId, initialValues, categoryId]);

  useEffect(() => {
    if (listingId) return;
    const onStorage = (event: StorageEvent) => {
      const remote = parseEngineListingDraftFromStorageEvent(
        event.key ?? "",
        event.newValue,
        agentId,
        categoryId,
        draftSessionIdRef.current,
      );
      if (!remote) return;
      if (remote.revision > draftRevisionRef.current) {
        setDraftConflictRemote(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [agentId, categoryId, listingId]);

  useEffect(() => {
    if (listingId) return;
    const generation = ++saveGenerationRef.current;
    setDraftStatus((prev) => (prev === "conflict" ? "conflict" : "saving"));
    const t = window.setTimeout(() => {
      const result = saveEngineListingDraft(
        {
          version: 2,
          agentId,
          categoryId,
          draftSessionId: draftSessionIdRef.current,
          activeSection,
          values: { ...values },
          media_urls: readyListingPhotoUrls(photos),
        },
        { baseRevision: draftRevisionRef.current },
      );
      if (generation !== saveGenerationRef.current) return;
      if (result.ok) {
        draftRevisionRef.current = result.revision;
        setDraftStatus("saved");
        setDraftConflictRemote(false);
        return;
      }
      if (result.reason === "blocked_by_remote") {
        setDraftConflictRemote(true);
        setDraftStatus("conflict");
        return;
      }
      if (result.reason === "quota_exceeded") {
        setDraftStatus("quota_exceeded");
        return;
      }
      setDraftStatus("storage_unavailable");
    }, 900);
    return () => window.clearTimeout(t);
  }, [agentId, listingId, categoryId, values, photos, activeSection]);

  useEffect(() => {
    if (listingId) return;
    for (const photo of photos) {
      if (photo.upload_status === "ready" && photo.image_url) {
        trackDraftMediaUrl(draftSessionIdRef.current, photo.image_url);
      }
    }
  }, [photos, listingId]);

  function reloadDraftFromDevice() {
    const draft = loadEngineListingDraft(
      agentId,
      categoryId,
      draftSessionIdRef.current,
    );
    if (!draft) return;
    const snap: ListingValues = {};
    for (const [k, v] of Object.entries(draft.values)) {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        Array.isArray(v)
      ) {
        snap[k] = v;
      }
    }
    if (draft.media_urls.length > 0) {
      setPhotos(urlsToPhotoItems(draft.media_urls));
    }
    setValues((prev) => ({ ...prev, ...snap }));
    draftRevisionRef.current = draft.revision ?? 0;
    setDraftConflictRemote(false);
    setDraftStatus("restored");
  }

  function setField(id: string, value: unknown, opts?: { fromInference?: boolean }) {
    if (id === "title") setTitleTouched(true);
    if (id === "description") setDescriptionTouched(true);
    if (!opts?.fromInference) {
      confirmedFieldIdsRef.current.add(id);
      setInferredFieldIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setValues((prev) => {
      const withChange = { ...prev, [id]: value };
      const next = applyDependencyClears(manifest, id, withChange, LISTING_CATALOGS);
      const clearedLabels = manifest.fields
        .filter((f) => {
          if (f.id === id) return false;
          const was = prev[f.id];
          const now = next[f.id];
          const had = was !== undefined && was !== null && String(was).trim() !== "";
          const gone =
            now === undefined ||
            now === null ||
            (typeof now === "string" && now.trim() === "");
          return had && gone;
        })
        .map((f) => f.label);
      if (clearedLabels.length > 0) {
        const changedLabel = manifest.fields.find((f) => f.id === id)?.label ?? "selection";
        setDependencyNotice(
          `${clearedLabels.join(", ")} cleared — not valid after ${changedLabel} changed.`,
        );
      } else {
        setDependencyNotice(null);
      }
      return next;
    });
  }

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const lastAutofillKeyRef = useRef("");

  useEffect(() => {
    const patch = resolved.autofillPatch;
    const key = JSON.stringify(patch);
    if (!key || key === "{}" || key === lastAutofillKeyRef.current) return;
    lastAutofillKeyRef.current = key;
    setValues((prev) => {
      let next = prev;
      for (const [fieldKey, val] of Object.entries(patch)) {
        if (confirmedFieldIdsRef.current.has(fieldKey)) continue;
        const cur = prev[fieldKey];
        if (cur !== undefined && cur !== null && String(cur).trim() !== "") continue;
        next = { ...next, [fieldKey]: val };
      }
      return next;
    });
  }, [resolved.autofillPatch]);

  useEffect(() => {
    const combined = [
      smartDescribeText,
      String(values.title ?? ""),
      String(values.description ?? ""),
    ]
      .filter(Boolean)
      .join("\n");
    if (!combined.trim()) {
      setPendingSuggestionsByField({});
      return;
    }
    const t = window.setTimeout(() => {
      const currentValues = valuesRef.current;
      const parsed = parseListingText(manifest, combined, currentValues, LISTING_CATALOGS);
      const applied = applyListingSuggestions(
        parsed.fields,
        currentValues,
        confirmedFieldIdsRef.current,
      );
      setPendingSuggestionsByField(
        Object.fromEntries(
          Object.entries(applied.pendingByField).map(([fieldId, list]) => [
            fieldId,
            list.map((s) => ({ value: s.value, label: s.label })),
          ]),
        ),
      );
      if (Object.keys(applied.patch).length > 0) {
        setInferredFieldIds((prev) => {
          const next = new Set(prev);
          for (const id of applied.inferredFieldIds) next.add(id);
          return next;
        });
        setValues((prev) => {
          let next = { ...prev };
          for (const [fieldKey, val] of Object.entries(applied.patch)) {
            next = applyDependencyClears(
              manifest,
              fieldKey,
              { ...next, [fieldKey]: val },
              LISTING_CATALOGS,
            );
          }
          return next;
        });
      }
      const titleFromSmart = firstLineAsTitle(smartDescribeText);
      if (
        titleFromSmart &&
        !titleTouched &&
        !confirmedFieldIdsRef.current.has("title") &&
        smartDescribeText.trim().length > 8
      ) {
        setValues((prev) => ({ ...prev, title: titleFromSmart }));
        setInferredFieldIds((prev) => new Set(prev).add("title"));
      }
      if (
        smartDescribeText.trim().length > 80 &&
        !descriptionTouched &&
        !confirmedFieldIdsRef.current.has("description")
      ) {
        setValues((prev) => ({
          ...prev,
          description: smartDescribeText.trim().slice(0, 2000),
        }));
        setInferredFieldIds((prev) => new Set(prev).add("description"));
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [smartDescribeText, values.title, values.description, manifest, titleTouched, descriptionTouched]);

  async function onPublishSubmit() {
    if (!runClientValidation(true)) {
      setError("Check the highlighted fields before publishing.");
      setInReviewScreen(false);
      return;
    }
    setSaving(true);
    setError(null);
    const mediaUrls = readyListingPhotoUrls(photos);
    const idempotencyKey = getListingSubmitIdempotencyKey(agentId);

    try {
      const adapter = manifest.submitAdapter;
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (adapter === "vehicle") {
        endpoint = "/api/agent/vehicles/create";
        body = valuesToVehiclePayload(values, { listingId, mediaUrls, idempotencyKey });
      } else if (adapter === "electronics") {
        endpoint = "/api/agent/electronics/create";
        body = valuesToElectronicsPayload(values, { listingId, mediaUrls, idempotencyKey });
      } else if (adapter === "property") {
        endpoint = "/api/agent/listings/create";
        const reservedListingId =
          listingId ??
          getPendingListingId(agentId) ??
          deterministicListingCreateId("property", agentId, idempotencyKey);
        if (!listingId) {
          setPendingListingId(agentId, reservedListingId);
        }
        body = buildPropertyCreateApiBody(values, {
          listingId: reservedListingId,
          mediaUrls,
          idempotencyKey,
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
        if (json.code === "phone_verification_required") {
          window.location.href = "/agent/verify";
          return;
        }
        setError(typeof json.error === "string" ? json.error : "Could not publish listing.");
        return;
      }

      if (!listingId) {
        const sessionId = draftSessionIdRef.current;
        const publishedUrls = readyListingPhotoUrls(photos);
        markDraftMediaCommitted(sessionId, publishedUrls);
        clearDraftMediaRegistry(sessionId);
        clearEngineListingDraft(agentId, categoryId, sessionId);
        markEngineListingDraftConsumed(agentId, categoryId, "published", sessionId);
        draftSessionIdRef.current = resetListingDraftSessionId(agentId, categoryId);
        clearPendingListingId(agentId);
        clearListingSubmitIdempotencyKey(agentId);
      }
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
  const previewTitle =
    String(values.title ?? "").trim() ||
    [values.make ?? values.brand, values.model].filter(Boolean).join(" ").trim() ||
    manifest.label;
  const previewPrice = values.price
    ? `₦${Number(values.price).toLocaleString("en-NG")}`
    : null;
  const previewLoc =
    [values.area, values.city, values.state].filter(Boolean).join(", ") ||
    "Add location";
  const detailsSummary = [
    values.property_type || values.auto_category || manifest.label,
    values.bedrooms != null && values.bedrooms !== ""
      ? `${values.bedrooms} bed`
      : null,
    values.make || values.brand,
    values.model,
  ]
    .filter(Boolean)
    .join(" · ");

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-navy/[0.06] bg-white p-8 text-center shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl font-black text-navy">
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
                Review before publish
              </span>
              {wizard.canPublish ? (
                <span className="rounded-full bg-navy/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-navy">
                  Requirements met
                </span>
              ) : (
                <span className="rounded-full border border-navy/15 px-2.5 py-0.5 text-[10px] font-semibold text-navy/70">
                  Missing required info
                </span>
              )}
            </div>

            <h2 className="text-lg font-black text-navy">{previewTitle}</h2>
            {previewPrice ? (
              <p className="text-base font-extrabold text-navy/90">{previewPrice}</p>
            ) : (
              <p className="text-sm text-muted">Price not set</p>
            )}
            <p className="text-xs font-medium text-navy/50 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {previewLoc}
            </p>

            <div className="border-t border-navy/10 pt-3 space-y-2 text-xs">
              <p className="font-bold text-navy">What buyers will see</p>
              <ul className="space-y-1.5 text-navy/75">
                {reviewRows.map((row) => (
                  <li key={row.label} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="font-semibold text-navy/85">{row.label}:</span>{" "}
                      {row.value}
                    </span>
                    {row.fieldId ? (
                      <button
                        type="button"
                        onClick={() => jumpToField(row.fieldId!)}
                        className="shrink-0 font-bold text-gold-dark hover:underline"
                      >
                        Edit
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="text-navy/70">
                {photoCount} photo{photoCount === 1 ? "" : "s"} attached
              </p>
            </div>

            {reviewBlockers.length > 0 ? (
              <div className="rounded-xl border border-navy/10 bg-surface/80 px-3 py-3">
                <p className="text-xs font-semibold text-navy">Required before publish</p>
                <ul className="mt-1.5 space-y-2 text-xs text-navy/75">
                  {reviewBlockers.map((item) => (
                    <li key={`${item.message}-${item.fieldId ?? "photos"}`} className="flex items-start justify-between gap-2">
                      <span>{item.message}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.fieldId) {
                            jumpToField(item.fieldId);
                          } else {
                            setInReviewScreen(false);
                            setActiveSection(item.sectionIndex);
                          }
                        }}
                        className="shrink-0 font-bold text-gold-dark hover:underline"
                      >
                        Fix
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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
            disabled={saving || !wizard.canPublish}
            className="pressable flex-1 h-12 rounded-full bg-navy text-xs font-black text-gold shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </div>
    );
  }

  const draftStatusLine =
    !listingId && draftStatus === "saving"
      ? "Saving on this device…"
      : !listingId && draftStatus === "saved"
        ? "Saved on this device only"
        : !listingId && draftStatus === "restored"
          ? "Restored draft from this device"
          : !listingId && draftStatus === "quota_exceeded"
            ? "Storage full — draft not saved"
            : !listingId && draftStatus === "storage_unavailable"
              ? "Could not save on this device"
              : !listingId && draftStatus === "conflict"
                ? "Another tab has newer changes"
                : null;

  function renderField(field: (typeof manifest.fields)[number]) {
    return (
      <FieldRenderer
        key={field.id}
        field={field}
        value={values[field.id]}
        options={resolved.optionsByField[field.id] ?? []}
        error={validationAttempted ? fieldErrors[field.id] : undefined}
        inferred={inferredFieldIds.has(field.id)}
        pendingSuggestions={pendingSuggestionsByField[field.id]}
        onChange={(v) => setField(field.id, v)}
      />
    );
  }

  return (
    <div className={cn("mx-auto max-w-xl space-y-5 pb-24", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-navy">{manifest.label}</p>
          <Link
            href="/agent/listings/choose"
            className="text-xs font-semibold text-gold-dark hover:underline"
          >
            Change category
          </Link>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-navy">{wizard.completionPercent}%</p>
          {draftStatusLine ? (
            <p className="max-w-[11rem] text-[10px] font-medium leading-snug text-navy/45">
              {draftStatusLine}
            </p>
          ) : null}
        </div>
      </div>

      {dependencyNotice ? (
        <div
          className="rounded-xl border border-navy/10 bg-navy/[0.04] px-4 py-2.5 text-xs text-navy/75"
          role="status"
        >
          {dependencyNotice}
        </div>
      ) : null}

      {draftConflictRemote && !listingId ? (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">Draft updated in another tab</p>
          <p className="mt-1 text-xs text-navy/70">
            Reload the saved draft to avoid overwriting newer work on this device.
          </p>
          <button
            type="button"
            onClick={reloadDraftFromDevice}
            className="pressable mt-3 h-9 rounded-full bg-navy px-4 text-xs font-bold text-gold"
          >
            Reload draft
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-navy/[0.08] bg-white px-3 py-3 shadow-xs">
        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full bg-navy/[0.06]"
          role="progressbar"
          aria-valuenow={wizard.completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${wizard.completionPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {wizard.stages.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveSection(index)}
              className={cn(
                "pressable inline-flex min-h-[34px] items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                activeSection === index
                  ? "bg-navy text-gold"
                  : stage.complete
                    ? "bg-emerald-500/15 text-navy"
                    : "bg-navy/[0.05] text-navy/65 hover:bg-navy/[0.08]",
              )}
            >
              {stage.complete ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-700" aria-hidden />
              ) : null}
              {stage.label}
            </button>
          ))}
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
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  wizard.stages[0]?.complete
                    ? "bg-gold/15 text-navy"
                    : "bg-navy/[0.06] text-navy/40",
                )}
              >
                {wizard.stages[0]?.complete ? "✓" : "1"}
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">{wizard.detailsTitle}</h3>
                <p className="text-[11px] font-medium text-navy/55">{detailsSummary}</p>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 shrink-0 text-navy/40" aria-hidden />
          </div>
        ) : (
          // Expanded Section 1 Form
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <h3 className="text-sm font-bold text-navy">{wizard.detailsTitle}</h3>
              <ChevronUp className="h-4 w-4 shrink-0 text-navy/40" aria-hidden />
            </div>

            <ListingSmartDescribe
              value={smartDescribeText}
              onChange={setSmartDescribeText}
              categoryLabel={manifest.label}
            />

            <div className="space-y-4">
              {detailsStepIds.map((stepId) => {
                const fields = resolved.stepFields[stepId] ?? [];
                if (fields.length === 0) return null;
                const stepTitle = manifest.steps.find((s) => s.id === stepId)?.title;
                return (
                  <div key={stepId} className="space-y-3">
                    {detailsStepIds.length > 1 && stepTitle ? (
                      <p className="text-xs font-bold text-navy/70">{stepTitle}</p>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fields.map((field) => renderField(field))}
                    </div>
                  </div>
                );
              })}
            </div>
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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/[0.06] text-navy">
                <Camera className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">Photos & price</h3>
                <p className="text-[11px] font-medium text-navy/55">
                  {photoCount > 0 ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "Add photos"}
                  {previewPrice ? ` · ${previewPrice}` : ""}
                </p>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 shrink-0 text-navy/40" aria-hidden />
          </div>
        ) : (
          // Expanded Section 2 Form
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy">Photos & price</h3>
                <p className="text-[11px] text-navy/50">
                  {resolved.photoStatus.min}–{resolved.photoStatus.max} photos
                </p>
              </div>
              <span className="text-xs font-semibold text-navy/45">
                {photoCount}/{resolved.photoStatus.max}
              </span>
            </div>

            <ListingPhotoManager
              items={photos}
              onChange={setPhotos}
              photoSchema={activePhotoSchema}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {(resolved.stepFields.pricing ?? []).map((field) => renderField(field))}
            </div>
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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/[0.06] text-navy">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-navy">Location & review</h3>
                <p className="text-[11px] font-medium text-navy/55">{previewLoc}</p>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 shrink-0 text-navy/40" aria-hidden />
          </div>
        ) : (
          // Expanded Section 3 Form (NO MAPS)
          <div className="p-5 space-y-4">
            <div className="border-b border-navy/10 pb-3">
              <h3 className="text-sm font-bold text-navy">Location</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(resolved.stepFields.location ?? []).map((field) => renderField(field))}
            </div>

            <button
              type="button"
              onClick={handleOpenReview}
              className="pressable flex w-full min-h-[44px] items-center justify-center rounded-xl border border-navy/15 bg-white text-sm font-semibold text-navy hover:bg-surface"
            >
              Preview review
            </button>
          </div>
        )}
      </div>

      {/* 6. FOOTER ACTIONS BAR */}
      <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-navy/10 bg-white/95 p-2.5 shadow-2xl backdrop-blur-md">
          <p className="mb-1.5 text-center text-[11px] font-semibold text-navy/55">
            {nextAction.message}
          </p>
          <button
            type="button"
            onClick={performPrimaryAction}
            disabled={saving}
            className="pressable flex h-11 w-full items-center justify-center rounded-xl bg-navy text-sm font-bold text-gold shadow-md disabled:opacity-60"
          >
            {nextAction.primaryLabel}
          </button>
        </div>
      </div>

    </div>
  );
}
