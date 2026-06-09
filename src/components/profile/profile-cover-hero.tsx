"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import type { Profile } from "@/types/database";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CoverUploadEditor } from "@/components/profile/cover-upload-editor";
import {
  coverObjectPosition,
  getProfileCoverPositionY,
  getProfileCoverUrl,
} from "@/lib/profile/cover";
import { cn } from "@/lib/utils";

type ProfileCoverHeroProps = {
  profile: Profile;
  email: string;
  displayName: string;
  memberSince: string;
  badges: ReactNode;
  editable?: boolean;
};

export function ProfileCoverHero({
  profile,
  email,
  displayName,
  memberSince,
  badges,
  editable = true,
}: ProfileCoverHeroProps) {
  const [coverUrl, setCoverUrl] = useState(getProfileCoverUrl(profile));
  const [coverPositionY, setCoverPositionY] = useState(getProfileCoverPositionY(profile));

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-navy text-white shadow-float-lg">
      <div className="absolute inset-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            priority={false}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-cover"
            style={{ objectPosition: coverObjectPosition(coverPositionY) }}
            unoptimized
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#021428] to-[#010d1f]" />
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl"
              aria-hidden
            />
          </>
        )}
        <div className="absolute inset-0 bg-navy/55" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-navy/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"
          aria-hidden
        />
      </div>

      {editable ? (
        <CoverUploadEditor
          hasCover={Boolean(coverUrl)}
          coverUrl={coverUrl}
          initialFocalY={coverPositionY}
          onSaved={(url, focal) => {
            setCoverUrl(url);
            setCoverPositionY(focal);
          }}
          onRemoved={() => {
            setCoverUrl(null);
            setCoverPositionY(50);
          }}
        />
      ) : null}

      <div className="relative flex flex-col items-center px-5 pb-6 pt-8 text-center">
        <AvatarUpload
          userId={profile.id}
          email={email}
          name={profile.full_name}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="xl"
        />
        <h1
          className={cn(
            "mt-4 text-2xl font-bold tracking-tight",
            coverUrl && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          )}
        >
          {displayName}
        </h1>
        {profile.username ? (
          <p className="mt-1 text-sm text-white/85 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
            @{profile.username}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-white/70">Member since {memberSince}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">{badges}</div>
      </div>
    </section>
  );
}
