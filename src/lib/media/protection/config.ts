/**
 * Media protection configuration — env-backed, no hardcoded production secrets.
 */

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envInt(name: string, fallback: number): number {
  return Math.round(envFloat(name, fallback));
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

export const MEDIA_PROTECTION_PUBLIC_BUCKET = "property-media";
export const MEDIA_PROTECTION_ARCHIVE_BUCKET = "listing-media-archive";

export function isMediaProtectionEnabled(): boolean {
  return envBool("ENABLE_MEDIA_PROTECTION", true);
}

export function getMediaProtectionConfig() {
  const cornerMin = envFloat("MEDIA_WM_CORNER_OPACITY_MIN", 0.12);
  const cornerMax = envFloat("MEDIA_WM_CORNER_OPACITY_MAX", 0.18);
  const patternMin = envFloat("MEDIA_WM_PATTERN_OPACITY_MIN", 0.02);
  const patternMax = envFloat("MEDIA_WM_PATTERN_OPACITY_MAX", 0.03);

  return {
    enabled: isMediaProtectionEnabled(),
    cornerOpacityMin: Math.min(cornerMin, cornerMax),
    cornerOpacityMax: Math.max(cornerMin, cornerMax),
    patternOpacityMin: Math.min(patternMin, patternMax),
    patternOpacityMax: Math.max(patternMin, patternMax),
    patternGap: Math.max(80, envInt("MEDIA_WM_PATTERN_GAP", 200)),
    pipelineVersion: process.env.MEDIA_PROTECTION_PIPELINE_VERSION?.trim() || "1.0.0",
    watermarkVersion: process.env.MEDIA_WATERMARK_VERSION?.trim() || "1.0.0",
    mediaVersion: process.env.MEDIA_VERSION?.trim() || "1",
    brandGold: "#E4B547",
    brandWhite: "#FFFFFF",
    marketplace: "yike",
    marketplaceHost: "Yike.ng",
    intelligentPlacement: envBool("ENABLE_INTELLIGENT_WATERMARK_PLACEMENT", false),
  } as const;
}

export type MediaProtectionConfig = ReturnType<typeof getMediaProtectionConfig>;
