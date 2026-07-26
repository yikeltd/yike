import type { MediaIntelligenceInput, MediaIntelligenceService, MediaQualityHint } from "./types";

/** Only checks photo count against the minimum — no pixel-level analysis. */
export class StubMediaIntelligenceService implements MediaIntelligenceService {
  getQualityHints(input: MediaIntelligenceInput): MediaQualityHint[] {
    const hints: MediaQualityHint[] = [];
    if (input.photoCount === 0) {
      hints.push({ code: "no_cover_photo", message: "Add at least one photo to use as the cover image." });
    }
    if (input.photoCount < input.minRequired) {
      hints.push({
        code: "too_few_photos",
        message: `Add ${input.minRequired - input.photoCount} more photo(s) to meet the minimum.`,
      });
    }
    return hints;
  }
}

export function createMediaIntelligenceService(): MediaIntelligenceService {
  return new StubMediaIntelligenceService();
}

export type { MediaIntelligenceInput, MediaIntelligenceService, MediaQualityHint } from "./types";
