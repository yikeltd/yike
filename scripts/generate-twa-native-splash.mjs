#!/usr/bin/env node
/** Generate native TWA splash PNGs — full branded artwork (matches web boot splash). */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(ROOT, "public/splash/splash-1080x1920.png");
const resRoot = path.join(ROOT, "twa/app/src/main/res");

const targets = [
  ["drawable-mdpi/splash.png", 320],
  ["drawable-hdpi/splash.png", 480],
  ["drawable-xhdpi/splash.png", 720],
  ["drawable-xxhdpi/splash.png", 960],
  ["drawable-xxxhdpi/splash.png", 1280],
];

await Promise.all(
  targets.map(([rel, size]) =>
    sharp(source)
      .resize(size, size, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(resRoot, rel))
  )
);

console.log("TWA native splash drawables updated.");
