#!/usr/bin/env node
/** Generate native TWA splash PNGs — navy + centred logo (matches web boot splash). */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeTwaSplashImage } from "./lib/logo-splash-mark.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(ROOT, "public/images/logo.webp");
const resRoot = path.join(ROOT, "twa/app/src/main/res");

const targets = [
  ["drawable-mdpi/splash.png", 320],
  ["drawable-hdpi/splash.png", 480],
  ["drawable-xhdpi/splash.png", 720],
  ["drawable-xxhdpi/splash.png", 960],
  ["drawable-xxxhdpi/splash.png", 1280],
];

await Promise.all(
  targets.map(([rel, size]) => writeTwaSplashImage(source, path.join(resRoot, rel), size))
);

console.log("TWA native splash drawables updated.");
