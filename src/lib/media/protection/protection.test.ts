/**
 * Media protection unit tests — run with:
 *   npx tsx --test src/lib/media/protection/protection.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { resolveWatermarkAttribution } from "./attribution";
import {
  computeImageFingerprints,
  computeSha256,
} from "./fingerprint";
import {
  compareFingerprints,
  hammingDistanceHex,
  hashSimilarity,
} from "./compare";
import { adaptiveParamsFromSeed, applyProtectionWatermarks } from "./watermark";
import { getMediaProtectionConfig } from "./config";
import { protectListingImage } from "./pipeline";

async function solidJpeg(color: { r: number; g: number; b: number }, w = 640, h = 480) {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toBuffer();
}

describe("attribution", () => {
  it("prefers company name over seller name", () => {
    const r = resolveWatermarkAttribution({
      company_name: "Stanhan Real Estate",
      full_name: "Alex Ukeje",
    });
    assert.equal(r.watermarkLabel, "Stanhan Real Estate • Yike.ng");
  });

  it("falls back to seller then Verified Seller", () => {
    assert.equal(
      resolveWatermarkAttribution({ full_name: "Alex Ukeje" }).watermarkLabel,
      "Alex Ukeje • Yike.ng"
    );
    assert.equal(
      resolveWatermarkAttribution({}).watermarkLabel,
      "Verified Seller • Yike.ng"
    );
  });
});

describe("fingerprints", () => {
  it("produces stable sha256 and hex perceptual hashes", async () => {
    const buf = await solidJpeg({ r: 40, g: 80, b: 120 });
    const a = await computeImageFingerprints(buf);
    const b = await computeImageFingerprints(buf);
    assert.equal(a.sha256, b.sha256);
    assert.equal(a.sha256, computeSha256(buf));
    assert.match(a.ahash, /^[0-9a-f]+$/);
    assert.match(a.dhash, /^[0-9a-f]+$/);
    assert.match(a.phash, /^[0-9a-f]+$/);
    assert.equal(hammingDistanceHex(a.phash, b.phash), 0);
    assert.equal(hashSimilarity(a.phash, b.phash), 1);
  });

  it("detects different images via compareFingerprints", async () => {
    const dark = await computeImageFingerprints(await solidJpeg({ r: 10, g: 10, b: 10 }));
    const patterned = await computeImageFingerprints(
      await sharp({
        create: {
          width: 640,
          height: 480,
          channels: 3,
          background: { r: 240, g: 240, b: 240 },
        },
      })
        .composite([
          {
            input: await sharp({
              create: {
                width: 200,
                height: 200,
                channels: 3,
                background: { r: 20, g: 180, b: 90 },
              },
            })
              .png()
              .toBuffer(),
            left: 40,
            top: 60,
          },
        ])
        .jpeg()
        .toBuffer()
    );
    const cmp = compareFingerprints(dark, patterned);
    assert.equal(cmp.sha256Match, false);
    assert.ok(
      (cmp.phashDistance ?? 0) > 0 ||
        (cmp.ahashDistance ?? 0) > 0 ||
        (cmp.dhashDistance ?? 0) > 0
    );
  });
});

describe("watermark", () => {
  it("applies adaptive params stably for a seed", () => {
    const cfg = getMediaProtectionConfig();
    const a = adaptiveParamsFromSeed("seed-a", 1800, cfg);
    const b = adaptiveParamsFromSeed("seed-a", 1800, cfg);
    assert.deepEqual(a, b);
    assert.ok(a.cornerOpacity >= cfg.cornerOpacityMin);
    assert.ok(a.cornerOpacity <= cfg.cornerOpacityMax);
  });

  it("returns a webp buffer larger than empty for patterned overlay", async () => {
    const input = await solidJpeg({ r: 90, g: 110, b: 140 }, 800, 600);
    const raw = await sharp(input).webp().toBuffer();
    const out = await applyProtectionWatermarks(raw, "Stanhan Real Estate • Yike.ng", "uuid-1");
    assert.ok(out.buffer.byteLength > 500);
    assert.ok(out.width >= 700);
  });
});

describe("pipeline", () => {
  it("protectListingImage returns three variants + fingerprints", async () => {
    const buf = await solidJpeg({ r: 60, g: 90, b: 130 }, 1200, 900);
    const result = await protectListingImage({
      buffer: buf,
      profile: { company_name: "Stankings Auto Hub", full_name: "Driver" },
      ownerId: "00000000-0000-4000-8000-000000000001",
      listingRef: "draft/test",
      listingId: null,
      index: 0,
      mimeSource: "image/jpeg",
    });
    assert.equal(result.watermarkLabel, "Stankings Auto Hub • Yike.ng");
    assert.ok(result.thumbnail.byteLength > 100);
    assert.ok(result.medium.byteLength > 100);
    assert.ok(result.large.byteLength > 100);
    assert.ok(result.fingerprints.sha256.length === 64);
    assert.match(result.paths.original, /^originals\//);
    assert.match(result.paths.large, /-lg\.webp$/);
  });
});
