/**
 * MediaIntelligence — quality hints for uploaded photos (blur, lighting,
 * duplicate/stolen-image detection). CORE ships static/heuristic-free
 * stubs only — no `sharp`, no vision model calls happen inside YIP core.
 * Real image processing stays in `src/lib/media/*`.
 */
export type MediaQualityHint = {
  code: "too_few_photos" | "no_cover_photo" | (string & {});
  message: string;
};

export type MediaIntelligenceInput = {
  photoCount: number;
  minRequired: number;
};

export interface MediaIntelligenceService {
  getQualityHints(input: MediaIntelligenceInput): MediaQualityHint[];
}
