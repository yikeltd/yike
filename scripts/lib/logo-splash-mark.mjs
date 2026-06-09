import sharp from "sharp";

/** Splash / TWA canvas — matches themeColor #031B4E */
export const SPLASH_NAVY = { r: 3, g: 27, b: 78, alpha: 255 };

/** Transparent resize background for compositing onto navy splash. */
export const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Return PNG buffer of the logo mark with baked-in dark navy square removed,
 * so it blends cleanly on #031B4E splash screens.
 */
export async function logoMarkPngBuffer(source, size) {
  const { data, info } = await sharp(source)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isSplashBackgroundPixel(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Dark navy / near-black pixels from logo.webp canvas — not gold mark or light tones. */
function isSplashBackgroundPixel(r, g, b) {
  if (r > 120 && g > 90) return false;
  if (r > 80 && g > 80 && b > 80) return false;
  const nearTheme = Math.hypot(r - SPLASH_NAVY.r, g - SPLASH_NAVY.g, b - SPLASH_NAVY.b);
  const nearEdge = Math.hypot(r - 4, g - 12, b - 22);
  return r < 35 && g < 60 && b < 105 && (nearTheme < 55 || nearEdge < 40);
}

/** Square TWA splash PNG — navy canvas + centred transparent logo mark. */
export async function writeTwaSplashImage(source, outPath, size) {
  const logoPx = Math.round(size * 0.52);
  const logo = await logoMarkPngBuffer(source, logoPx);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SPLASH_NAVY,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}
