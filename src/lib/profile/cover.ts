import type { Profile } from "@/types/database";
import { PROFILE_MEDIA_LIMITS } from "@/lib/media/constants";

export function getProfileCoverUrl(profile: Pick<Profile, "cover_url" | "company_cover_url">): string | null {
  const url = profile.cover_url ?? profile.company_cover_url;
  return url?.trim() ? url : null;
}

export function getProfileCoverPositionY(
  profile: Pick<Profile, "cover_position_y">
): number {
  const y = profile.cover_position_y ?? PROFILE_MEDIA_LIMITS.coverFocalDefault;
  return Math.max(0, Math.min(100, y));
}

/** CSS object-position for cover banners — centre-safe with stored focal Y. */
export function coverObjectPosition(focalY: number): string {
  return `center ${Math.max(0, Math.min(100, focalY))}%`;
}
