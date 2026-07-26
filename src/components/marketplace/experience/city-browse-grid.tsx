import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type CityBrowseItem = {
  id: string;
  label: string;
  href: string;
};

export const VEHICLE_CITY_BROWSE: CityBrowseItem[] = [
  { id: "lagos", label: "Lagos", href: "/vehicles?state=Lagos" },
  { id: "abuja", label: "Abuja", href: "/vehicles?state=FCT" },
  { id: "ph", label: "Port Harcourt", href: "/vehicles?state=Rivers" },
  { id: "enugu", label: "Enugu", href: "/vehicles?state=Enugu" },
  { id: "ibadan", label: "Ibadan", href: "/vehicles?state=Oyo" },
  { id: "benin", label: "Benin", href: "/vehicles?state=Edo" },
  { id: "owerri", label: "Owerri", href: "/vehicles?city=Owerri" },
  { id: "kano", label: "Kano", href: "/vehicles?state=Kano" },
  { id: "kaduna", label: "Kaduna", href: "/vehicles?state=Kaduna" },
  { id: "aba", label: "Aba", href: "/vehicles?city=Aba" },
  { id: "asaba", label: "Asaba", href: "/vehicles?city=Asaba" },
  { id: "uyo", label: "Uyo", href: "/vehicles?city=Uyo" },
];

export const PROPERTY_CITY_BROWSE: CityBrowseItem[] = [
  { id: "lagos", label: "Lagos", href: "/houses/lagos" },
  { id: "abuja", label: "Abuja", href: "/houses/abuja" },
  { id: "ph", label: "Port Harcourt", href: "/houses/port-harcourt" },
  { id: "enugu", label: "Enugu", href: "/search?state=Enugu" },
  { id: "ibadan", label: "Ibadan", href: "/search?city=Ibadan" },
  { id: "benin", label: "Benin", href: "/search?city=Benin" },
  { id: "owerri", label: "Owerri", href: "/search?city=Owerri" },
  { id: "kano", label: "Kano", href: "/search?city=Kano" },
  { id: "kaduna", label: "Kaduna", href: "/search?city=Kaduna" },
  { id: "aba", label: "Aba", href: "/search?city=Aba" },
  { id: "asaba", label: "Asaba", href: "/search?city=Asaba" },
  { id: "uyo", label: "Uyo", href: "/search?city=Uyo" },
];

/** Browse-by-city discovery — existing filtered routes only. */
export function CityBrowseGrid({
  items,
  className,
  title = "Browse by City",
  subtitle = "Explore inventory across Nigeria",
}: {
  items: readonly CityBrowseItem[];
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-base font-bold tracking-tight text-navy sm:text-lg">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs font-medium text-navy/45">{subtitle}</p>
        ) : null}
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((city) => (
          <li key={city.id}>
            <Link
              href={city.href}
              className="pressable group flex flex-col items-center gap-1.5 rounded-2xl border border-navy/10 bg-gradient-to-b from-white to-[#f5f7fb] px-2 py-3.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/[0.06] text-navy transition group-hover:bg-gold/20">
                <MapPin className="h-4 w-4 text-gold" aria-hidden />
              </span>
              <span className="text-xs font-bold text-navy sm:text-[13px]">
                {city.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
