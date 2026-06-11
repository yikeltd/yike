import {
  getAdminHotPicks,
  getHottestListings,
} from "@/lib/home-hot-picks";
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

  if (hottest.length === 0 && adminPicks.length === 0) {
    return null;
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
