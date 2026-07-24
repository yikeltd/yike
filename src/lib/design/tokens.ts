/** Yike.ng design tokens — locked brand palette + 2026 hierarchy system */
export const colors = {
  navy: "#031B4E",
  navyDark: "#021428",
  navyLight: "#0a2d6e",
  gold: "#E4B547",
  goldDark: "#c99a2e",
  goldLight: "#f5d878",
  white: "#ffffff",
  ivory: "#FCFBF7",
  sand: "#FAF7F2",
  warmNeutral: "#F7F5F2",
  warmStone: "#F3EFE8",
  surface: "#F7F5F2",
  surfaceDark: "#0c2347",
  muted: "#64748b",
  danger: "#dc2626",
  /** Semantic badge / status colors — not all gold */
  emerald: "#059669",
  emeraldSoft: "#ecfdf5",
  purple: "#7c3aed",
  purpleSoft: "#f5f3ff",
  sky: "#0284c7",
  skySoft: "#f0f9ff",
  orange: "#ea580c",
  orangeSoft: "#fff7ed",
  slate: "#475569",
  slateSoft: "#f1f5f9",
} as const;

export const radii = {
  /** 20px — default premium cards / tiles */
  card: "1.25rem",
  /** 24px — detail heroes, floating bars */
  cardLg: "1.5rem",
  tile: "1.125rem",
  pill: "9999px",
} as const;

export const shadows = {
  card: "0 1px 2px rgba(3, 27, 78, 0.04), 0 8px 24px -10px rgba(3, 27, 78, 0.12)",
  cardHover:
    "0 2px 4px rgba(3, 27, 78, 0.05), 0 16px 36px -12px rgba(3, 27, 78, 0.18)",
  hero: "0 4px 6px rgba(3, 27, 78, 0.04), 0 20px 48px -16px rgba(3, 27, 78, 0.22)",
  floatBar:
    "0 8px 32px rgba(3, 27, 78, 0.12), 0 2px 8px rgba(3, 27, 78, 0.06), 0 0 0 1px rgba(3, 27, 78, 0.04)",
} as const;

export const brand = {
  name: "Yike",
  domain: "yike.ng",
  tagline: "Nigeria's trusted marketplace for property and vehicles.",
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

/** Semantic listing badge variants (presentation only). */
export const badgeSemantics = {
  verified: { bg: colors.emeraldSoft, fg: colors.emerald, ring: "rgba(5,150,105,0.25)" },
  featured: { bg: colors.gold, fg: colors.navy, ring: "rgba(228,181,71,0.35)" },
  premium: { bg: colors.purpleSoft, fg: colors.purple, ring: "rgba(124,58,237,0.25)" },
  new: { bg: colors.skySoft, fg: colors.sky, ring: "rgba(2,132,199,0.25)" },
  negotiable: { bg: colors.orangeSoft, fg: colors.orange, ring: "rgba(234,88,12,0.25)" },
  sold: { bg: colors.slateSoft, fg: colors.slate, ring: "rgba(71,85,105,0.25)" },
} as const;
