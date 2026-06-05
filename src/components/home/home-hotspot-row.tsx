import { getHomeHotPicks } from "@/lib/home-hot-picks";
import { HomeHotPicksCarousel } from "./home-hot-picks-carousel";

export async function HomeHotspotRow({ onHero }: { onHero?: boolean }) {
  const picks = await getHomeHotPicks(12);
  if (picks.length === 0) return null;

  return <HomeHotPicksCarousel picks={picks} onHero={onHero} />;
}
