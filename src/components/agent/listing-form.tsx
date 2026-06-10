"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ListingPhotoManager,
  type ListingPhotoManagerHandle,
} from "./listing-photo-manager";
import {
  readyPhotoItems,
  stripListingPhotoForPersist,
  type ListingPhotoItem,
} from "./listing-photo-types";
import { ListingPropertyTypePicker } from "./listing-property-type-picker";
import { ListingLocationSearch } from "./listing-location-search";
import { ListingAmenitiesPicker } from "./listing-amenities-picker";
import { transparencyToExtras } from "./listing-transparency-fields";
import { ListingInlineFees } from "./listing-inline-fees";
import { MIN_LISTING_IMAGES, MAX_LISTING_IMAGES, PAYMENT_PERIODS } from "@/lib/constants";
import { computeExpiresAt } from "@/lib/listing-lifecycle";
import {
  defaultPaymentPeriodForListingType,
  propertyTypesForListingType,
  type ListingTypeValue,
} from "@/constants/listingTypes";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { NairaInput } from "@/components/ui/naira-input";
import { SubmitOverlay } from "@/components/ui/submit-overlay";
import { AdBanner } from "@/components/ads/ad-banner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  AdPlacement,
  FeeTransparencyMode,
  ListingExtras,
  Property,
} from "@/types/database";
import {
  dedupeMediaItems,
  mediaItemsToUrls,
  normalizePropertyMedia,
  sortMediaItemsForStory,
} from "@/lib/media/items";
import { LISTING_LIMIT_REACHED_MESSAGE } from "@/lib/account-control";
import { LISTING_SUBMITTED_MESSAGE } from "@/lib/copy/user-messages";
import { friendlyPublicError } from "@/lib/copy/public-errors";
import {
  BLOCKING_QUALITY_FLAGS,
  moderateListingDraft,
  qualityFlagLabel,
} from "@/lib/listing-quality";
import { PriceConfirmDialog } from "@/components/agent/price-confirm-dialog";
import { ValueDriverPicker } from "@/components/agent/value-driver-picker";
import { softenListingTitle } from "@/lib/title-normalize";
import type { PriceAnalysisResult } from "@/lib/pricing/types";
import {
  clearListingDraft,
  loadListingDraft,
  saveListingDraft,
  type ListingDraft,
} from "@/lib/listing-draft";
import {
  isLandProperty,
  showRoomFields,
} from "@/lib/listing-field-rules";
import { cn } from "@/lib/utils";
import { parseNairaAmount } from "@/lib/naira-input";
import {
  FetchTimeoutError,
  fetchWithTimeout,
  SUBMIT_TIMEOUT_MESSAGE,
  withTimeout,
} from "@/lib/fetch-timeout";
import {
  analyzeListingSpam,
  moderationFlagsFromSpam,
} from "@/lib/listing-spam-guard";
import {
  clearListingSubmitIdempotencyKey,
  clearPendingListingId,
  getListingSubmitIdempotencyKey,
  getPendingListingId,
  logListingSubmit,
  setPendingListingId,
} from "@/lib/listing-submit-log";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL_SUBMIT_TIMEOUT_MS = 45_000;
const DB_INSERT_TIMEOUT_MS = 10_000;
const SUBMIT_GUARD_TIMEOUT_MS = 5_000;
const PRICING_ANALYZE_TIMEOUT_MS = 3_000;

const STEPS = [
  { n: 1, title: "Listing type" },
  { n: 2, title: "Property details" },
  { n: 3, title: "Location" },
  { n: 4, title: "Photos & submit" },
] as const;

const PRIMARY_DEAL_OPTIONS = [
  { id: "rent", label: "Rent", listingType: "rent" as ListingTypeValue },
  { id: "buy", label: "Buy", listingType: "sale" as ListingTypeValue },
  {
    id: "land",
    label: "Land",
    listingType: "sale" as ListingTypeValue,
    propertyType: "land",
  },
  {
    id: "commercial",
    label: "Shop / Office",
    listingType: "rent" as ListingTypeValue,
    propertyType: "shop",
  },
] as const;

const MORE_DEAL_OPTIONS = [
  { id: "lease", label: "Lease", listingType: "lease" as ListingTypeValue },
  { id: "shortlet", label: "Shortlet", listingType: "shortlet" as ListingTypeValue },
] as const;

type ListingFormProps = {
  agentId: string;
  initial?: Property;
  initialValueDriverKeys?: string[];
  activeCount?: number;
  listingLimit?: number | null;
  listingFormAd?: AdPlacement | null;
};

async function syncValueDrivers(listingId: string, driverKeys: string[]) {
  await fetch(`/api/agent/listings/${listingId}/value-drivers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverKeys }),
  });
}

function extrasToTransparency(initial?: Property | null) {
  const e = initial?.extras;
  const values: Record<string, string> = {};
  const modes: Record<string, FeeTransparencyMode> = {};
  if (!e) return { values, modes };
  if (e.agency_fee_mode === "exact" && e.agency_fee != null) {
    values.agency_fee = String(e.agency_fee);
  } else if (e.agency_fee_percent != null) {
    values.agency_fee = `${e.agency_fee_percent}%`;
  }
  if (e.caution_fee_mode === "percent" && e.caution_fee_percent != null) {
    values.caution_fee = `${e.caution_fee_percent}%`;
  } else if (e.caution_deposit != null) values.caution_fee = String(e.caution_deposit);
  else if (e.caution_months != null) values.caution_fee = String(e.caution_months);
  if (e.agreement_fee != null) values.agreement_fee = String(e.agreement_fee);
  else if (e.agreement_fee_percent != null) values.agreement_fee = `${e.agreement_fee_percent}%`;
  if (e.service_charge != null) values.service_charge = String(e.service_charge);
  else if (e.service_charge_percent != null) values.service_charge = `${e.service_charge_percent}%`;
  if (e.legal_fee != null) values.legal_fee = String(e.legal_fee);
  else if (e.legal_fee_percent != null) values.legal_fee = `${e.legal_fee_percent}%`;
  if (e.cleaning_fee != null) values.cleaning_fee = String(e.cleaning_fee);
  if (e.caution_deposit != null) values.caution_deposit = String(e.caution_deposit);
  if (e.agency_fee_mode) modes.agency_fee = e.agency_fee_mode;
  if (e.caution_fee_mode) modes.caution_fee = e.caution_fee_mode;
  if (e.agreement_fee_mode) modes.agreement_fee = e.agreement_fee_mode;
  if (e.service_charge_mode) modes.service_charge = e.service_charge_mode;
  if (e.legal_fee_mode) modes.legal_fee = e.legal_fee_mode;
  if (e.cleaning_fee_mode) modes.cleaning_fee = e.cleaning_fee_mode;
  if (e.caution_deposit_mode) modes.caution_deposit = e.caution_deposit_mode;
  return { values, modes };
}

export function ListingForm({
  agentId,
  initial,
  initialValueDriverKeys = [],
  activeCount = 0,
  listingLimit = null,
  listingFormAd = null,
}: ListingFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const photoManagerRef = useRef<ListingPhotoManagerHandle>(null);
  const submitInFlightRef = useRef<Promise<void> | null>(null);
  const isEdit = Boolean(initial);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("Submitting…");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [draftPrompt, setDraftPrompt] = useState(false);

  const [listingType, setListingType] = useState<ListingTypeValue>(
    (initial?.listing_type as ListingTypeValue) ?? "rent"
  );
  const [propertyType, setPropertyType] = useState(
    initial?.property_type ??
      propertyTypesForListingType("rent")[0]?.value ??
      "flat"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "");
  const [paymentPeriod, setPaymentPeriod] = useState<string>(
    initial?.payment_period ?? defaultPaymentPeriodForListingType("rent")
  );
  const [bedrooms, setBedrooms] = useState(
    initial?.bedrooms != null && initial.bedrooms > 0 ? String(initial.bedrooms) : ""
  );
  const [bathrooms, setBathrooms] = useState(
    initial?.bathrooms != null && initial.bathrooms > 0 ? String(initial.bathrooms) : ""
  );
  const [toilets, setToilets] = useState(
    initial?.toilets != null && initial.toilets > 0 ? String(initial.toilets) : ""
  );

  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");

  const [mediaItems, setMediaItems] = useState<ListingPhotoItem[]>(() =>
    initial ? normalizePropertyMedia(initial) : []
  );
  const [amenities, setAmenities] = useState<string[]>(
    initial?.extras?.amenities ?? []
  );
  const [valueDriverKeys, setValueDriverKeys] = useState<string[]>(
    initialValueDriverKeys
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");

  const initTransparency = extrasToTransparency(initial);
  const [feeValues, setFeeValues] = useState(initTransparency.values);
  const [feeModes, setFeeModes] = useState(initTransparency.modes);

  const [moreDealsOpen, setMoreDealsOpen] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [priceDialog, setPriceDialog] = useState<{
    analysis: PriceAnalysisResult;
    price: number;
    paymentPeriod: string;
    payload: Record<string, unknown>;
    isEdit: boolean;
    propertyId?: string;
  } | null>(null);

  const listingPlan = initial?.listing_plan ?? "free";
  const showRooms = showRoomFields(propertyType, listingType);
  const land = isLandProperty(propertyType);

  useEffect(() => {
    if (isEdit) return;
    const draft = loadListingDraft(agentId);
    if (draft) setDraftPrompt(true);
  }, [agentId, isEdit]);

  useEffect(() => {
    setPropertyType((prev) => {
      const options = propertyTypesForListingType(listingType);
      if (options.some((o) => o.value === prev)) return prev;
      return options[0]?.value ?? prev;
    });
    setPaymentPeriod((prev) => {
      const def = defaultPaymentPeriodForListingType(listingType);
      return prev || def;
    });
  }, [listingType]);

  const buildDraft = useCallback((): ListingDraft => {
    return {
      version: 1,
      agentId,
      updatedAt: Date.now(),
      step,
      listingType,
      propertyType,
      title,
      price,
      paymentPeriod,
      bedrooms,
      bathrooms,
      toilets,
      state,
      city,
      area,
      landmark: "",
      addressHint: "",
      description,
      videoUrl,
      amenities,
      valueDriverKeys,
      mediaItems,
      transparency: feeValues,
      feeModes,
    };
  }, [
    agentId,
    step,
    listingType,
    propertyType,
    title,
    price,
    paymentPeriod,
    bedrooms,
    bathrooms,
    toilets,
    state,
    city,
    area,
    description,
    videoUrl,
    amenities,
    valueDriverKeys,
    mediaItems,
    feeValues,
    feeModes,
  ]);

  useEffect(() => {
    if (isEdit || draftPrompt) return;
    const t = window.setTimeout(() => saveListingDraft(buildDraft()), 1200);
    return () => window.clearTimeout(t);
  }, [buildDraft, isEdit, draftPrompt]);

  function applyDraft(draft: ListingDraft) {
    setStep(Math.min(4, draft.step));
    setListingType(draft.listingType);
    setPropertyType(draft.propertyType);
    setTitle(draft.title);
    setPrice(draft.price);
    setPaymentPeriod(draft.paymentPeriod);
    setBedrooms(draft.bedrooms);
    setBathrooms(draft.bathrooms);
    setToilets(draft.toilets);
    setState(draft.state);
    setCity(draft.city);
    setArea(draft.area);
    setDescription(draft.description);
    setVideoUrl(draft.videoUrl);
    setAmenities(draft.amenities);
    setValueDriverKeys(draft.valueDriverKeys);
    setMediaItems(draft.mediaItems);
    setFeeValues(draft.transparency);
    setFeeModes(draft.feeModes as Record<string, FeeTransparencyMode>);
    setDraftPrompt(false);
  }

  function applyDealOption(
    listingTypeValue: ListingTypeValue,
    nextPropertyType?: string,
    autoAdvance = false
  ) {
    setListingType(listingTypeValue);
    if (nextPropertyType) {
      setPropertyType(nextPropertyType);
    } else {
      const options = propertyTypesForListingType(listingTypeValue);
      setPropertyType(options[0]?.value ?? propertyType);
    }
    if (autoAdvance && step === 1) {
      setError("");
      setStep(2);
    }
  }

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!listingType) return "Choose what you are listing.";
    }
    if (n === 2) {
      if (!title.trim()) return "Add a short title for your listing.";
      if (!propertyType) return "Choose a property type.";
      const p = parseNairaAmount(price);
      if (!p) return "Enter a real price in ₦.";
    }
    if (n === 3) {
      if (!city.trim()) return "Pick a city or area from search.";
    }
    if (n === 4) {
      const ready = readyPhotoItems(mediaItems);
      const readyCount = mediaItemsToUrls(ready).length;
      const failedCount = mediaItems.filter((i) => i.upload_status === "error").length;
      if (mediaItems.some((i) => i.upload_status === "uploading")) {
        return "Wait for photos to finish uploading.";
      }
      if (readyCount > MAX_LISTING_IMAGES) {
        return "Maximum is 20 photos.";
      }
      if (readyCount < MIN_LISTING_IMAGES && failedCount > 0) {
        return "Minimum is 2 photos.";
      }
      if (readyCount < MIN_LISTING_IMAGES) {
        return "Minimum is 2 photos.";
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  function runBackgroundListingTasks(listingId: string, payload: Record<string, unknown>) {
    void syncValueDrivers(listingId, valueDriverKeys);
    void fetch("/api/notifications/email/listing-submitted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: listingId }),
    });
    void fetch("/api/agent/listings/duplicate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: listingId }),
    });
  }

  async function persistListing(
    payload: Record<string, unknown>,
    priceMeta?: {
      analysis: PriceAnalysisResult;
      confirmed: boolean;
    }
  ) {
    const startedAt = Date.now();
    setLoading(true);
    setSubmitMessage("Saving listing…");

    try {
      const supabase = createClient();
      const pricingFields = priceMeta
        ? {
            price_confidence_score: priceMeta.analysis.confidence_score,
            price_anomaly_level: priceMeta.analysis.anomaly_level,
            price_anomaly_reason: priceMeta.analysis.reason,
            market_price_snapshot: priceMeta.analysis.market_snapshot,
            price_review_status: priceMeta.confirmed
              ? "confirmed_by_agent"
              : priceMeta.analysis.price_review_status,
          }
        : {};

      if (initial) {
        const { error: updateError } = await withTimeout(
          Promise.resolve(
            supabase
              .from("properties")
              .update({ ...payload, ...pricingFields })
              .eq("id", initial.id)
          ),
          DB_INSERT_TIMEOUT_MS,
          "db_update"
        );
        if (updateError) {
          throw new Error(updateError.message);
        }
        void syncValueDrivers(initial.id, valueDriverKeys);
        if (priceMeta?.confirmed) {
          void fetch("/api/pricing/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propertyId: initial.id,
              price: payload.price,
              ...pricingFields,
            }),
          });
        }
        logListingSubmit({
          stage: "listing_submit_completed",
          userId: agentId,
          listingId: initial.id,
          photoCount: Array.isArray(payload.media_urls)
            ? payload.media_urls.length
            : undefined,
          durationMs: Date.now() - startedAt,
        });
        router.push("/agent/listings");
        return;
      }

      if (listingLimit !== null && activeCount >= listingLimit) {
        setError(LISTING_LIMIT_REACHED_MESSAGE);
        return;
      }

      const pendingId = getPendingListingId(agentId);
      let listingId = pendingId;

      if (pendingId) {
        setSubmitMessage("Almost done…");
        const { error: updateError } = await withTimeout(
          Promise.resolve(
            supabase
              .from("properties")
              .update({ ...payload, ...pricingFields })
              .eq("id", pendingId)
              .eq("agent_id", agentId)
          ),
          DB_INSERT_TIMEOUT_MS,
          "db_update"
        );
        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { data: created, error: insertError } = await withTimeout(
          Promise.resolve(
            supabase
              .from("properties")
              .insert({ ...payload, ...pricingFields })
              .select("id")
              .single()
          ),
          DB_INSERT_TIMEOUT_MS,
          "db_insert"
        );
        if (insertError) {
          if (
            insertError.message.toLowerCase().includes("jwt") ||
            insertError.message.toLowerCase().includes("session")
          ) {
            throw new Error("Your session expired. Please log in again.");
          }
          throw new Error(insertError.message);
        }
        listingId = created?.id ?? null;
        if (listingId) {
          setPendingListingId(agentId, listingId);
        }
      }

      if (!listingId) {
        throw new Error("Could not submit listing. Please try again.");
      }

      setSubmitMessage("Almost done…");
      logListingSubmit({
        stage: "listing_record_created",
        userId: agentId,
        listingId,
        photoCount: Array.isArray(payload.media_urls)
          ? payload.media_urls.length
          : undefined,
        durationMs: Date.now() - startedAt,
      });

      runBackgroundListingTasks(listingId, payload);

      if (priceMeta?.confirmed) {
        void fetch("/api/pricing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: listingId,
            price: payload.price,
            ...pricingFields,
          }),
        });
      }

      clearListingDraft();
      clearPendingListingId(agentId);
      clearListingSubmitIdempotencyKey(agentId);
      logListingSubmit({
        stage: "listing_submit_completed",
        userId: agentId,
        listingId,
        photoCount: Array.isArray(payload.media_urls)
          ? payload.media_urls.length
          : undefined,
        durationMs: Date.now() - startedAt,
      });
      setSuccess(true);
    } catch (e) {
      const isTimeout = e instanceof FetchTimeoutError;
      const message =
        isTimeout
          ? SUBMIT_TIMEOUT_MESSAGE
          : e instanceof Error
            ? e.message
            : "Could not submit listing. Please try again.";
      setError(
        message.includes("session expired")
          ? message
          : friendlyPublicError(message, "Could not submit listing. Please try again.")
      );
      logListingSubmit({
        stage: isTimeout ? "listing_submit_timeout" : "listing_submit_failed",
        userId: agentId,
        photoCount: Array.isArray(payload.media_urls)
          ? payload.media_urls.length
          : undefined,
        durationMs: Date.now() - startedAt,
        errorCode: isTimeout ? "timeout" : "persist_failed",
      });
    } finally {
      setLoading(false);
      setSubmitMessage("Submitting…");
    }
  }

  async function executeSubmit(e: React.FormEvent<HTMLFormElement>) {
    const startedAt = Date.now();
    let deferredToPriceDialog = false;
    setError("");
    setLoading(true);
    setSubmitMessage("Submitting…");
    logListingSubmit({
      stage: "listing_submit_started",
      userId: agentId,
      photoCount: mediaItems.length,
    });

    try {
      if (!isSupabaseConfigured()) {
        setError("Supabase is not connected. Add env vars to publish listings.");
        return;
      }

      for (let s = 1; s <= 4; s++) {
        const err = validateStep(s);
        if (err && s < 4) {
          setStep(s);
          setError(err);
          return;
        }
      }

      if (honeypot.trim()) {
        return;
      }

      setSubmitMessage("Uploading photos…");
      logListingSubmit({ stage: "photo_upload_started", userId: agentId, photoCount: mediaItems.length });
      const uploadWait = await photoManagerRef.current?.waitForUploads({
        timeoutMs: TOTAL_SUBMIT_TIMEOUT_MS,
        onProgress: (done, total) => {
          setSubmitMessage(`Uploading photos ${Math.min(done + 1, total)}/${total}…`);
        },
      });
      logListingSubmit({ stage: "photo_upload_completed", userId: agentId, photoCount: mediaItems.length });

      if (uploadWait && !uploadWait.ok) {
        setError(uploadWait.error ?? "Photo upload failed. Please remove the failed photo or retry.");
        return;
      }

      for (let s = 1; s <= 4; s++) {
        const err = validateStep(s);
        if (err) {
          setStep(s);
          setError(err);
          return;
        }
      }

      const spam = analyzeListingSpam({ title, description });
      if (spam.block) {
        setError(spam.reason ?? "Could not submit listing. Please try again.");
        return;
      }
      const spamModerationFlags = moderationFlagsFromSpam(spam.flags);

      setSubmitMessage("Submitting…");
      let guardModerationFlags: string[] = [];
      try {
        const guardRes = await fetchWithTimeout("/api/agent/listings/submit-guard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ honeypot, title, description }),
          timeoutMs: SUBMIT_GUARD_TIMEOUT_MS,
        });
        const guardData = (await guardRes.json().catch(() => ({}))) as {
          error?: string;
          moderationFlags?: string[];
        };
        if (!guardRes.ok) {
          if (guardRes.status === 401) {
            setError("Your session expired. Please log in again.");
            return;
          }
          setError(guardData.error || "Could not submit listing. Please try again.");
          return;
        }
        guardModerationFlags = guardData.moderationFlags ?? [];
        logListingSubmit({ stage: "profile_checked", userId: agentId });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError(SUBMIT_TIMEOUT_MESSAGE);
          logListingSubmit({
            stage: "listing_submit_timeout",
            userId: agentId,
            errorCode: "submit_guard_timeout",
            durationMs: Date.now() - startedAt,
          });
          return;
        }
      }

      const mergedModerationFlags = [
        ...new Set([...spamModerationFlags, ...guardModerationFlags]),
      ];

      const form = new FormData(e.currentTarget);
      const priceNum = parseNairaAmount(price) ?? 0;
      const persisted = readyPhotoItems(mediaItems).map(stripListingPhotoForPersist);
      const media_items = sortMediaItemsForStory(dedupeMediaItems(persisted));
      const media_urls = mediaItemsToUrls(media_items);

      const softened = softenListingTitle(title);
      const qualityFlags = moderateListingDraft({
        title: softened,
        description,
        price: priceNum,
        city,
        listing_type: listingType,
        media_urls,
      });
      const blocking = qualityFlags.filter((f) =>
        BLOCKING_QUALITY_FLAGS.includes(f)
      );
      if (blocking.length > 0) {
        setError(
          `Please fix before submitting: ${blocking.map(qualityFlagLabel).join(", ")}.`
        );
        return;
      }

      const transparencyExtras = transparencyToExtras(
        listingType,
        feeValues,
        feeModes
      );
      const extras: ListingExtras = {
        ...transparencyExtras,
        amenities: amenities.length > 0 ? amenities : undefined,
      };

      const payload = {
        agent_id: agentId,
        title: softened,
        description: description || null,
        listing_type: listingType,
        property_type: propertyType,
        bedrooms: land ? 0 : Number(bedrooms || 0),
        bathrooms: land ? 0 : Number(bathrooms || 0),
        toilets: land ? 0 : Number(toilets || 0),
        price: priceNum,
        payment_period: paymentPeriod,
        state,
        city,
        area,
        address_hint: (form.get("address_hint") as string) || null,
        landmark: (form.get("landmark") as string) || null,
        media_urls,
        media_items,
        video_url: videoUrl || null,
        extras,
        status: initial?.status === "approved" ? "approved" : "pending",
        moderation_flags:
          mergedModerationFlags.length > 0 ? mergedModerationFlags : undefined,
        listing_plan: listingPlan,
        ...(() => {
          const { expiresAt, durationDays } = computeExpiresAt(listingPlan);
          return {
            expires_at: expiresAt,
            listing_duration_days: durationDays,
            published_at: initial?.published_at ?? new Date().toISOString(),
          };
        })(),
      };

      void getListingSubmitIdempotencyKey(agentId);

      let priceMeta: { analysis: PriceAnalysisResult; confirmed: boolean } | undefined;
      try {
        const analyzeRes = await fetchWithTimeout("/api/pricing/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            city,
            area,
            property_type: propertyType,
            listing_type: listingType,
            price: priceNum,
            bedrooms: land ? 0 : Number(bedrooms || 0),
          }),
          timeoutMs: PRICING_ANALYZE_TIMEOUT_MS,
        });
        if (analyzeRes.ok) {
          const { analysis } = (await analyzeRes.json()) as {
            analysis: PriceAnalysisResult;
          };
          if (analysis.requires_agent_confirmation) {
            deferredToPriceDialog = true;
            setLoading(false);
            setPriceDialog({
              analysis,
              price: priceNum,
              paymentPeriod,
              payload,
              isEdit: Boolean(initial),
              propertyId: initial?.id,
            });
            return;
          }
          priceMeta = { analysis, confirmed: false };
        }
      } catch {
        /* price check is optional — never block submit */
      }

      await persistListing(payload, priceMeta);
    } catch {
      setError("Could not submit listing. Please try again.");
      logListingSubmit({
        stage: "listing_submit_failed",
        userId: agentId,
        errorCode: "unexpected",
        durationMs: Date.now() - startedAt,
      });
    } finally {
      if (!deferredToPriceDialog) {
        setLoading(false);
        setSubmitMessage("Submitting…");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitInFlightRef.current) {
      return submitInFlightRef.current;
    }
    const task = executeSubmit(e).finally(() => {
      submitInFlightRef.current = null;
    });
    submitInFlightRef.current = task;
    return task;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-elevated px-6 py-12 text-center shadow-float">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl text-navy">
          ✓
        </div>
        <p className="mt-4 text-lg font-bold text-navy">
          {LISTING_SUBMITTED_MESSAGE}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          We&apos;ll notify you once it goes live — usually within 24 hours.
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <Link
            href="/agent/listings"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-navy shadow-sm"
          >
            View my listings
          </Link>
          <Link
            href="/agent/listings/new"
            className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-navy hover:bg-surface"
          >
            Add another listing
          </Link>
        </div>
      </div>
    );
  }

  if (draftPrompt && !isEdit) {
    const draft = loadListingDraft(agentId);
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
        <p className="font-semibold text-navy">Continue your unfinished listing?</p>
        <p className="mt-1 text-xs text-muted">Your progress is saved automatically.</p>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={() => draft && applyDraft(draft)}
          >
            Continue draft
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              clearListingDraft();
              setDraftPrompt(false);
            }}
          >
            Delete draft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {priceDialog && (
        <PriceConfirmDialog
          analysis={priceDialog.analysis}
          price={priceDialog.price}
          paymentPeriod={priceDialog.paymentPeriod}
          busy={loading}
          onEdit={() => setPriceDialog(null)}
          onConfirm={() => {
            const pending = priceDialog;
            setPriceDialog(null);
            void persistListing(pending.payload, {
              analysis: pending.analysis,
              confirmed: true,
            });
          }}
        />
      )}
      <SubmitOverlay show={loading} message={submitMessage} />

      <div className="mb-3 flex items-center gap-1">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s.n <= step ? "bg-gold" : "bg-navy/10"
            )}
            aria-hidden
          />
        ))}
      </div>
      <p className="mb-2 text-xs font-semibold text-muted">
        Step {step} of 4 · {STEPS[step - 1].title}
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="listing-form-pad space-y-5">
        {step === 1 && (
          <section className="space-y-3">
            <p className="text-sm font-bold text-navy">What are you listing?</p>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_DEAL_OPTIONS.map((option) => {
                const presetType =
                  "propertyType" in option ? option.propertyType : undefined;
                const active =
                  listingType === option.listingType &&
                  (!presetType || propertyType === presetType);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      applyDealOption(option.listingType, presetType, true)
                    }
                    className={cn(
                      "pressable rounded-xl px-3 py-4 text-sm font-bold",
                      active
                        ? "bg-gold text-navy shadow-glow-gold"
                        : "bg-surface text-navy/75 ring-1 ring-navy/10"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setMoreDealsOpen((v) => !v)}
              className="text-xs font-bold text-gold-dark"
            >
              {moreDealsOpen ? "Fewer types" : "More types (lease, shortlet)"}
            </button>
            {moreDealsOpen ? (
              <div className="flex flex-wrap gap-2">
                {MORE_DEAL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyDealOption(option.listingType, undefined, true)}
                    className={cn(
                      "pressable rounded-full px-4 py-2 text-xs font-bold",
                      listingType === option.listingType
                        ? "bg-gold text-navy shadow-glow-gold"
                        : "bg-surface text-navy/70 ring-1 ring-navy/10"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2-bed flat in Ogbor Hill"
              required
            />
            {!land ? (
              <ListingPropertyTypePicker
                listingType={listingType}
                value={propertyType}
                onChange={setPropertyType}
              />
            ) : (
              <p className="text-xs text-muted">Land listing — add plot details below if helpful.</p>
            )}
            <NairaInput
              label="Price (₦)"
              value={price}
              onChange={setPrice}
              required
              placeholder="e.g. 1,500,000 or 1.5m"
            />
            {parseNairaAmount(price) ? (
              <ListingInlineFees
                listingType={listingType}
                values={feeValues}
                modes={feeModes}
                onValueChange={(k, v) => setFeeValues((prev) => ({ ...prev, [k]: v }))}
                onModeChange={(k, mode) =>
                  setFeeModes((prev) => ({ ...prev, [k]: mode }))
                }
              />
            ) : null}
            {showRooms ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Beds</FieldLabel>
                  <Input
                    value={bedrooms}
                    onChange={(e) =>
                      setBedrooms(e.target.value.replace(/\D/g, "").slice(0, 2))
                    }
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <FieldLabel>Baths/Toilet</FieldLabel>
                  <Input
                    value={bathrooms || toilets}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setBathrooms(next);
                      setToilets(next);
                    }}
                    inputMode="numeric"
                  />
                </div>
              </div>
            ) : null}
            <div>
              <FieldLabel>Payment period</FieldLabel>
              <Select
                value={paymentPeriod}
                onChange={(e) => setPaymentPeriod(e.target.value)}
              >
                {PAYMENT_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            {listingFormAd ? (
              <div className="pt-1">
                <AdBanner
                  ad={listingFormAd}
                  placementKey="agent_listing_form"
                  className="rounded-xl"
                />
              </div>
            ) : null}
          </section>
        )}

        {step === 3 && (
          <section>
            <ListingLocationSearch
              state={state}
              city={city}
              area={area}
              onStateChange={setState}
              onCityChange={setCity}
              onAreaChange={setArea}
              initialLandmark={initial?.landmark}
              initialAddressHint={initial?.address_hint}
            />
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <ListingPhotoManager
              ref={photoManagerRef}
              items={mediaItems}
              onChange={setMediaItems}
            />

            <details className="rounded-xl border border-navy/10 bg-surface/40">
              <summary className="cursor-pointer px-3 py-3 text-xs font-bold text-navy">
                Amenities (optional)
              </summary>
              <div className="border-t border-navy/8 px-3 pb-3 pt-2">
                <ListingAmenitiesPicker
                  listingType={listingType}
                  propertyType={propertyType}
                  selected={amenities}
                  onChange={setAmenities}
                />
              </div>
            </details>

            <details className="rounded-xl border border-navy/10 bg-surface/40">
              <summary className="cursor-pointer px-3 py-3 text-xs font-bold text-navy">
                Why this property stands out (optional)
              </summary>
              <div className="border-t border-navy/8 px-3 pb-3 pt-2">
                <ValueDriverPicker
                  selected={valueDriverKeys}
                  onChange={setValueDriverKeys}
                  disabled={loading}
                />
              </div>
            </details>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
            />
            <p className="text-xs text-muted">
              Tip: You can add rooms, location, price details, and nearby landmarks to get better
              responses.
            </p>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Video link (optional)"
            />

            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="listing-hp">Website</label>
              <input
                id="listing-hp"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </section>
        )}

        {step < 4 && error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="listing-form-action-bar fixed inset-x-0 z-40 border-t border-navy/10 bg-white/98 px-3 py-3 shadow-[0_-8px_24px_rgb(2_20_51_/10%)] backdrop-blur-md lg:z-30">
          <div className="mx-auto flex max-w-2xl gap-2">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={goBack} className="shrink-0">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div className="w-20 shrink-0" />
            )}
            {step < 4 ? (
              <Button type="button" fullWidth onClick={goNext}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading
                  ? submitMessage
                  : initial
                    ? "Save changes"
                    : "Submit listing"}
              </Button>
            )}
          </div>
          {step === 4 ? (
            <p className="mt-2 text-center text-[10px] text-muted">
              Submitted listings are reviewed before going live.
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}
