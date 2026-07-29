"use client";

import { useCallback, useEffect, useState } from "react";
import type { Advertisement } from "@/types/database";
import {
  ADVERTISEMENT_PLACEMENTS,
  HOMEPAGE_AD_SLOTS,
  PROHIBITED_AD_CATEGORIES,
  isHomepageAdSlot,
  type AdvertisementDurationPlan,
  type AdvertisementPlacement,
} from "@/lib/advertisements/constants";
import { SPONSORED_AD_CREATIVE_SPECS } from "@/constants/adminCreativeSpecs";
import { AdminCreativeSizeCallout } from "@/components/admin/admin-creative-size-callout";
import { useRevenueCatalog } from "@/hooks/use-revenue-catalog";
import { advertisementVariantKey } from "@/lib/revenue-pricing/keys";
import { getCatalogPrice } from "@/lib/revenue-pricing/catalog-utils";
import { DEFAULT_REVENUE_PRICING } from "@/lib/revenue-pricing/defaults";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AdRow = Advertisement & {
  metrics?: { impressions: number; clicks: number; ctr: number };
};

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function AdvertisementsBoard() {
  const [tab, setTab] = useState("active");
  const [ads, setAds] = useState<AdRow[]>([]);
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [placement, setPlacement] = useState<AdvertisementPlacement>("homepage_slot_1");
  const [durationPlan, setDurationPlan] = useState("month");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const catalog = useRevenueCatalog();

  const isHomepage = isHomepageAdSlot(placement);

  function adPrice(p: AdvertisementPlacement, plan: AdvertisementDurationPlan): number {
    const key = advertisementVariantKey(p, plan);
    return (
      getCatalogPrice(catalog, "advertisement", key) ??
      DEFAULT_REVENUE_PRICING.find((i) => i.product === "advertisement" && i.variant_key === key)
        ?.amount ??
      0
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/advertisements?status=${tab}`);
    const data = (await res.json()) as {
      advertisements?: AdRow[];
      tabs?: Array<{ id: string; label: string }>;
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load ads");
      return;
    }
    setAds(data.advertisements ?? []);
    setTabs(data.tabs ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadImage(file: File) {
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("preset", "banner");
    form.set("folder", "sponsored");
    const res = await fetch("/api/admin/advertisements/upload", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { publicUrl?: string; error?: string };
    setUploading(false);
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    setImageUrl(data.publicUrl ?? "");
  }

  async function createAd() {
    setBusyId("create");
    setError(null);
    const res = await fetch("/api/admin/advertisements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignName,
        title: campaignName,
        advertiserName: campaignName || "Yike",
        destinationUrl,
        clickUrl: destinationUrl,
        placement,
        durationPlan: isHomepage ? "month" : durationPlan,
        imageUrl,
        bannerImageUrl: imageUrl,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        enabled: isHomepage ? enabled : false,
        adminManaged: isHomepage,
      }),
    });
    setBusyId(null);
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create ad");
      return;
    }
    setShowForm(false);
    setCampaignName("");
    setDestinationUrl("");
    setImageUrl("");
    setStartsAt("");
    setEndsAt("");
    setEnabled(true);
    void load();
  }

  async function runAction(
    id: string,
    action: string,
    extra?: Record<string, unknown>,
  ) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/advertisements/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = (await res.json()) as { authorizationUrl?: string; error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    if (data.authorizationUrl) {
      window.location.assign(data.authorizationUrl);
      return;
    }
    void load();
  }

  const previewPrice = adPrice(
    placement,
    (isHomepage ? "month" : durationPlan) as AdvertisementDurationPlan,
  );
  const sponsoredSpecs = SPONSORED_AD_CREATIVE_SPECS[placement];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                tab === t.id ? "bg-navy text-white" : "bg-surface text-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy"
        >
          {showForm ? "Close form" : "New campaign"}
        </button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="font-bold text-navy">Advertisement Manager</h2>
          <p className="text-xs text-muted">
            Homepage slots render only when enabled and within dates. Empty slots
            collapse — no placeholders. Prohibited:{" "}
            {PROHIBITED_AD_CATEGORIES.join(", ").replace(/_/g, " ")}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-navy">Campaign name</span>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="Summer property push"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Placement</span>
              <select
                value={placement}
                onChange={(e) =>
                  setPlacement(e.target.value as AdvertisementPlacement)
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {HOMEPAGE_AD_SLOTS.map((key) => (
                  <option key={key} value={key}>
                    {ADVERTISEMENT_PLACEMENTS[key].label}
                  </option>
                ))}
                <option value="search_results">
                  {ADVERTISEMENT_PLACEMENTS.search_results.label}
                </option>
                <option value="homepage_top">
                  {ADVERTISEMENT_PLACEMENTS.homepage_top.label}
                </option>
                <option value="homepage_middle">
                  {ADVERTISEMENT_PLACEMENTS.homepage_middle.label}
                </option>
              </select>
              <span className="mt-1 block text-[11px] text-muted">
                {ADVERTISEMENT_PLACEMENTS[placement]?.hint}
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Click URL</span>
              <input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="https://… or /search"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Start date</span>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">End date</span>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            {isHomepage ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="font-medium text-navy">Enabled (go live now)</span>
              </label>
            ) : (
              <label className="block text-sm">
                <span className="font-medium text-navy">Duration (paid)</span>
                <select
                  value={durationPlan}
                  onChange={(e) => setDurationPlan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                >
                  <option value="week">1 week</option>
                  <option value="month">1 month</option>
                </select>
              </label>
            )}
          </div>
          {!isHomepage ? (
            <p className="text-sm font-semibold text-navy">
              Price: {formatPrice(previewPrice, "total", "rent")}
            </p>
          ) : null}
          {sponsoredSpecs ? (
            <AdminCreativeSizeCallout spec={sponsoredSpecs.desktop} />
          ) : null}
          <label className="block cursor-pointer rounded-xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-navy">
            {imageUrl ? "Banner image uploaded ✓" : "Upload banner image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f).catch((err) => {
                  setError(err instanceof Error ? err.message : "Upload failed");
                });
              }}
            />
          </label>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Banner preview"
              className="max-h-28 rounded-lg object-cover"
              loading="lazy"
            />
          ) : null}
          {uploading ? <p className="text-xs text-muted">Optimizing upload…</p> : null}
          <button
            type="button"
            disabled={busyId === "create" || !imageUrl || !campaignName.trim()}
            onClick={() => void createAd()}
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {isHomepage && enabled ? "Publish campaign" : "Save campaign"}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted">No ads in this tab.</p>
      ) : (
        <ul className="space-y-3">
          {ads.map((ad) => (
            <li key={ad.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{ad.title}</p>
                  <p className="text-xs text-muted">
                    {ADVERTISEMENT_PLACEMENTS[ad.placement]?.label ?? ad.placement}
                    {ad.destination_url ? ` · ${ad.destination_url}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {ad.metrics?.impressions ?? 0} impressions · {ad.metrics?.clicks ?? 0}{" "}
                    clicks · {ad.metrics?.ctr ?? 0}% CTR
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {ad.starts_at
                      ? `Starts ${toDateInput(ad.starts_at)}`
                      : "No start date"}
                    {" · "}
                    {ad.expires_at
                      ? `Ends ${toDateInput(ad.expires_at)}`
                      : "No end date"}
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold capitalize text-navy">
                  {ad.status}
                </span>
              </div>
              {ad.image_url ? (
                <div className="mt-3 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.image_url}
                    alt=""
                    className="max-h-24 rounded-xl border border-border/50 object-cover shadow-xs"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {ad.status === "pending_approval" || ad.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === ad.id}
                      onClick={() => void runAction(ad.id, "approve")}
                      className="pressable rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === ad.id}
                      onClick={() => void runAction(ad.id, "reject")}
                      className="pressable rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {ad.status === "active" || ad.status === "live" ? (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "update_schedule", { enabled: false })}
                    className="pressable rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-amber-600"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "update_schedule", { enabled: true })}
                    className="pressable rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700"
                  >
                    Enable / Go Live
                  </button>
                )}

                <button
                  type="button"
                  disabled={busyId === ad.id}
                  onClick={() => void runAction(ad.id, "duplicate")}
                  className="pressable rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-navy hover:bg-slate-200"
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  disabled={busyId === ad.id}
                  onClick={() => void runAction(ad.id, "archive")}
                  className="pressable rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-navy/70 hover:bg-slate-200"
                >
                  Archive
                </button>

                <button
                  type="button"
                  disabled={busyId === ad.id}
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this ad campaign?")) return;
                    setBusyId(ad.id);
                    await fetch(`/api/admin/advertisements/${ad.id}`, { method: "DELETE" });
                    setBusyId(null);
                    void load();
                  }}
                  className="pressable rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100"
                >
                  Delete
                </button>

                {["draft", "pending"].includes(ad.status) &&
                !isHomepageAdSlot(ad.placement) ? (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "checkout")}
                    className="pressable rounded-xl bg-gold px-3.5 py-1.5 text-xs font-black text-navy shadow-xs hover:bg-gold-light"
                  >
                    Pay & Activate (Unified Engine)
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
