"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useDestructiveAction } from "@/components/admin/destructive-action-modal";
import { MOBILE_HEADER_BANNER_SPEC } from "@/constants/adminCreativeSpecs";
import { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";
import { AdminCreativeSizeCallout } from "@/components/admin/admin-creative-size-callout";
import type { SiteBanner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AdminImageUploadField } from "@/components/admin/admin-image-upload-field";
import { Trash2, Pencil } from "lucide-react";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function SiteBannerManager({ banners }: { banners: SiteBanner[] }) {
  const router = useRouter();
  const { confirm, destructiveModal } = useDestructiveAction();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [priority, setPriority] = useState("0");
  const [isActive, setIsActive] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setImageUrl("");
    setLinkUrl("");
    setPriority("0");
    setIsActive(false);
    setStartsAt("");
    setEndsAt("");
    setError("");
  }

  function loadForEdit(banner: SiteBanner) {
    setEditingId(banner.id);
    setTitle(banner.title ?? "");
    setMessage(banner.message ?? "");
    setImageUrl(banner.image_url ?? "");
    setLinkUrl(banner.link_url ?? "");
    setPriority(String(banner.priority));
    setIsActive(banner.is_active);
    setStartsAt(toLocalDatetime(banner.starts_at));
    setEndsAt(toLocalDatetime(banner.ends_at));
    setError("");
  }

  async function saveBanner() {
    setError("");
    const msg = message.trim();
    const ttl = title.trim();
    const img = imageUrl.trim();
    if (!msg && !ttl && !img) {
      setError("Add a title, message, or image before saving.");
      return;
    }
    if (isActive && !msg && !ttl && !img) {
      setError("Active banners need title, message, or image.");
      return;
    }

    setBusy(editingId ?? "new");
    const payload = {
      title: ttl || null,
      message: msg,
      image_url: img || null,
      link_url: linkUrl.trim() || null,
      priority: Number(priority) || 0,
      is_active: isActive,
      placement: MOBILE_HEADER_PLACEMENT,
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

  function removeBanner(id: string) {
    confirm({
      title: "Archive this banner?",
      description:
        "The banner will be hidden and archived. Chief admin can restore it from audit logs.",
      actionType: "site_banner.delete",
      requirePin: true,
      onConfirm: async (reason) => {
        setBusy(`del-${id}`);
        await fetch("/api/admin/site-banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id, reason }),
        });
        setBusy(null);
        if (editingId === id) resetForm();
        router.refresh();
      },
    });
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveBanner();
        }}
        className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
      >
        <h2 className="text-lg font-bold text-navy">
          {editingId ? "Edit banner" : "Create mobile header banner"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Shown on mobile only, below the header. Higher priority wins when
          multiple are active.
        </p>
        <div className="mt-3 max-w-xl">
          <AdminCreativeSizeCallout spec={MOBILE_HEADER_BANNER_SPEC} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Priority (higher = first)"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <div className="sm:col-span-2">
            <Textarea
              placeholder="Message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <AdminImageUploadField
              label="Banner image (optional)"
              hint="Or use title/message only — image is optional."
              sizeSpec={MOBILE_HEADER_BANNER_SPEC}
              value={imageUrl}
              onChange={setImageUrl}
              preset="square"
              folder="site-banners"
              disabled={!!busy}
            />
          </div>
          <Input
            placeholder="Link URL (optional)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            aria-label="Start date"
          />
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            aria-label="End date"
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded accent-gold"
          />
          Active on mobile header
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" disabled={!!busy}>
            {busy ? "Saving…" : editingId ? "Update banner" : "Create banner"}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
          All mobile header banners ({banners.length})
        </h3>
        {banners.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-float">
            No banners yet. Create one above.
          </p>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-float ring-1 ring-black/[0.04] sm:flex-row sm:items-center"
            >
              {banner.image_url?.trim() && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={banner.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy">
                  {banner.title || "Untitled banner"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                  {banner.message || "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Priority {banner.priority}
                  {banner.is_active ? " · Active" : " · Inactive"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => toggleActive(banner)}
                >
                  {banner.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => loadForEdit(banner)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => removeBanner(banner.id)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {destructiveModal}
    </div>
  );
}
