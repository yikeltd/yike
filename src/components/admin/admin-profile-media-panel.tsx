"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import type { Profile } from "@/types/database";
import { getProfileCoverUrl } from "@/lib/profile/cover";
import { cn } from "@/lib/utils";

export function AdminProfileMediaPanel({ profile }: { profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState(getProfileCoverUrl(profile));
  const [busy, setBusy] = useState<"avatar" | "cover" | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  async function removeMedia(kind: "avatar" | "cover") {
    const note = reason.trim() || "Removed by admin — please upload appropriate imagery";
    setBusy(kind);
    setError("");
    try {
      const res = await fetch(`/api/admin/profiles/${profile.id}/profile-media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, reason: note }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? "Could not remove image");
        return;
      }
      if (kind === "avatar") setAvatarUrl(null);
      else setCoverUrl(null);
    } catch {
      setError("Could not remove image");
    } finally {
      setBusy(null);
    }
  }

  const hasMedia = Boolean(avatarUrl || coverUrl);

  return (
    <section className="rounded-2xl border border-navy/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <h2 className="font-bold text-navy">Profile media</h2>
          <p className="mt-0.5 text-xs text-muted">
            Review avatar and cover — remove inappropriate images silently.
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-navy/10 px-5 pb-5 pt-4">
          <label className="block text-xs font-semibold text-muted">
            Removal note (optional — logged in audit)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ask agent to replace with professional branding"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm text-navy"
            />
          </label>

          {!hasMedia ? (
            <p className="text-sm text-muted">No custom avatar or cover uploaded.</p>
          ) : null}

          {coverUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Cover</p>
              <div className="relative aspect-[3/1] overflow-hidden rounded-xl bg-navy ring-1 ring-navy/10">
                <Image src={coverUrl} alt="Profile cover" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-navy/35" />
              </div>
              <button
                type="button"
                onClick={() => void removeMedia("cover")}
                disabled={busy !== null}
                className={cn(
                  "pressable inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger",
                  busy === "cover" && "opacity-60"
                )}
              >
                {busy === "cover" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove cover
              </button>
            </div>
          ) : null}

          {avatarUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Avatar</p>
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-surface ring-1 ring-navy/10">
                <Image src={avatarUrl} alt="Profile avatar" fill className="object-cover" unoptimized />
              </div>
              <button
                type="button"
                onClick={() => void removeMedia("avatar")}
                disabled={busy !== null}
                className={cn(
                  "pressable inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger",
                  busy === "avatar" && "opacity-60"
                )}
              >
                {busy === "avatar" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove avatar
              </button>
            </div>
          ) : null}

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
