import Link from "next/link";
import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";

/** Home discovery rail for vehicles — empty state OK when 0 approved listings. */
export async function HomeVehiclesSection() {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) return null;

  let vehicles: Awaited<ReturnType<typeof queryPublicVehicles>> = [];
  try {
    const supabase = await createClient();
    if (supabase) {
      vehicles = await queryPublicVehicles(supabase, { limit: 6 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[home] vehicles rail unavailable", message);
  }

  return (
    <section
      className="mx-auto mt-6 max-w-7xl px-3 lg:mt-8 lg:px-6 xl:px-8"
      aria-label="Vehicles on Yike"
    >
      <div className="mb-4 flex items-end justify-between">
        <div className="border-l-[3px] border-gold pl-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            Vehicles
          </p>
          <h2 className="text-lg font-bold text-foreground lg:text-2xl">
            Cars &amp; rides
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Equal marketplace · Verified sellers · WhatsApp contact
          </p>
        </div>
        <Link
          href="/vehicles"
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          See all
        </Link>
      </div>

      {vehicles.length > 0 ? (
        <div className={BROWSE_GRID_CLASS}>
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-navy/15 bg-white px-5 py-8 shadow-sm ring-1 ring-black/[0.03] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
              <Car className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <p className="font-bold text-navy">Vehicles are live on Yike</p>
              <p className="mt-1 max-w-md text-sm text-muted">
                No approved vehicle listings yet. Browse the Vehicles hub or
                check back as sellers go live.
              </p>
            </div>
          </div>
          <Link
            href="/vehicles"
            className="pressable inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-navy px-5 text-sm font-bold text-white"
          >
            Open Vehicles
          </Link>
        </div>
      )}
    </section>
  );
}
