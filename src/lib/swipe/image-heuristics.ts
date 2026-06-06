import type { PropertyMediaItem } from "@/types/database";

const SPAM_URL = /screenshot|whatsapp|watermark|imgur|fbcdn|telegram|status\.jpg|chat\s?photo/i;
const TINY_IMAGE = 320;

/** Heuristic URL / metadata checks — no server CV. */
export function mediaUrlQualityPenalty(url: string): number {
  let penalty = 0;
  if (SPAM_URL.test(url)) penalty += 25;
  if (/\.(gif|bmp)$/i.test(url)) penalty += 10;
  return penalty;
}

export function mediaItemQualityPenalty(item: PropertyMediaItem): number {
  let penalty = mediaUrlQualityPenalty(item.image_url);
  penalty += mediaUrlQualityPenalty(item.webp_url ?? "");

  if (item.width && item.width < TINY_IMAGE) penalty += 15;
  if (item.height && item.width && item.height / item.width > 2.2) penalty += 8;

  return penalty;
}

/** Cover score boost — landscape, larger, preferred labels handled elsewhere. */
export function mediaCoverScore(item: PropertyMediaItem): number {
  let score = 0;
  if (item.width && item.height) {
    const ratio = item.width / item.height;
    if (ratio >= 1.2 && ratio <= 1.8) score += 12;
    if (item.width >= 800) score += 10;
    if (item.width < 400) score -= 15;
  }
  score -= mediaItemQualityPenalty(item) * 0.5;
  return score;
}
