/**
 * Canonical local sample detail URLs for QA, Playwright, and /dev/sample-listings.
 * Slugs must exist in catalog.ts and resolve only outside production.
 */

export const SAMPLE_DETAIL_SHOWCASE = {
  property: {
    withReviews: "sample-duplex-sale-abuja-maitama",
    emptyReviews: "sample-residential-land-enugu",
  },
  vehicle: {
    withReviews: "sample-toyota-camry-2019-lagos",
    emptyReviews: "sample-bajaj-keke-abia",
  },
  electronics: {
    withReviews: "sample-samsung-galaxy-s24-lagos",
    emptyReviews: "sample-binatone-generator-lagos",
  },
} as const;

export type SampleVertical = keyof typeof SAMPLE_DETAIL_SHOWCASE;

export function sampleDetailPath(
  vertical: SampleVertical,
  variant: "withReviews" | "emptyReviews" = "withReviews",
): string {
  const slug = SAMPLE_DETAIL_SHOWCASE[vertical][variant];
  if (vertical === "property") return `/properties/${slug}`;
  if (vertical === "vehicle") return `/vehicles/${slug}`;
  return `/electronics/${slug}`;
}

export function allShowcaseDetailPaths(): string[] {
  const paths: string[] = [];
  for (const vertical of Object.keys(SAMPLE_DETAIL_SHOWCASE) as SampleVertical[]) {
    paths.push(sampleDetailPath(vertical, "withReviews"));
    paths.push(sampleDetailPath(vertical, "emptyReviews"));
  }
  return paths;
}
