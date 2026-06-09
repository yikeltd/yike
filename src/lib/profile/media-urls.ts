export type ProfileMediaVariant = "thumb" | "medium" | "large";

const AVATAR_VARIANT_FILE: Record<ProfileMediaVariant, string> = {
  thumb: "avatar-thumb.webp",
  medium: "avatar.webp",
  large: "avatar-lg.webp",
};

const COVER_VARIANT_FILE: Record<ProfileMediaVariant, string> = {
  thumb: "cover-thumb.webp",
  medium: "cover.webp",
  large: "cover-lg.webp",
};

/** Resolve a stored profile media URL to a specific WebP variant on the CDN. */
export function profileMediaVariantUrl(
  canonicalUrl: string | null | undefined,
  kind: "avatar" | "cover",
  variant: ProfileMediaVariant
): string | null {
  if (!canonicalUrl?.trim()) return null;

  const qIndex = canonicalUrl.indexOf("?");
  const base = qIndex >= 0 ? canonicalUrl.slice(0, qIndex) : canonicalUrl;
  const query = qIndex >= 0 ? canonicalUrl.slice(qIndex) : "";
  const slash = base.lastIndexOf("/");
  if (slash < 0) return canonicalUrl;

  const dir = base.slice(0, slash);
  const file = kind === "avatar" ? AVATAR_VARIANT_FILE[variant] : COVER_VARIANT_FILE[variant];
  return `${dir}/${file}${query}`;
}

/** Smallest sharp variant for avatar chips and profile hero (≤112px display). */
export function avatarDisplayUrl(url: string | null | undefined): string | null {
  return profileMediaVariantUrl(url, "avatar", "thumb");
}

/** Mobile-first cover — thumb on phones, medium/large on wider screens. */
export function coverDisplayUrl(
  url: string | null | undefined,
  variant: "thumb" | "medium" | "large" = "thumb"
): string | null {
  return profileMediaVariantUrl(url, "cover", variant);
}
