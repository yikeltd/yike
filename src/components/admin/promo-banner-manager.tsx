"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BANNER_PLACEMENTS, DEFAULT_VERIFICATION_BANNER } from "@/constants/siteBanners";
import type { SiteBanner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function PromoBannerManager({ banners }: { banners: SiteBanner[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [placement, setPlacement] = useState("homepage_inline");
  const [title, setTitle] = useState<string>(DEFAULT_VERIFICATION_BANNER.title);
  const [subtitle, setSubtitle] = useState<string>(DEFAULT_VERIFICATION_BANNER.subtitle);
  const [ctaText, setCtaText] = useState<string>(DEFAULT_VERIFICATION_BANNER.ctaText);
  const [linkUrl, setLinkUrl] = useState<string>(DEFAULT_VERIFICATION_BANNER.linkUrl);
  const [priority, setPriority] = useState("10");
  const [isActive, setIsActive] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function resetForm() {
    setEditingId(null);
    setPlacement("homepage_inline");
    setTitle(DEFAULT_VERIFICATION_BANNER.title);
    setSubtitle(DEFAULT_VERIFICATION_BANNER.subtitle);
    setCtaText(DEFAULT_VERIFICATION_BANNER.ctaText);
    setLinkUrl(DEFAULT_VERIFICATION_BANNER.linkUrl);
    setPriority("10");
    setIsActive(false);
    setStartsAt("");
    setEndsAt("");
    setError("");
  }

  function loadForEdit(banner: SiteBanner) {
    setEditingId(banner.id);
    setPlacement(banner.placement);
    setTitle(banner.title ?? "");
    setSubtitle(banner.subtitle ?? banner.message ?? "");
    setCtaText(banner.cta_text ?? DEFAULT_VERIFICATION_BANNER.ctaText);
    setLinkUrl(banner.link_url ?? DEFAULT_VERIFICATION_BANNER.linkUrl);
    setPriority(String(banner.priority));
    setIsActive(banner.is_active);
    setStartsAt(toLocalDatetime(banner.starts_at));
    setEndsAt(toLocalDatetime(banner.ends_at));
    setError("");
  }

  async function saveBanner() {
    setError("");
    if (!title.trim() && !subtitle.trim()) {
      setError("Add a title or subtitle.");
      return;
    }

    setBusy(editingId ?? "new");
    const supabase = createClient();
    const payload = {
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      message: subtitle.trim(),
      cta_text: ctaText.trim() || DEFAULT_VERIFICATION_BANNER.ctaText,
      link_url: linkUrl.trim() || DEFAULT_VERIFICATION_BANNER.linkUrl,
      image_url: null,
      priority: Number(priority) || 0,
      is_active: isActive,
      placement,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };

    if (editingId) {
      const { error: updateError } = await supabase.from("site_banners").update(payload).eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
        setBusy(null);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("site_banners").insert(payload);
      if (insertError) {
        setError(insertError.message);
        setBusy(null);
        return;
      }
    }

    setBusy(null);
    resetForm();
    router.refresh();
  }

  async function toggleActive(banner: SiteBanner) {
    setBusy(banner.id);
    const supabase = createClient();
    await supabase.from("site_banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void saveBanner();
        }}
        className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
      >
        <h2 className="text-lg font-bold text-navy">{editingId ? "Edit promo" : "Create promo banner"}</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Placement</span>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {BANNER_PLACEMENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <Input placeholder="Headline" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="CTA text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea placeholder="Subtext" rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <Input
            placeholder="Destination URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="sm:col-span-2"
          />
          <Input type="number" placeholder="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} />
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={!!busy}>
            {busy ? "Saving…" : editingId ? "Update" : "Create"}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
            <div>
              <p className="font-bold text-navy">{banner.title ?? "Untitled"}</p>
              <p className="text-xs text-muted">
                {banner.placement} · priority {banner.priority} · {banner.is_active ? "active" : "inactive"}
              </p>
              <p className="mt-1 text-sm text-muted line-clamp-2">{banner.subtitle ?? banner.message}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={!!busy} onClick={() => toggleActive(banner)}>
                {banner.is_active ? "Off" : "On"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => loadForEdit(banner)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
