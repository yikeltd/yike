import type { Property } from "@/types/database";

export type ImageQualityFlag =
  | "few_images"
  | "low_resolution_hint"
  | "duplicate_url"
  | "watermark_hint"
  | "suspicious_pattern";

const WATERMARK_PATTERNS = [
  /watermark/i,
  /jiji/i,
  /propertypro/i,
  /nigeriaproperty/i,
];

const TINY_DIMENSION_HINT = /[_-](\d{2,3})x(\d{2,3})[._-]/i;

/** Heuristic image checks — hooks for future AI moderation. Does not block uploads. */
export function analyzeImageQuality(property: Pick<
  Property,
  "media_urls" | "media_items" | "title"
>): {
  image_quality_score: number;
  image_quality_flags: ImageQualityFlag[];
} {
  const urls = property.media_urls ?? [];
  const flags: ImageQualityFlag[] = [];
  let score = 70;

  if (urls.length < 3) {
    flags.push("few_images");
    score -= 15;
  }

  const seen = new Set<string>();
  for (const url of urls) {
    const base = url.split("?")[0] ?? url;
    if (seen.has(base)) {
      flags.push("duplicate_url");
      score -= 12;
      break;
    }
    seen.add(base);

    if (WATERMARK_PATTERNS.some((p) => p.test(url))) {
      if (!flags.includes("watermark_hint")) flags.push("watermark_hint");
      score -= 8;
    }

    const dim = url.match(TINY_DIMENSION_HINT);
    if (dim) {
      const w = Number(dim[1]);
      const h = Number(dim[2]);
      if (w < 400 || h < 300) {
        if (!flags.includes("low_resolution_hint")) {
          flags.push("low_resolution_hint");
          score -= 10;
        }
      }
    }
  }

  if (/call for price|whatsapp for price/i.test(property.title ?? "")) {
    flags.push("suspicious_pattern");
    score -= 5;
  }

  return {
    image_quality_score: Math.max(0, Math.min(100, score)),
    image_quality_flags: flags,
  };
}

export function imageQualityRankAdjustment(
  property: Pick<Property, "image_quality_score" | "image_quality_flags">
): number {
  let delta = 0;
  if (property.image_quality_score != null) {
    delta += Math.round(property.image_quality_score * 2);
  }
  const flags = property.image_quality_flags ?? [];
  if (flags.includes("few_images")) delta -= 200;
  if (flags.includes("duplicate_url")) delta -= 400;
  if (flags.includes("watermark_hint")) delta -= 150;
  return delta;
}
