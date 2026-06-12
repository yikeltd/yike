"use client";

import { useState, type ReactNode } from "react";
import type { Profile } from "@/types/database";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CoverUploadEditor } from "@/components/profile/cover-upload-editor";
import { SellerProfileHeader } from "@/components/profile/seller-profile-header";
import {
  getProfileCoverPositionY,
  getProfileCoverUrl,
} from "@/lib/profile/cover";
import type { ProfileSocialStats } from "@/lib/social/types";

type ProfileCoverHeroProps = {
  profile: Profile;
  email: string;
  displayName: string;
  memberSince: string;
  badges: ReactNode;
  socialStats?: ProfileSocialStats;
  editable?: boolean;
};

export function ProfileCoverHero({
  profile,
  email,
  displayName,
  memberSince,
  badges,
  socialStats,
  editable = true,
}: ProfileCoverHeroProps) {
  const [coverUrl, setCoverUrl] = useState(getProfileCoverUrl(profile));
  const [coverPositionY, setCoverPositionY] = useState(getProfileCoverPositionY(profile));

  const coverProfile = {
    ...profile,
    cover_url: coverUrl ?? profile.cover_url,
    cover_position_y: coverPositionY,
  };

  return (
    <SellerProfileHeader
      displayName={displayName}
      username={profile.username}
      coverProfile={coverProfile}
      socialStats={socialStats}
      showSocialLinks={editable}
      memberSince={memberSince}
      badges={badges}
      bio={profile.company_bio}
      avatarSlot={
        <div id="profile-photo" className="scroll-mt-24">
          <AvatarUpload
            userId={profile.id}
            email={email}
            name={profile.full_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size="xl"
            className="!h-24 !w-24 rounded-full border-4 border-white ring-2 ring-[#1877F2]/80 lg:!h-28 lg:!w-28"
          />
        </div>
      }
      coverControls={
        editable ? (
          <CoverUploadEditor
            iconOnly
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
        ) : null
      }
    />
  );
}
