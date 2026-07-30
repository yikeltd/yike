/**
 * PHASE 1.1 — RESPONSIVE & ADAPTIVE ONBOARDING DESIGN SYSTEM TOKENS
 * Enforces fluid breakpoints, 8px spacing grid, touch targets, and WebP asset mappings.
 */

export const ONBOARDING_BREAKPOINTS = {
  mobileMin: 320,
  mobile: 360,
  mobileLarge: 375,
  mobileXl: 390,
  mobile2Xl: 412,
  mobileMax: 430,
  tablet: 768,
  tabletLandscape: 1024,
  laptop: 1280,
  desktop: 1440,
  desktopLarge: 1728,
} as const;

/**
 * Strict 8px Spacing Tokens
 */
export const SPACING_TOKENS = {
  8: "p-2 gap-2 space-y-2 m-2",
  12: "p-3 gap-3 space-y-3 m-3",
  16: "p-4 gap-4 space-y-4 m-4",
  20: "p-5 gap-5 space-y-5 m-5",
  24: "p-6 gap-6 space-y-6 m-6",
  32: "p-8 gap-8 space-y-8 m-8",
  40: "p-10 gap-10 space-y-10 m-10",
  48: "p-12 gap-12 space-y-12 m-12",
  64: "p-16 gap-16 space-y-16 m-16",
} as const;

/**
 * Responsive Card Grid System:
 * Mobile (320-430px): 2 columns
 * Tablet (768-1024px): 3 columns
 * Desktop (1280px+): 4 columns
 */
export const ONBOARDING_CARD_GRID_CLASS =
  "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6";

/**
 * Responsive Form Grid System:
 * Mobile: 1 column
 * Tablet/Desktop: 2 columns
 */
export const ONBOARDING_FORM_GRID_CLASS =
  "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6";

/**
 * Container Constraints:
 * Centered, max-width 1280px on desktop
 */
export const ONBOARDING_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8";

/**
 * Fluid Typography Scale
 */
export const ONBOARDING_TYPOGRAPHY = {
  title: "text-2xl md:text-[28px] lg:text-4xl font-black text-[#031B4E] tracking-tight leading-tight",
  subtitle: "text-sm md:text-base font-medium text-slate-500 leading-relaxed",
  sectionHeading: "text-lg md:text-xl font-extrabold text-[#031B4E] tracking-tight",
  label: "text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide",
  body: "text-sm md:text-base text-slate-700 font-normal leading-normal",
} as const;

/**
 * WebP Asset Resolver for Onboarding
 */
export function getOnboardingAssetUrl(
  category: "cars" | "props",
  filename: string,
  useFallbackPng = false
): string {
  const cleanName = filename.replace(/\.(png|webp)$/i, "");
  const extension = useFallbackPng ? "png" : "webp";
  return `/assets/onboarding/${category}/${cleanName}.${extension}`;
}
