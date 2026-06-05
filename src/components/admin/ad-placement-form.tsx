"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AD_PLACEMENT_META } from "@/constants/adPlacements";
import type { AdPlacement } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";

export function AdPlacementForm({ placement }: { placement: AdPlacement }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const meta = AD_PLACEMENT_META[
    placement.placement_key as keyof typeof AD_PLACEMENT_META
  ];

  const isHotspot = placement.placement_key.startsWith("home_hotspot_");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured()) {
      setError("Supabase is not connected.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const imageUrl = (form.get("image_url") as string).trim();
    const propertyId = ((form.get("property_id") as string) || "").trim() || null;
    const isActive = form.get("is_active") === "on";

    if (isActive && !isHotspot && !imageUrl) {
      setError("Add an image URL before activating this ad slot.");
      return;
    }

    if (isActive && isHotspot && !propertyId && !imageUrl) {
      setError("Add a listing ID or image URL for this hotspot slot.");
      return;
    }

    const startsRaw = (form.get("starts_at") as string) || "";
    const endsRaw = (form.get("ends_at") as string) || "";

    const payload = {
      title: ((form.get("title") as string) || "").trim() || null,
      image_url: imageUrl || null,
      link_url: ((form.get("link_url") as string) || "").trim() || null,
      alt_text: ((form.get("alt_text") as string) || "").trim(),
      property_id: propertyId,
      is_active: isActive,
      starts_at: startsRaw ? new Date(startsRaw).toISOString() : null,
      ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
    };

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("ad_placements")
      .update(payload)
      .eq("id", placement.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  const previewUrl = placement.image_url?.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {placement.placement_key}
          </p>
          <h2 className="mt-1 text-lg font-bold text-navy">{placement.label}</h2>
          {meta && (
            <p className="mt-1 max-w-xl text-sm text-muted">{meta.hint}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            placement.is_active && previewUrl
              ? "bg-emerald-500/15 text-emerald-800"
              : "bg-surface text-muted"
          }`}
        >
          {placement.is_active && previewUrl ? "Live on site" : "Inactive"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <FormSection title="Creative">
            <Input
              name="title"
              placeholder="Headline (optional)"
              defaultValue={placement.title ?? ""}
            />
            <Input
              name="image_url"
              placeholder="Image URL (https://…)"
              defaultValue={placement.image_url ?? ""}
              required={false}
            />
            <Input
              name="link_url"
              placeholder="Click-through URL (optional)"
              defaultValue={placement.link_url ?? ""}
            />
            {isHotspot && (
              <Input
                name="property_id"
                placeholder="Listing UUID (pins a property to this slot)"
                defaultValue={placement.property_id ?? ""}
              />
            )}
            <Textarea
              name="alt_text"
              placeholder="Alt text for accessibility"
              rows={2}
              defaultValue={placement.alt_text ?? ""}
            />
          </FormSection>

          <FormSection title="Schedule (optional)">
            <label className="block text-xs font-semibold text-muted">
              Start (ISO datetime-local)
              <Input
                name="starts_at"
                type="datetime-local"
                className="mt-1"
                defaultValue={
                  placement.starts_at
                    ? placement.starts_at.slice(0, 16)
                    : ""
                }
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              End
              <Input
                name="ends_at"
                type="datetime-local"
                className="mt-1"
                defaultValue={
                  placement.ends_at ? placement.ends_at.slice(0, 16) : ""
                }
              />
            </label>
          </FormSection>

          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={placement.is_active}
              className="h-4 w-4 rounded border-surface accent-gold"
            />
            Show on website
            {isHotspot ? " (listing ID or image)" : " (requires image URL)"}
          </label>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save ad slot"}
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Preview
          </p>
          <div className="rounded-xl border border-dashed border-surface bg-surface/50 p-3">
            {previewUrl ? (
              <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                <Image
                  src={previewUrl}
                  alt={placement.alt_text || "Ad preview"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted">
                Add an image URL to preview
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
