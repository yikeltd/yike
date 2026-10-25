import type { ProfileReviewResult } from "./profile-review-engine";

export type StoredSellerProfileReview = {
  version: 1;
  aiReview: ProfileReviewResult & { reviewedAt: string };
  evidence?: Record<string, unknown>;
};

export function serializeSellerProfileReviewNotes(
  review: ProfileReviewResult,
  evidence?: Record<string, unknown>
): string {
  const payload: StoredSellerProfileReview = {
    version: 1,
    aiReview: {
      ...review,
      reviewedAt: new Date().toISOString(),
    },
    evidence,
  };
  return JSON.stringify(payload);
}

export function parseSellerProfileReviewNotes(
  raw: string | null | undefined
): StoredSellerProfileReview | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as StoredSellerProfileReview;
    if (parsed?.version !== 1 || !parsed.aiReview) return null;
    return parsed;
  } catch {
    return null;
  }
}
