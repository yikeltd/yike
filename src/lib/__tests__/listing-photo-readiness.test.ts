import assert from "node:assert/strict";
import test from "node:test";
import {
  isReadyListingPhoto,
  readyListingPhotoUrls,
} from "@/lib/listing-create/photo-readiness";

test("pending and failed uploads are excluded from ready photo urls", () => {
  const urls = readyListingPhotoUrls([
    { upload_status: "uploading", image_url: "https://x.supabase.co/a.jpg", sort_order: 0 },
    { upload_status: "error", image_url: "https://x.supabase.co/b.jpg", sort_order: 1 },
    { upload_status: "ready", image_url: "https://x.supabase.co/c.jpg", sort_order: 2 },
    { upload_status: "ready", webp_url: "https://x.supabase.co/d.webp", sort_order: 3 },
  ]);
  assert.deepEqual(urls, [
    "https://x.supabase.co/c.jpg",
    "https://x.supabase.co/d.webp",
  ]);
});

test("isReadyListingPhoto treats missing status as ready when url exists", () => {
  assert.equal(isReadyListingPhoto({ image_url: "https://x.supabase.co/z.jpg" }), true);
  assert.equal(isReadyListingPhoto({ upload_status: "uploading", image_url: "x" }), false);
});
