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
  logoSm: "/images/logo-sm.webp",
  logoFallback: "/images/logo.png",
} as const;

/** Yike Crew — internal ops app (light-background mark from app-icon.webp) */
export const crewBrand = {
  name: "Yike Crew",
  shortName: "Crew",
  logo: "/images/crew-icon.webp",
  logoSm: "/images/crew-icon-sm.webp",
  icon192: "/staff/icons/crew-192.webp",
  icon512: "/staff/icons/crew-512.webp",
  icon192Png: "/staff/icons/crew-192.png",
  icon512Png: "/staff/icons/crew-512.png",
} as const;
