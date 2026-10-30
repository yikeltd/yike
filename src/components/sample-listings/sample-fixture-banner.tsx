/**
 * Dev sample catalog indicator — never shown on consumer UI.
 * Fixtures are gated by `isSampleListingFixtureEnabled()` (non-production + env flag).
 * Use server logs or Lex tooling to debug fixture mode; do not surface on yike.ng.
 */
export function SampleFixtureBanner(_props?: { active?: boolean }) {
  return null;
}

/** @deprecated Consumer routes must not render fixture banners. */
export function isPublicSampleFixtureBannerVisible(): boolean {
  return false;
}
