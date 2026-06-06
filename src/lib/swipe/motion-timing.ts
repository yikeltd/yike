const PACE_KEY = "yike_swipe_pace";
const DWELL_KEY = "yike_card_dwell";
const PACE_SAMPLES = 8;
const DWELL_SAMPLES = 6;

/** Track swipe gaps — faster swipers get snappier photo transitions. */
export function recordSwipePace() {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.parse(localStorage.getItem(PACE_KEY) ?? "[]") as number[];
    const now = Date.now();
    const last = raw[0];
    const next = last ? [now, now - last, ...raw.slice(1)] : [now];
    localStorage.setItem(PACE_KEY, JSON.stringify(next.slice(0, PACE_SAMPLES + 1)));
  } catch {
    /* ignore */
  }
}

export function getSwipePaceMs(): number {
  if (typeof window === "undefined") return 2800;
  try {
    const samples = JSON.parse(localStorage.getItem(PACE_KEY) ?? "[]") as number[];
    const gaps = samples.slice(1).filter((g) => g > 400 && g < 120_000);
    if (gaps.length < 2) return 2800;
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avg < 2500) return 2000;
    if (avg > 6000) return 3500;
    return 2800;
  } catch {
    return 2800;
  }
}

/** Time spent on a card before swiping — longer dwell slows photo pacing slightly. */
export function recordCardDwell(ms: number) {
  if (typeof window === "undefined" || ms < 400) return;
  try {
    const prev = JSON.parse(localStorage.getItem(DWELL_KEY) ?? "[]") as number[];
    localStorage.setItem(
      DWELL_KEY,
      JSON.stringify([ms, ...prev].slice(0, DWELL_SAMPLES))
    );
  } catch {
    /* ignore */
  }
}

function getAverageCardDwell(): number {
  if (typeof window === "undefined") return 4000;
  try {
    const samples = JSON.parse(localStorage.getItem(DWELL_KEY) ?? "[]") as number[];
    if (samples.length === 0) return 4000;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  } catch {
    return 4000;
  }
}

/**
 * Adaptive duration per photo:
 * - 3 images → ~4s each
 * - 12+ images → ~2s each
 * - Fast swipers → shorter; long dwell → slightly longer
 */
export function getSlideDurationMs(imageCount: number, paceMs?: number): number {
  const pace = paceMs ?? getSwipePaceMs();
  const dwell = getAverageCardDwell();

  let base: number;
  if (imageCount <= 3) base = 4000;
  else if (imageCount <= 6) base = 3000;
  else if (imageCount <= 9) base = 2600;
  else base = 2000;

  if (pace <= 2100) base = Math.max(1800, base - 600);
  else if (pace >= 3200) base = Math.min(4500, base + 400);

  if (dwell > 9000) base = Math.min(5000, base + 500);
  else if (dwell < 2500) base = Math.max(1600, base - 300);

  return base;
}
