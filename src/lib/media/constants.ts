/** Media optimization limits — Yike.ng */
/** Post-compression caps for profile media outputs. */
export const PROFILE_MEDIA_LIMITS = {
  avatarMaxOutputBytes: 120 * 1024,
  coverMaxOutputBytes: 280 * 1024,
  coverAspectRatio: 3, // width : height (LinkedIn/Facebook-style banner)
  coverFocalDefault: 50,
  minWebpQuality: 76,
} as const;

/** Square avatar crops — sized for retina up to 112px display (xl). */
export const AVATAR_PROFILE_SIZES = {
  thumbnail: { size: 128, maxBytes: 14 * 1024, quality: 80 },
  medium: { size: 256, maxBytes: 32 * 1024, quality: 82 },
  large: { size: 384, maxBytes: 52 * 1024, quality: 84 },
  blur: { size: 24, quality: 40 },
} as const;

/** Cover banner variants — mobile-first, sharp at hero width without bloat. */
export const COVER_SIZES = {
  thumbnail: { width: 480, maxBytes: 32 * 1024, quality: 78 },
  medium: { width: 768, maxBytes: 68 * 1024, quality: 80 },
  large: { width: 1080, maxBytes: 110 * 1024, quality: 82 },
  blur: { width: 32, quality: 40 },
} as const;

export const MEDIA_LIMITS = {
  maxUploadBytes: 15 * 1024 * 1024, // 15MB before compression
  maxVideoUploadBytes: 15 * 1024 * 1024,
  maxVideoDurationSec: 30,
  maxVideoOptimizedBytes: 8 * 1024 * 1024,
  /** Warn only when source is genuinely tiny — normal phone photos should not warn. */
  minSharpLongEdge: 600,
  minSharpWidth: 600,
  minSharpHeight: 400,
  /** Client pre-upload resize cap — server also caps at gallery_large. */
  clientMaxLongEdge: 2000,
  targets: {
    thumbnailKb: 80,
    listingKb: 200,
    heroKb: 300,
  },
} as const;

/** Quality-preserving WebP variants — do not go below quality 75. */
export const IMAGE_SIZES = {
  thumbnail: { width: 400, quality: 84 },
  medium: { width: 900, quality: 86 },
  large: { width: 1800, quality: 88 },
  blur: { width: 24, quality: 40 },
} as const;

/** Single-size presets — all uploads must pass through one of these or IMAGE_SIZES responsive set. */
export const IMAGE_PRESET_SIZES = {
  square: { width: 80, height: 80, fit: "cover" as const, quality: 82 },
  card: { width: 768, fit: "inside" as const, quality: 84 },
  banner: { width: 1200, fit: "inside" as const, quality: 84 },
  strip: { width: 1600, fit: "inside" as const, quality: 82 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESET_SIZES;

export const WEBP_CONTENT_TYPE = "image/webp" as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
