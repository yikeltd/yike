"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROMO_BANNER_PLACEMENT_SPECS } from "@/constants/adminCreativeSpecs";
import {
  BANNER_CAMPAIGN_LABELS,
  BANNER_PLACEMENTS,
  DEFAULT_PREMIUM_TRUST_BANNER,
  type SiteBannerPlacement,
} from "@/constants/siteBanners";
import {
  BANNER_CAMPAIGN_TYPES,
  CAMPAIGN_AUDIENCE_TAGS,
  type BannerCampaignType,
  parseAudienceTargeting,
} from "@/lib/verification/campaign-targeting";
import type { SiteBanner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function presetForCampaign(type: BannerCampaignType) {
  if (type === "verification_promo" || type === "premium_trust_assistance") {
    return DEFAULT_PREMIUM_TRUST_BANNER;
  }
  if (type === "legal_review_promo") {
    return {
      title: "Considering a major purchase?",
      subtitle: "Yike can help coordinate legal document review for selected transactions.",
      ctaText: "Learn more",
      linkUrl: "/legal-verification",
    };
  }
  if (type === "relocation_assistance") {
    return {
      title: "Relocating to a new city?",
      subtitle: "Yike may assist with property checks when you're searching from afar.",
      ctaText: "Learn more",
      linkUrl: "/property-verification",
    };
  }
  return {
    title: "",
    subtitle: "",
    ctaText: "Learn more",
    linkUrl: "/",
  };
}

export function PromoBannerManager({ banners }: { banners: SiteBanner[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [campaignType, setCampaignType] = useState<BannerCampaignType>(
    DEFAULT_PREMIUM_TRUST_BANNER.campaignType
  );
  const [placement, setPlacement] = useState("homepage_inline");
  const [title, setTitle] = useState<string>(DEFAULT_PREMIUM_TRUST_BANNER.title);
  const [subtitle, setSubtitle] = useState<string>(DEFAULT_PREMIUM_TRUST_BANNER.subtitle);
  const [ctaText, setCtaText] = useState<string>(DEFAULT_PREMIUM_TRUST_BANNER.ctaText);
  const [linkUrl, setLinkUrl] = useState<string>(DEFAULT_PREMIUM_TRUST_BANNER.linkUrl);
  const [audienceNotes, setAudienceNotes] = useState("");
  const [audienceTags, setAudienceTags] = useState<string[]>([]);
  const [priority, setPriority] = useState("10");
  const [isActive, setIsActive] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function resetForm() {
    setEditingId(null);
    setCampaignType(DEFAULT_PREMIUM_TRUST_BANNER.campaignType);
    setPlacement("mobile_header");
    setTitle(DEFAULT_PREMIUM_TRUST_BANNER.title);
    setSubtitle(DEFAULT_PREMIUM_TRUST_BANNER.subtitle);
    setCtaText(DEFAULT_PREMIUM_TRUST_BANNER.ctaText);
    setLinkUrl(DEFAULT_PREMIUM_TRUST_BANNER.linkUrl);
    setAudienceNotes("");
    setAudienceTags([]);
    setPriority("10");
    setIsActive(false);
    setStartsAt("");
    setEndsAt("");
    setError("");
  }

  function loadForEdit(banner: SiteBanner) {
    const targeting = parseAudienceTargeting(banner.audience_targeting);
    setEditingId(banner.id);
    setCampaignType(
      (banner.campaign_type as BannerCampaignType) || DEFAULT_PREMIUM_TRUST_BANNER.campaignType
    );
    setPlacement(banner.placement);
    setTitle(banner.title ?? "");
    setSubtitle(banner.subtitle ?? banner.message ?? "");
    setCtaText(banner.cta_text ?? DEFAULT_PREMIUM_TRUST_BANNER.ctaText);
    setLinkUrl(banner.link_url ?? DEFAULT_PREMIUM_TRUST_BANNER.linkUrl);
    setAudienceNotes(targeting.notes ?? "");
    setAudienceTags(targeting.audience ?? []);
    setPriority(String(banner.priority));
    setIsActive(banner.is_active);
    setStartsAt(toLocalDatetime(banner.starts_at));
    setEndsAt(toLocalDatetime(banner.ends_at));
    setError("");
  }

  function applyCampaignPreset(type: BannerCampaignType) {
    setCampaignType(type);
    const preset = presetForCampaign(type);
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setCtaText(preset.ctaText);
    setLinkUrl(preset.linkUrl);
  }

  async function saveBanner() {
    setError("");
    if (!title.trim() && !subtitle.trim()) {
      setError("Add a title or subtitle.");
      return;
    }

    setBusy(editingId ?? "new");
    const payload = {
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      message: subtitle.trim(),
      cta_text: ctaText.trim() || DEFAULT_PREMIUM_TRUST_BANNER.ctaText,
      link_url: linkUrl.trim() || DEFAULT_PREMIUM_TRUST_BANNER.linkUrl,
      image_url: null,
      priority: Number(priority) || 0,
      is_active: isActive,
      placement,
      campaign_type: campaignType,
      audience_targeting: {
        audience: audienceTags,
        notes: audienceNotes.trim() || undefined,
      },
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };

    const res = await fetch("/api/admin/site-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId
          ? { action: "update", id: editingId, payload }
          : { action: "create", payload }
      ),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not save banner.");
      setBusy(null);
      return;
    }

    setBusy(null);
    resetForm();
    router.refresh();
  }

  async function toggleActive(banner: SiteBanner) {
    setBusy(banner.id);
    await fetch("/api/admin/site-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        id: banner.id,
        is_active: !banner.is_active,
      }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Promos are off by default. Nothing appears on the app until you create a banner and mark it
        active. Use calm, premium copy for verification and trust assistance — not fear marketing.
      </p>

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
            <span className="text-xs font-semibold text-navy">Campaign type</span>
            <select
              value={campaignType}
              onChange={(e) => applyCampaignPreset(e.target.value as BannerCampaignType)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {BANNER_CAMPAIGN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BANNER_CAMPAIGN_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
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
            {PROMO_BANNER_PLACEMENT_SPECS[placement as SiteBannerPlacement] ? (
              <p className="mt-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-navy">
                <span className="font-bold">Layout: </span>
                {PROMO_BANNER_PLACEMENT_SPECS[placement as SiteBannerPlacement].layout}
                {PROMO_BANNER_PLACEMENT_SPECS[placement as SiteBannerPlacement].notes ? (
                  <span className="mt-1 block text-muted">
                    {PROMO_BANNER_PLACEMENT_SPECS[placement as SiteBannerPlacement].notes}
                  </span>
                ) : null}
              </p>
            ) : null}
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
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-navy">Audience tags (optional, for future targeting)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAMPAIGN_AUDIENCE_TAGS.map((tag) => {
                const on = audienceTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setAudienceTags((prev) =>
                        on ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      on ? "bg-navy text-gold" : "bg-surface text-muted"
                    }`}
                  >
                    {tag.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Textarea
              placeholder="Internal audience notes (staff only)"
              rows={2}
              value={audienceNotes}
              onChange={(e) => setAudienceNotes(e.target.value)}
            />
          </div>
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
                {BANNER_CAMPAIGN_LABELS[banner.campaign_type as BannerCampaignType] ??
                  banner.campaign_type}{" "}
                · {banner.placement} · priority {banner.priority} ·{" "}
                {banner.is_active ? "active" : "inactive"}
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
