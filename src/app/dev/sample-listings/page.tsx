import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allShowcaseDetailPaths,
  SAMPLE_DETAIL_SHOWCASE,
  sampleDetailPath,
} from "@/lib/sample-listings/showcase";
import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";

export const metadata = {
  title: "Sample listings (local) | Yike Dev",
  robots: { index: false, follow: false },
};

export default function DevSampleListingsIndexPage() {
  if (!isSampleListingFixtureEnabled()) {
    notFound();
  }

  const rows = (
    [
      ["Property", "property"],
      ["Vehicles", "vehicle"],
      ["Electronics", "electronics"],
    ] as const
  ).map(([label, vertical]) => ({
    label,
    vertical,
    withReviews: sampleDetailPath(vertical, "withReviews"),
    emptyReviews: sampleDetailPath(vertical, "emptyReviews"),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
        Local only
      </p>
      <h1 className="mt-1 text-2xl font-black text-navy">Sample listing detail QA</h1>
      <p className="mt-2 text-sm text-navy/70">
        Handcrafted fixtures for seller panel and specifications grid verification. Not
        available in production.
      </p>

      <ul className="mt-8 space-y-6">
        {rows.map((row) => (
          <li
            key={row.vertical}
            className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-bold text-navy">{row.label}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href={row.withReviews}
                className="block font-semibold text-navy hover:underline"
              >
                With reviews → {row.withReviews}
              </Link>
              <Link
                href={row.emptyReviews}
                className="block font-semibold text-navy/70 hover:underline"
              >
                Empty reviews → {row.emptyReviews}
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-navy/50">
        Showcase slugs: {JSON.stringify(SAMPLE_DETAIL_SHOWCASE)} ·{" "}
        {allShowcaseDetailPaths().length} routes
      </p>
    </main>
  );
}
