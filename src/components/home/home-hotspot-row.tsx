import { getHomeHotspots } from "@/lib/home-hotspots";
import { HomeSpotlightCard } from "./home-spotlight-card";

export async function HomeHotspotRow() {
  const hotspots = await getHomeHotspots();
  if (hotspots.length === 0) return null;

  return (
    <section className="mt-4 px-3 lg:mt-8 lg:px-0">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            Editor&apos;s picks
          </p>
          <h2 className="text-lg font-bold text-foreground lg:text-xl">
            Hottest listings right now
          </h2>
        </div>
      </div>
      <div className="hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0">
        {hotspots.map((hotspot, i) => (
          <HomeSpotlightCard
            key={hotspot.slot}
            hotspot={hotspot}
            priority={i === 0}
          />
        ))}
      </div>
    </section>
  );
}
