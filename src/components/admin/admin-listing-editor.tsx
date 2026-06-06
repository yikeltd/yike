"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Property, PropertyMediaItem, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { propertyPath } from "@/lib/property-url";
import { formatPrice } from "@/lib/utils";
import { normalizePropertyMedia } from "@/lib/media/items";
import { ListingActions } from "@/components/admin/listing-actions";

type ListingRow = Property & { agent?: Profile | null };

export function AdminListingEditor({ listing }: { listing: ListingRow }) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description ?? "",
    price: String(listing.price),
    listing_type: listing.listing_type,
    property_type: listing.property_type ?? "",
    bedrooms: String(listing.bedrooms),
    bathrooms: String(listing.bathrooms),
    state: listing.state,
    city: listing.city,
    area: listing.area,
    slug: listing.slug ?? "",
    slug_locked: listing.slug_locked,
    seo_title: listing.seo_title ?? "",
    seo_description: listing.seo_description ?? "",
    status: listing.status,
    is_featured: listing.is_featured,
    is_verified_listing: listing.is_verified_listing,
    agent_id: listing.agent_id,
  });
  const [mediaItems, setMediaItems] = useState<PropertyMediaItem[]>(
    normalizePropertyMedia(listing)
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function saveListing(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        price: Number(form.price),
        listing_type: form.listing_type,
        property_type: form.property_type || null,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        state: form.state,
        city: form.city,
        area: form.area,
        slug: form.slug,
        slug_locked: form.slug_locked,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        status: form.status,
        is_featured: form.is_featured,
        is_verified_listing: form.is_verified_listing,
        agent_id: form.agent_id,
        ...extra,
      }),
    });
    const data = (await res.json()) as { error?: string; listing?: Property };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }
    if (data.listing?.slug) setForm((f) => ({ ...f, slug: data.listing!.slug! }));
    setMessage("Saved");
    router.refresh();
  }

  async function saveMedia() {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listing.id}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_items: mediaItems, action: "reorder" }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Photo save failed");
      return;
    }
    setMessage("Photos saved");
    router.refresh();
  }

  function movePhoto(index: number, dir: -1 | 1) {
    const next = [...mediaItems];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMediaItems(
      next.map((item, i) => ({ ...item, sort_order: i, is_cover: i === 0 }))
    );
  }

  function deletePhoto(id: string) {
    requirePin(async () => {
      const next = mediaItems.filter((m) => m.id !== id);
      setMediaItems(
        next.map((item, i) => ({ ...item, sort_order: i, is_cover: i === 0 }))
      );
      setBusy(true);
      await fetch(`/api/admin/listings/${listing.id}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_items: next,
          action: "delete",
          deleted_ids: [id],
        }),
      });
      setBusy(false);
      setMessage("Photo removed");
      router.refresh();
    });
  }

  const previewPath = propertyPath({ ...listing, slug: form.slug || listing.slug });

  return (
    <div className="space-y-8 pb-12">
      {pinModal}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Listing editor
          </p>
          <h1 className="text-xl font-bold text-navy lg:text-2xl">{listing.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatPrice(Number(listing.price), listing.payment_period, listing.listing_type)}{" "}
            · {listing.area}, {listing.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={previewPath}
            target="_blank"
            className="pressable rounded-xl border border-navy/15 px-4 py-2 text-xs font-bold text-navy"
          >
            Preview public page
          </Link>
          <Link
            href="/lex/auth/listings"
            className="pressable rounded-xl bg-surface px-4 py-2 text-xs font-bold text-muted"
          >
            ← Back to list
          </Link>
        </div>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-navy">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-navy">Title</span>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-navy">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Price (NGN)</span>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Property["status"] })}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
            >
              {["pending", "approved", "rejected", "hidden", "rented", "archived"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Type</span>
            <Input
              value={form.property_type}
              onChange={(e) => setForm({ ...form, property_type: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Listing type</span>
            <select
              value={form.listing_type}
              onChange={(e) =>
                setForm({ ...form, listing_type: e.target.value as Property["listing_type"] })
              }
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
            >
              {["rent", "lease", "sale", "shortlet"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Bedrooms</span>
            <Input
              type="number"
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">Bathrooms</span>
            <Input
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">State</span>
            <Input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-navy">City</span>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-navy">Area / neighborhood</span>
            <Input
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-navy">Agent ID (reassign)</span>
            <Input
              value={form.agent_id}
              onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
              className="mt-1 font-mono text-xs"
            />
            {listing.agent?.full_name && (
              <span className="mt-1 block text-xs text-muted">
                Current: {listing.agent.full_name}
              </span>
            )}
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_verified_listing}
              onChange={(e) =>
                setForm({ ...form, is_verified_listing: e.target.checked })
              }
            />
            Verified listing
          </label>
        </div>

        <Button
          disabled={busy}
          onClick={() => requirePin(() => saveListing())}
          fullWidth
        >
          {busy ? "Saving…" : "Save listing (PIN required)"}
        </Button>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-navy">SEO slug</h2>
        <label className="block text-sm">
          <span className="font-semibold text-navy">Public slug</span>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-1 font-mono text-xs"
            disabled={form.slug_locked}
          />
          <span className="mt-1 block text-xs text-muted">
            /properties/{form.slug || "…"}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.slug_locked}
            onChange={(e) => setForm({ ...form, slug_locked: e.target.checked })}
          />
          Lock slug (prevent auto-regenerate)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={busy || form.slug_locked}
            onClick={() =>
              requirePin(() => saveListing({ regenerate_slug: true }))
            }
          >
            Regenerate slug
          </Button>
        </div>
        <label className="block text-sm">
          <span className="font-semibold text-navy">SEO title</span>
          <Input
            value={form.seo_title}
            onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-navy">SEO description</span>
          <textarea
            value={form.seo_description}
            onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-navy">Photos ({mediaItems.length})</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mediaItems.map((item, index) => {
            const url = item.webp_url || item.image_url || item.thumbnail_url;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-navy/10 p-3 space-y-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface">
                  {url && (
                    <Image
                      src={url}
                      alt={item.alt_text ?? ""}
                      fill
                      className="object-cover"
                      sizes="200px"
                      unoptimized={url.startsWith("http")}
                    />
                  )}
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
                      Cover
                    </span>
                  )}
                </div>
                <Input
                  value={item.room_label ?? ""}
                  placeholder="Room label"
                  onChange={(e) => {
                    const next = [...mediaItems];
                    next[index] = { ...item, room_label: e.target.value };
                    setMediaItems(next);
                  }}
                  className="text-xs"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => movePhoto(index, -1)}
                    className="flex-1 rounded-lg bg-surface py-1 text-xs font-bold"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === mediaItems.length - 1}
                    onClick={() => movePhoto(index, 1)}
                    className="flex-1 rounded-lg bg-surface py-1 text-xs font-bold"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePhoto(item.id)}
                    className="flex-1 rounded-lg bg-red-50 py-1 text-xs font-bold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <Button disabled={busy} onClick={() => requirePin(() => saveMedia())}>
          Save photo order (PIN required)
        </Button>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-navy">Quick moderation</h2>
        <ListingActions
          propertyId={listing.id}
          agentVerified={!!listing.agent?.verification_status}
        />
      </section>
    </div>
  );
}
