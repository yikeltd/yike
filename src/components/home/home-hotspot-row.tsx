import {
  getAdminHotPicks,
  getHottestListings,
} from "@/lib/home-hot-picks";
import {
  propertiesToHotPicks,
  withCuratedHomeFallback,
} from "@/lib/mock-listings";
import { HomeHotPicksCarousel } from "./home-hot-picks-carousel";

export async function HomeHotPicksSections() {
  let hottest: Awaited<ReturnType<typeof getHottestListings>> = [];
  let adminPicks: Awaited<ReturnType<typeof getAdminHotPicks>> = [];

  try {
    [hottest, adminPicks] = await Promise.all([
      getHottestListings(10),
      getAdminHotPicks(10),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[home] hot picks unavailable", message);
  }

  const liveCount = new Set([
    ...hottest.map((p) => p.property.id),
    ...adminPicks.map((p) => p.property.id),
  ]).size;

  if (liveCount < 4) {
    const liveProperties = [
      ...hottest.map((p) => p.property),
      ...adminPicks.map((p) => p.property),
    ];
    const { items } = withCuratedHomeFallback(liveProperties, {
      minCount: 8,
      limit: 10,
    });
    const picks = propertiesToHotPicks(items, "Sample listing");
    return (
      <HomeHotPicksCarousel
        picks={picks}
        title="Featured homes across Nigeria"
        subtitle="Browse rent, buy, land and shops — no sign-in needed"
      />
    );
  }

  return (
    <>
      {hottest.length > 0 && (
        <HomeHotPicksCarousel
          picks={hottest}
          title="Hottest listings"
          subtitle="Most viewed right now"
        />
      )}
      {adminPicks.length > 0 && (
        <HomeHotPicksCarousel
          picks={adminPicks}
          title="Featured by Yike"
          subtitle="Hand-selected verified listings"
        />
      )}
    </>
  );
}

/** @deprecated use HomeHotPicksSections */
export async function HomeHotspotRow() {
  return <HomeHotPicksSections />;
}
