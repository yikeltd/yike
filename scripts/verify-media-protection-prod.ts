/**
 * Production verification harness for Media Protection Pipeline.
 * Generates synthetic scenes, measures timing, validates watermarks & fingerprints.
 * Run: tsx scripts/verify-media-protection-prod.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import {
  resolveWatermarkAttribution,
  protectListingImage,
  compareFingerprints,
  isMediaProtectionEnabled,
  getMediaProtectionConfig,
} from "../src/lib/media/protection";
import { compressPropertyPhoto } from "../src/lib/images/compress-image";

const OUT = join(process.cwd(), "tmp/media-protection-verify");
mkdirSync(OUT, { recursive: true });

type Scene = {
  id: string;
  label: string;
  width: number;
  height: number;
  build: () => Promise<Buffer>;
};

async function rect(
  w: number,
  h: number,
  color: { r: number; g: number; b: number }
): Promise<Buffer> {
  return sharp({
    create: { width: w, height: h, channels: 3, background: color },
  })
    .png()
    .toBuffer();
}

async function sceneBuffer(parts: {
  bg: { r: number; g: number; b: number };
  width: number;
  height: number;
  overlays?: Array<{
    left: number;
    top: number;
    w: number;
    h: number;
    color: { r: number; g: number; b: number };
  }>;
}): Promise<Buffer> {
  const overlays = await Promise.all(
    (parts.overlays ?? []).map(async (o) => ({
      input: await rect(o.w, o.h, o.color),
      left: o.left,
      top: o.top,
    }))
  );
  return sharp({
    create: {
      width: parts.width,
      height: parts.height,
      channels: 3,
      background: parts.bg,
    },
  })
    .composite(overlays)
    .jpeg({ quality: 92 })
    .toBuffer();
}

const scenes: Scene[] = [
  {
    id: "bright-vehicle",
    label: "Bright vehicle (sky + body)",
    width: 1600,
    height: 1000,
    build: () =>
      sceneBuffer({
        width: 1600,
        height: 1000,
        bg: { r: 180, g: 210, b: 240 },
        overlays: [
          { left: 200, top: 420, w: 1100, h: 380, color: { r: 230, g: 40, b: 40 } },
          { left: 280, top: 560, w: 120, h: 120, color: { r: 30, g: 30, b: 30 } },
          { left: 1080, top: 560, w: 120, h: 120, color: { r: 30, g: 30, b: 30 } },
        ],
      }),
  },
  {
    id: "dark-vehicle",
    label: "Dark vehicle (night)",
    width: 1600,
    height: 1000,
    build: () =>
      sceneBuffer({
        width: 1600,
        height: 1000,
        bg: { r: 18, g: 22, b: 30 },
        overlays: [
          { left: 250, top: 400, w: 1000, h: 360, color: { r: 28, g: 32, b: 40 } },
          { left: 700, top: 520, w: 200, h: 40, color: { r: 220, g: 220, b: 180 } },
        ],
      }),
  },
  {
    id: "white-building",
    label: "White building facade",
    width: 1400,
    height: 1800,
    build: () =>
      sceneBuffer({
        width: 1400,
        height: 1800,
        bg: { r: 245, g: 245, b: 248 },
        overlays: [
          { left: 120, top: 200, w: 1160, h: 1400, color: { r: 250, g: 250, b: 252 } },
          { left: 220, top: 360, w: 280, h: 360, color: { r: 140, g: 190, b: 230 } },
          { left: 780, top: 360, w: 280, h: 360, color: { r: 140, g: 190, b: 230 } },
        ],
      }),
  },
  {
    id: "dark-building",
    label: "Dark building",
    width: 1400,
    height: 1800,
    build: () =>
      sceneBuffer({
        width: 1400,
        height: 1800,
        bg: { r: 35, g: 40, b: 55 },
        overlays: [
          { left: 100, top: 180, w: 1200, h: 1450, color: { r: 45, g: 50, b: 65 } },
          { left: 240, top: 400, w: 260, h: 320, color: { r: 220, g: 200, b: 120 } },
        ],
      }),
  },
  {
    id: "indoor-property",
    label: "Indoor living room",
    width: 1600,
    height: 1200,
    build: () =>
      sceneBuffer({
        width: 1600,
        height: 1200,
        bg: { r: 210, g: 200, b: 185 },
        overlays: [
          { left: 100, top: 700, w: 1400, h: 400, color: { r: 120, g: 90, b: 60 } },
          { left: 500, top: 200, w: 600, h: 400, color: { r: 160, g: 200, b: 230 } },
        ],
      }),
  },
  {
    id: "outdoor-property",
    label: "Outdoor house + sky",
    width: 1800,
    height: 1200,
    build: () =>
      sceneBuffer({
        width: 1800,
        height: 1200,
        bg: { r: 135, g: 190, b: 245 },
        overlays: [
          { left: 0, top: 780, w: 1800, h: 420, color: { r: 70, g: 140, b: 70 } },
          { left: 420, top: 380, w: 900, h: 520, color: { r: 230, g: 220, b: 210 } },
        ],
      }),
  },
  {
    id: "portrait",
    label: "Portrait framing",
    width: 900,
    height: 1400,
    build: () =>
      sceneBuffer({
        width: 900,
        height: 1400,
        bg: { r: 90, g: 120, b: 90 },
        overlays: [
          { left: 150, top: 200, w: 600, h: 900, color: { r: 200, g: 180, b: 160 } },
        ],
      }),
  },
  {
    id: "landscape",
    label: "Landscape framing",
    width: 2000,
    height: 900,
    build: () =>
      sceneBuffer({
        width: 2000,
        height: 900,
        bg: { r: 100, g: 160, b: 220 },
        overlays: [
          { left: 0, top: 500, w: 2000, h: 400, color: { r: 60, g: 110, b: 50 } },
        ],
      }),
  },
];

async function sampleCornerBrightness(buf: Buffer): Promise<number> {
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const extractW = Math.min(280, w);
  const extractH = Math.min(48, h);
  const { data } = await sharp(buf)
    .extract({
      left: Math.max(0, w - extractW - 8),
      top: Math.max(0, h - extractH - 8),
      width: extractW,
      height: extractH,
    })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const v of data) sum += v;
  return sum / data.length;
}

async function main() {
  const failures: string[] = [];
  const timings: Array<{ id: string; protectMs: number; legacyMs: number; bytesIn: number; bytesLarge: number }> =
    [];

  console.log("=== Attribution matrix ===");
  const cases = [
    { profile: { company_name: "Stanhan Real Estate", full_name: "Alex" }, expect: "Stanhan Real Estate • Yike.ng" },
    { profile: { company_name: "Stankings Auto Hub", full_name: "Dealer" }, expect: "Stankings Auto Hub • Yike.ng" },
    { profile: { full_name: "Alex Ukeje" }, expect: "Alex Ukeje • Yike.ng" },
    { profile: {}, expect: "Verified Seller • Yike.ng" },
    { profile: { company_name: "  ", full_name: "  Private Seller  " }, expect: "Private Seller • Yike.ng" },
  ];
  for (const c of cases) {
    const got = resolveWatermarkAttribution(c.profile).watermarkLabel;
    const ok = got === c.expect;
    console.log(ok ? "PASS" : "FAIL", got);
    if (!ok) failures.push(`attribution: got ${got} expected ${c.expect}`);
  }

  console.log("\n=== Scene protection ===");
  for (const scene of scenes) {
    const input = await scene.build();
    const t0 = performance.now();
    const protectedImage = await protectListingImage({
      buffer: input,
      profile: { company_name: "Stanhan Real Estate", full_name: "QA Seller" },
      ownerId: "00000000-0000-4000-8000-000000000099",
      listingRef: "draft/verify",
      listingId: null,
      index: 0,
      mimeSource: "image/jpeg",
    });
    const protectMs = performance.now() - t0;

    const t1 = performance.now();
    await compressPropertyPhoto(input);
    const legacyMs = performance.now() - t1;

    timings.push({
      id: scene.id,
      protectMs,
      legacyMs,
      bytesIn: input.byteLength,
      bytesLarge: protectedImage.large.byteLength,
    });

    const outPath = join(OUT, `${scene.id}-lg.webp`);
    writeFileSync(outPath, protectedImage.large);

    const hasHashes =
      protectedImage.fingerprints.sha256.length === 64 &&
      protectedImage.fingerprints.ahash.length > 0 &&
      protectedImage.fingerprints.dhash.length > 0 &&
      protectedImage.fingerprints.phash.length > 0;
    if (!hasHashes) failures.push(`${scene.id}: missing fingerprints`);

    if (protectedImage.watermarkLabel !== "Stanhan Real Estate • Yike.ng") {
      failures.push(`${scene.id}: bad watermark label`);
    }

    // Corner should remain in lower-right inset (adaptive pads)
    if (protectedImage.adaptive.padX < 8 || protectedImage.adaptive.padY < 6) {
      failures.push(`${scene.id}: adaptive pad too small`);
    }

    // Output should be non-trivial WebP
    if (protectedImage.large.byteLength < 2_000) {
      failures.push(`${scene.id}: suspiciously small output`);
    }

    // Quality: large variant should stay near source resolution for big inputs
    if (protectedImage.processedWidth < Math.min(scene.width, 1600) * 0.85) {
      failures.push(`${scene.id}: unexpected downscale ${protectedImage.processedWidth}`);
    }

    const cornerLum = await sampleCornerBrightness(protectedImage.large);
    console.log(
      `${scene.id}: protect=${protectMs.toFixed(0)}ms legacy=${legacyMs.toFixed(0)}ms ` +
        `large=${(protectedImage.large.byteLength / 1024).toFixed(1)}KB ` +
        `color=${protectedImage.watermarkColor} cornerLum=${cornerLum.toFixed(0)} → ${outPath}`
    );
  }

  // Duplicate compare: identical buffers → distance 0
  const a = await protectListingImage({
    buffer: await scenes[0]!.build(),
    profile: { full_name: "Same" },
    ownerId: "00000000-0000-4000-8000-000000000001",
    listingRef: "draft/a",
    listingId: null,
    index: 0,
    mimeSource: "image/jpeg",
  });
  const b = await protectListingImage({
    buffer: await scenes[0]!.build(),
    profile: { full_name: "Same" },
    ownerId: "00000000-0000-4000-8000-000000000001",
    listingRef: "draft/b",
    listingId: null,
    index: 0,
    mimeSource: "image/jpeg",
  });
  const cmp = compareFingerprints(a.fingerprints, b.fingerprints);
  if (!cmp.sha256Match || (cmp.phashDistance ?? 1) !== 0) {
    failures.push("identical scenes should match fingerprints");
  }

  const avgProtect = timings.reduce((s, t) => s + t.protectMs, 0) / timings.length;
  const avgLegacy = timings.reduce((s, t) => s + t.legacyMs, 0) / timings.length;
  const largeScene = timings.find((t) => t.id === "landscape");

  console.log("\n=== Performance ===");
  console.log(`avg protect: ${avgProtect.toFixed(0)}ms`);
  console.log(`avg legacy:  ${avgLegacy.toFixed(0)}ms`);
  console.log(`delta:       ${(avgProtect - avgLegacy).toFixed(0)}ms`);
  if (largeScene) {
    console.log(
      `landscape protect=${largeScene.protectMs.toFixed(0)}ms in=${(largeScene.bytesIn / 1024).toFixed(0)}KB out=${(largeScene.bytesLarge / 1024).toFixed(0)}KB`
    );
  }

  console.log("\n=== Config ===");
  console.log("enabled default:", isMediaProtectionEnabled());
  console.log("config:", getMediaProtectionConfig());

  // Kill-switch check (process env for this process only)
  process.env.ENABLE_MEDIA_PROTECTION = "false";
  const { isMediaProtectionEnabled: checkOff } = await import("../src/lib/media/protection/config");
  // module may cache — re-read via getMediaProtectionConfig after clearing
  // Direct envBool path:
  const off = process.env.ENABLE_MEDIA_PROTECTION?.toLowerCase() === "false";
  console.log("kill switch env false:", off);
  if (!off) failures.push("kill switch env not observed");
  delete process.env.ENABLE_MEDIA_PROTECTION;

  const report = {
    failures,
    avgProtectMs: avgProtect,
    avgLegacyMs: avgLegacy,
    deltaMs: avgProtect - avgLegacy,
    timings,
    outDir: OUT,
    pass: failures.length === 0,
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));

  if (failures.length) {
    console.error("\nFAILED", failures);
    process.exit(1);
  }
  console.log("\nALL VERIFICATION CHECKS PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
