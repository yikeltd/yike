/** Yike.ng design tokens — locked brand palette */
export const colors = {
  navy: "#031B4E",
  navyDark: "#021428",
  navyLight: "#0a2d6e",
  gold: "#E4B547",
  goldDark: "#c99a2e",
  goldLight: "#f5d878",
  white: "#ffffff",
  surface: "#f4f6f9",
  surfaceDark: "#0c2347",
  muted: "#64748b",
  danger: "#dc2626",
} as const;

export const brand = {
  name: "Yike",
  domain: "yike.ng",
  tagline: "The fastest and safest way to find real houses in Nigeria.",
  logo: "/images/logo.webp",
  logoSm: "/images/logo.webp",
  logoFallback: "/images/logo.webp",
} as const;

/** Yike Crew — internal ops app, using the same Yike mark for brand consistency. */
export const crewBrand = {
  name: "Yike Crew",
  shortName: "Yike Crew",
  logo: "/images/logo.webp",
  logoSm: "/images/logo.webp",
  icon192: "/images/logo-sm.webp",
  icon512: "/images/logo.webp",
  icon192Png: "/icons/android-chrome-192.png",
  icon512Png: "/icons/android-chrome-512.png",
} as const;
