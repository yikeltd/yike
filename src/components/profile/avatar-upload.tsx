"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/profile/user-avatar";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import { prepareAvatarUpload } from "@/lib/media/prepare-avatar-upload";
import { friendlyPublicError, UPLOAD_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  userId,
  email,
  name,
  username,
  avatarUrl: initialUrl,
  size = "xl",
  className,
  onUpdated,
}: {
  userId: string;
  email: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  size?: "lg" | "xl";
  className?: string;
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

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const raw = (data.error as string) ?? "Upload failed";
        setError(friendlyPublicError(raw, UPLOAD_ERROR_FALLBACK));
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
      <UserAvatar name={name} avatarUrl={avatarUrl} size={size} ring className={className} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "pressable absolute bottom-0 right-0 z-10 flex h-8 w-8 translate-x-1.5 translate-y-1.5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-gold to-gold-dark text-navy shadow-md transition-transform hover:scale-110",
          uploading && "opacity-70"
        )}
        aria-label="Change profile photo"
        title="Change profile photo"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />
      {error && (
        <p className="absolute left-0 top-full mt-2 w-48 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
