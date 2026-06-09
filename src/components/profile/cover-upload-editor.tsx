"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { prepareCoverUpload } from "@/lib/media/prepare-cover-upload";
import { coverObjectPosition } from "@/lib/profile/cover";
import { PROFILE_MEDIA_LIMITS } from "@/lib/media/constants";
import { friendlyPublicError, UPLOAD_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { cn } from "@/lib/utils";

type CoverUploadEditorProps = {
  hasCover: boolean;
  coverUrl: string | null;
  initialFocalY: number;
  onSaved: (coverUrl: string, focalY: number) => void;
  onRemoved: () => void;
  className?: string;
};

export function CoverUploadEditor({
  hasCover,
  coverUrl,
  initialFocalY,
  onSaved,
  onRemoved,
  className,
}: CoverUploadEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [focalY, setFocalY] = useState(initialFocalY);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const resetDraft = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setFocalY(initialFocalY);
    setError("");
  }, [initialFocalY, previewUrl]);

  function closeEditor() {
    resetDraft();
    setOpen(false);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const prepared = await prepareCoverUpload(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(prepared);
      setPreviewUrl(url);
      setPendingFile(prepared);
      setFocalY(PROFILE_MEDIA_LIMITS.coverFocalDefault);
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? friendlyPublicError(err.message, UPLOAD_ERROR_FALLBACK) : UPLOAD_ERROR_FALLBACK
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function saveCover() {
    if (!pendingFile) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", pendingFile);
      form.append("focal_y", String(focalY));
      const res = await fetch("/api/profile/cover", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(friendlyPublicError((data.error as string) ?? UPLOAD_ERROR_FALLBACK, UPLOAD_ERROR_FALLBACK));
        return;
      }
      onSaved(data.coverUrl as string, data.coverPositionY as number);
      closeEditor();
    } catch {
      setError(UPLOAD_ERROR_FALLBACK);
    } finally {
      setUploading(false);
    }
  }

  async function saveRepositionOnly() {
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/cover", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focal_y: focalY }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(friendlyPublicError((data.error as string) ?? UPLOAD_ERROR_FALLBACK, UPLOAD_ERROR_FALLBACK));
        return;
      }
      if (coverUrl) onSaved(coverUrl, data.coverPositionY as number);
      closeEditor();
    } catch {
      setError(UPLOAD_ERROR_FALLBACK);
    } finally {
      setUploading(false);
    }
  }

  async function removeCover() {
    if (!hasCover) return;
    setRemoving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/cover", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(friendlyPublicError((data.error as string) ?? UPLOAD_ERROR_FALLBACK, UPLOAD_ERROR_FALLBACK));
        return;
      }
      onRemoved();
      closeEditor();
    } catch {
      setError(UPLOAD_ERROR_FALLBACK);
    } finally {
      setRemoving(false);
    }
  }

  const displayPreview = previewUrl ?? coverUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hasCover) {
            setFocalY(initialFocalY);
            setOpen(true);
          } else {
            inputRef.current?.click();
          }
        }}
        className={cn(
          "pressable absolute right-3 top-3 z-20 flex h-9 items-center gap-1.5 rounded-full bg-black/35 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/50",
          className
        )}
        aria-label="Edit cover photo"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Edit cover</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPickFile(e)}
      />

      {open && displayPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-editor-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-float-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="cover-editor-title" className="text-sm font-bold text-navy">
                {pendingFile ? "Preview cover" : "Reposition cover"}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="pressable rounded-full p-1 text-muted hover:bg-surface"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mx-4 mt-4 aspect-[3/1] overflow-hidden rounded-xl bg-navy">
              <Image
                src={displayPreview}
                alt="Cover preview"
                fill
                className="object-cover"
                style={{ objectPosition: coverObjectPosition(focalY) }}
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 bg-navy/45" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/25 to-navy/15" />
            </div>

            <div className="space-y-2 px-4 py-4">
              {!pendingFile && hasCover ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="pressable mb-2 text-xs font-semibold text-navy underline"
                >
                  Change photo
                </button>
              ) : null}
              <label htmlFor="cover-focal" className="text-xs font-semibold text-muted">
                Vertical position
              </label>
              <input
                id="cover-focal"
                type="range"
                min={0}
                max={100}
                value={focalY}
                onChange={(e) => setFocalY(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <p className="text-[11px] text-muted">
                Drag to choose what stays visible on mobile. A soft overlay keeps text readable.
              </p>
              {error ? <p className="text-xs text-danger">{error}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
              {hasCover ? (
                <button
                  type="button"
                  onClick={() => void removeCover()}
                  disabled={removing || uploading}
                  className="pressable inline-flex items-center gap-1.5 text-xs font-semibold text-danger disabled:opacity-50"
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove cover
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="pressable rounded-full px-4 py-2 text-xs font-semibold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void (pendingFile ? saveCover() : saveRepositionOnly())}
                  disabled={uploading || removing || (!pendingFile && !hasCover)}
                  className="pressable inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
