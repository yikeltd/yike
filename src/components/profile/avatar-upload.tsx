"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/profile/user-avatar";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import { prepareAvatarUpload } from "@/lib/media/prepare-avatar-upload";
import { friendlyPublicError, UPLOAD_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { friendlyStorageError } from "@/lib/media/storage-errors";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  userId,
  email,
  name,
  username,
  avatarUrl: initialUrl,
  size = "xl",
  onUpdated,
}: {
  userId: string;
  email: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  size?: "lg" | "xl";
  onUpdated?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const prepared = await prepareAvatarUpload(file);
      const form = new FormData();
      form.append("file", prepared);

      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(friendlyStorageError((data.error as string) ?? "Upload failed"));
        return;
      }
      const url = data.avatarUrl as string;
      setAvatarUrl(url);
      saveQuickLoginUser({
        userId,
        email,
        fullName: name,
        username,
        avatarUrl: url,
      });
      onUpdated?.(url);
    } catch (err) {
      setError(err instanceof Error ? friendlyPublicError(err.message, UPLOAD_ERROR_FALLBACK) : UPLOAD_ERROR_FALLBACK);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative inline-flex">
      <UserAvatar name={name} avatarUrl={avatarUrl} size={size} ring />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "pressable absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy shadow-glow-gold",
          uploading && "opacity-70"
        )}
        aria-label="Change profile photo"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />
      {error && (
        <p className="absolute left-0 top-full mt-2 w-48 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
