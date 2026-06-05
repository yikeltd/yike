import {
  getAdminHotPicks,
  getHottestListings,
} from "@/lib/home-hot-picks";
import { HomeHotPicksCarousel } from "./home-hot-picks-carousel";

export async function HomeHotPicksSections() {
  const [hottest, adminPicks] = await Promise.all([
    getHottestListings(10),
    getAdminHotPicks(10),
  ]);

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
          subtitle="Hand-picked by our team"
        />
      )}
    </>
  );
}

/** @deprecated use HomeHotPicksSections */
export async function HomeHotspotRow() {
  return <HomeHotPicksSections />;
}
