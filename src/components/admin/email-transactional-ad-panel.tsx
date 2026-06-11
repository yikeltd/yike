"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdPlacement } from "@/types/database";
import { EMAIL_TRANSACTIONAL_SPEC } from "@/constants/adminCreativeSpecs";
import { AdminCreativeSizeCallout } from "@/components/admin/admin-creative-size-callout";
import { AdminImageUploadField } from "@/components/admin/admin-image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function isScheduledLive(placement: AdPlacement): boolean {
  if (!placement.is_active || !placement.image_url?.trim()) return false;
  const now = Date.now();
  if (placement.starts_at && new Date(placement.starts_at).getTime() > now) return false;
  if (placement.ends_at && new Date(placement.ends_at).getTime() <= now) return false;
  return true;
}

export function EmailTransactionalAdPanel({
  placement,
}: {
  placement: AdPlacement | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(placement?.title ?? "");
  const [imageUrl, setImageUrl] = useState(placement?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(placement?.link_url ?? "");
  const [altText, setAltText] = useState(placement?.alt_text ?? "");
  const [isActive, setIsActive] = useState(placement?.is_active ?? false);
  const [startsAt, setStartsAt] = useState(toLocalDatetime(placement?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalDatetime(placement?.ends_at ?? null));

  const live = placement ? isScheduledLive({ ...placement, is_active: isActive, image_url: imageUrl, starts_at: startsAt ? new Date(startsAt).toISOString() : null, ends_at: endsAt ? new Date(endsAt).toISOString() : null }) : false;

  async function handleSave(goLive: boolean) {
    setError("");
    if (goLive && !imageUrl.trim()) {
      setError("Upload an image before going live.");
      return;
    }
    if (goLive && !linkUrl.trim()) {
      setError("Add a click-through link before going live.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/admin/ads/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || null,
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        alt_text: altText.trim(),
        is_active: goLive,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    setIsActive(goLive);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
            Transactional emails
          </p>
          <h2 className="mt-1 text-xl font-bold text-navy">Email sponsor chip</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Compact promo under the headline on every user email (OTP, welcome, listings).
            Upload image, set link, schedule, go live — turn off anytime.
          </p>
          <div className="mt-3 max-w-xl">
            <AdminCreativeSizeCallout spec={EMAIL_TRANSACTIONAL_SPEC} />
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            live ? "bg-emerald-500/15 text-emerald-800" : "bg-surface text-muted"
          }`}
        >
          {live ? "Live in emails" : isActive ? "Scheduled / waiting" : "Off"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <FormSection title="Creative">
            <Input
              placeholder="Headline — e.g. List your property free"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Click-through link (https://yike.ng/…)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <Input
              placeholder="Alt text (accessibility)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />

            <AdminImageUploadField
              label="Sponsor image"
              sizeSpec={EMAIL_TRANSACTIONAL_SPEC}
              value={imageUrl}
              onChange={setImageUrl}
              preset="square"
              folder="email"
            />
          </FormSection>

          <FormSection title="Schedule">
            <label className="block text-xs font-semibold text-muted">
              Start (optional)
              <Input
                type="datetime-local"
                className="mt-1"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              End (optional)
              <Input
                type="datetime-local"
                className="mt-1"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </label>
          </FormSection>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void handleSave(true)}>
              {busy ? "Saving…" : "Save & go live"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleSave(false)}
            >
              Save draft / turn off
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Email preview
          </p>
          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <p className="text-center text-lg font-bold text-navy">Verify your Yike account</p>
            {imageUrl ? (
              <a
                href={linkUrl || "#"}
                className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-white p-2.5 no-underline"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <Image src={imageUrl} alt={altText || title || "Sponsored"} fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Sponsored</p>
                  <p className="truncate text-sm font-bold text-navy">
                    {title.trim() || "Your headline"}
                  </p>
                </div>
                <span className="text-lg font-bold text-gold">&rsaquo;</span>
              </a>
            ) : (
              <p className="mt-6 py-8 text-center text-sm text-muted">
                Upload an image to preview the chip
              </p>
            )}
            <p className="mt-4 text-center text-sm text-muted">Hi Ada, your verification code…</p>
          </div>
          <p className="mt-3 text-xs text-muted">
            Also preview full templates at{" "}
            <Link href="/dev/emails" className="font-semibold text-navy underline">
              /dev/emails
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
