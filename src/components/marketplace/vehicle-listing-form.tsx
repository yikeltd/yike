"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  VEHICLE_CATEGORIES,
  specsForCategory,
  type VehicleCategoryId,
} from "@/lib/marketplace/vehicle-specs";
import { ListingPhotoManager } from "@/components/agent/listing-photo-manager";
import type { ListingPhotoItem } from "@/components/agent/listing-photo-types";
import {
  clearVehicleDraft,
  loadVehicleDraft,
  saveVehicleDraft,
} from "@/lib/marketplace/vehicle-draft";

type Props = {
  listingId?: string;
  agentId?: string;
  initial?: Record<string, unknown>;
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

export function VehicleListingForm({ listingId, agentId, initial }: Props) {
  const router = useRouter();
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = useMemo(() => specsForCategory(category), [category]);

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

  function onFieldChange(name: string, value: string) {
    setFormSnapshot((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const media_urls = photos
      .filter((p) => p.upload_status !== "uploading" && p.upload_status !== "error")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => p.image_url || p.webp_url || p.thumbnail_url)
      .filter(Boolean) as string[];

    if (media_urls.length < 1) {
      setSaving(false);
      setError("Add at least one photo before submitting.");
      return;
    }

    const body: Record<string, unknown> = {
      id: listingId,
      auto_category: category,
      title: fd.get("title"),
      description: fd.get("description"),
      price: Number(fd.get("price")),
      state: fd.get("state"),
      city: fd.get("city"),
      area: fd.get("area"),
      media_urls,
    };
    for (const field of fields) {
      const raw = fd.get(field.key);
      if (field.type === "boolean") {
        if (field.column === "financing_available" || field.key === "financing_available") {
          body.financing_available = fd.get("financing_available") === "on";
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

  const defaults = { ...formSnapshot, ...Object.fromEntries(
    Object.entries(initial ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)]),
  ) };

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Category</label>
        <select
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value as VehicleCategoryId)}
        >
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Title</label>
        <input
          name="title"
          required
          defaultValue={defaults.title ?? ""}
          onChange={(e) => onFieldChange("title", e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2"
          placeholder="2019 Toyota Camry XLE"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults.description ?? ""}
          onChange={(e) => onFieldChange("description", e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Price (₦)</label>
          <input
            name="price"
            type="number"
            required
            min={1}
            defaultValue={defaults.price ?? ""}
            onChange={(e) => onFieldChange("price", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">State</label>
          <input
            name="state"
            required
            defaultValue={defaults.state ?? ""}
            onChange={(e) => onFieldChange("state", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">City</label>
          <input
            name="city"
            required
            defaultValue={defaults.city ?? ""}
            onChange={(e) => onFieldChange("city", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Area</label>
          <input
            name="area"
            defaultValue={defaults.area ?? ""}
            onChange={(e) => onFieldChange("area", e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const name = field.key;
          const defaultVal =
            defaults[field.column ?? field.key] ??
            defaults[field.key] ??
            "";
          if (field.type === "boolean") {
            return (
              <label key={field.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={field.key}
                  defaultChecked={defaultVal === "true" || defaultVal === "on"}
                />
                {field.label}
              </label>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-navy">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <select
                  name={name}
                  required={field.required}
                  defaultValue={String(defaultVal || "")}
                  onChange={(e) => onFieldChange(name, e.target.value)}
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
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-navy">
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <input
                name={name}
                type={field.type === "number" || field.type === "year" ? "number" : "text"}
                required={field.required}
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                defaultValue={defaultVal != null ? String(defaultVal) : ""}
                onChange={(e) => onFieldChange(name, e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-navy">Photos</p>
        <ListingPhotoManager
          propertyId={listingId}
          items={photos}
          onChange={setPhotos}
          listingType="sale"
        />
        <p className="mt-1 text-xs text-black/50">
          Clear photos build trust. Blurry or stock images may be rejected in
          moderation.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-gold px-4 py-3 font-semibold text-navy disabled:opacity-60"
      >
        {saving ? "Saving…" : listingId ? "Update vehicle" : "Submit for review"}
      </button>
    </form>
  );
}
