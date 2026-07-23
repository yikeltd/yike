/**
 * Netflix-style discovery density for browse listing grids.
 * Mobile 2 · Tablet 3–4 · Desktop 6–8 (never 3 oversized on large screens).
 */
export const BROWSE_GRID_COLS =
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8";

export const BROWSE_GRID_GAP = "gap-2 sm:gap-2.5 lg:gap-3";

export const BROWSE_GRID_CLASS = `grid ${BROWSE_GRID_COLS} ${BROWSE_GRID_GAP}`;

/**
 * Homepage rails: compact browse on mobile, larger premium cards on lg+.
 * Full class string (do not merge with BROWSE_GRID_CLASS — conflicting cols).
 */
export const HOME_RAIL_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5 2xl:grid-cols-5";

/**
 * Fixed poster ratio for all browse thumbnails (property + vehicle).
 * Slightly shorter than 4/5 so ~3–4 cards fit the first mobile viewport
 * while keeping a consistent inventory-rich grid.
 */
export const BROWSE_THUMB_ASPECT = "aspect-[4/3]";

/** Horizontal rail card width — ~2 cards visible on phone. */
export const BROWSE_RAIL_CARD_CLASS =
  "w-[min(46vw,168px)] shrink-0 snap-start sm:w-[180px] lg:w-auto";
