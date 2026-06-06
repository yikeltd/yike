/**
 * Future short-video generation architecture (NOT implemented in MVP).
 * Photo-motion cards remain the primary swipe experience.
 */

export type ReelFormat = "tiktok" | "whatsapp_status" | "instagram_story" | "square_post";

export type ReelGenerationJob = {
  id: string;
  listing_id: string;
  agent_id: string;
  format: ReelFormat;
  status: "queued" | "processing" | "ready" | "failed";
  source_media_ids: string[];
  output_url?: string;
  created_at: string;
};

/** Placeholder — wire to worker/queue when verified agents get reel generation. */
export function planReelFromPhotos(_input: {
  listingId: string;
  format: ReelFormat;
}): ReelGenerationJob | null {
  return null;
}
