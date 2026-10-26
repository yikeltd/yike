import { isSampleListingFixtureEnabled } from "./flags";
import { SAMPLE_SELLERS } from "./catalog";

export type SampleReviewsPayload = {
  stats: { total: number; average: number };
  reviews: Array<{
    id: string;
    rating: number;
    body: string;
    created_at: string;
    reviewer: { full_name: string | null; avatar_url: string | null } | null;
  }>;
};

/** Local-only approved review previews for sample seller UUIDs. */
export function getSampleAgentReviewsPreview(
  agentId: string,
): SampleReviewsPayload | null {
  if (!isSampleListingFixtureEnabled()) return null;

  if (agentId === SAMPLE_SELLERS[0].id || agentId === SAMPLE_SELLERS[1].id) {
    return {
      stats: { total: 12, average: 4.7 },
      reviews: [
        {
          id: "sample-review-1",
          rating: 5,
          body: "Listing matched photos. Smooth handover and clear paperwork.",
          created_at: "2026-02-10T10:00:00.000Z",
          reviewer: { full_name: "Chidi O.", avatar_url: null },
        },
        {
          id: "sample-review-2",
          rating: 5,
          body: "Seller replied quickly on WhatsApp. Would buy again on Yike.",
          created_at: "2026-01-18T14:30:00.000Z",
          reviewer: { full_name: "Amaka N.", avatar_url: null },
        },
        {
          id: "sample-review-3",
          rating: 4,
          body: "Fair price for the area. Inspection went as described.",
          created_at: "2025-12-05T09:15:00.000Z",
          reviewer: { full_name: "Tunde B.", avatar_url: null },
        },
      ],
    };
  }

  if (agentId === SAMPLE_SELLERS[2].id) {
    return { stats: { total: 0, average: 0 }, reviews: [] };
  }

  return null;
}
