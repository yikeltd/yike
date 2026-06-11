"use client";

import { useCallback, useEffect, useState } from "react";
import type { Advertisement } from "@/types/database";
import {
  ADVERTISEMENT_PLACEMENTS,
  ADVERTISER_TYPE_LABELS,
  ADVERTISER_TYPES,
  PROHIBITED_AD_CATEGORIES,
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

export function AdvertisementsBoard() {
  const [tab, setTab] = useState("draft");
  const [ads, setAds] = useState<AdRow[]>([]);
  const [tabs, setTabs] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [advertiserName, setAdvertiserName] = useState("");
  const [advertiserType, setAdvertiserType] = useState("developer");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [placement, setPlacement] = useState("homepage_top");
  const [durationPlan, setDurationPlan] = useState("week");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const catalog = useRevenueCatalog();

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

  async function uploadImage(file: File, mobile = false) {
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
    if (mobile) setMobileImageUrl(data.publicUrl ?? "");
    else setImageUrl(data.publicUrl ?? "");
  }

  async function createAd() {
    setBusyId("create");
    setError(null);
    const res = await fetch("/api/admin/advertisements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        advertiserName,
        advertiserType,
        destinationUrl,
        placement,
        durationPlan,
        imageUrl,
        mobileImageUrl: mobileImageUrl || undefined,
      }),
    });
    setBusyId(null);
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create ad");
      return;
    }
    setShowForm(false);
    setTitle("");
    setAdvertiserName("");
    setDestinationUrl("");
    setImageUrl("");
    setMobileImageUrl("");
    void load();
  }

  async function runAction(id: string, action: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/advertisements/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { authorizationUrl?: string; error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
      return;
    }
    void load();
  }

  const previewPrice = adPrice(
    placement as AdvertisementPlacement,
    durationPlan as AdvertisementDurationPlan
  );
  const sponsoredSpecs =
    SPONSORED_AD_CREATIVE_SPECS[placement as AdvertisementPlacement];

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
          {showForm ? "Close form" : "Create ad"}
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <h2 className="font-bold text-navy">New sponsored placement</h2>
          <p className="text-xs text-muted">
            Prohibited: {PROHIBITED_AD_CATEGORIES.join(", ").replace(/_/g, " ")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-navy">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Advertiser name</span>
              <input
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Advertiser type</span>
              <select
                value={advertiserType}
                onChange={(e) => setAdvertiserType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {ADVERTISER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ADVERTISER_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Destination URL</span>
              <input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="https://"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Placement</span>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {Object.entries(ADVERTISEMENT_PLACEMENTS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Duration</span>
              <select
                value={durationPlan}
                onChange={(e) => setDurationPlan(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                <option value="week">1 week</option>
                <option value="month">1 month</option>
              </select>
            </label>
          </div>
          <p className="text-sm font-semibold text-navy">
            Price: {formatPrice(previewPrice, "total", "rent")}
          </p>
          {sponsoredSpecs ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
                  Desktop image
                </p>
                <AdminCreativeSizeCallout spec={sponsoredSpecs.desktop} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
                  Mobile image (optional)
                </p>
                <AdminCreativeSizeCallout spec={sponsoredSpecs.mobile} />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-navy">
              {imageUrl ? "Desktop image uploaded" : "Upload desktop image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f, false);
                }}
              />
            </label>
            <label className="cursor-pointer rounded-xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-navy">
              {mobileImageUrl ? "Mobile image uploaded" : "Upload mobile image (optional)"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f, true);
                }}
              />
            </label>
          </div>
          {uploading ? <p className="text-xs text-muted">Uploading…</p> : null}
          <button
            type="button"
            disabled={busyId === "create" || !imageUrl}
            onClick={() => void createAd()}
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Save as draft
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
                <div>
                  <p className="font-semibold text-navy">{ad.title}</p>
                  <p className="text-xs text-muted">
                    {ad.advertiser_name} · {ADVERTISEMENT_PLACEMENTS[ad.placement].label} ·{" "}
                    {formatPrice(Number(ad.amount), "total", "rent")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {ad.metrics?.impressions ?? 0} impressions · {ad.metrics?.clicks ?? 0} clicks ·{" "}
                    {ad.metrics?.ctr ?? 0}% CTR
                  </p>
                  {ad.expires_at ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Expires {new Date(ad.expires_at).toLocaleDateString("en-NG")}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold capitalize text-navy">
                  {ad.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ad.status === "draft" ? (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "submit_pending")}
                    className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-navy"
                  >
                    Mark pending
                  </button>
                ) : null}
                {["draft", "pending"].includes(ad.status) ? (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "checkout")}
                    className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
                  >
                    Pay & activate
                  </button>
                ) : null}
                {ad.status === "active" ? (
                  <button
                    type="button"
                    disabled={busyId === ad.id}
                    onClick={() => void runAction(ad.id, "pause")}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Pause
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
