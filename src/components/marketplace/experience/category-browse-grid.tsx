import Link from "next/link";
import {
  Car,
  Truck,
  Gem,
  Bike,
  Ship,
  Building2,
  Home,
  LandPlot,
  Warehouse,
  Hotel,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryBrowseItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Count key used to look up live inventory counts (optional). */
  countKey?: string;
};

export const VEHICLE_CATEGORY_BROWSE: CategoryBrowseItem[] = [
  {
    id: "car",
    label: "Cars",
    description: "Sedans, hatchbacks and coupes",
    href: "/vehicles?category=car",
    icon: Car,
    countKey: "car",
  },
  {
    id: "suv",
    label: "SUVs",
    description: "Family and luxury SUVs",
    href: "/vehicles?category=suv",
    icon: Car,
    countKey: "suv",
  },
  {
    id: "luxury",
    label: "Luxury",
    description: "Premium marques",
    href: "/vehicles?make=Mercedes-Benz",
    icon: Gem,
  },
  {
    id: "truck",
    label: "Pickups",
    description: "Hilux, Ranger and more",
    href: "/vehicles?category=truck",
    icon: Truck,
    countKey: "truck",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Vans and work vehicles",
    href: "/vehicles?category=commercial",
    icon: Truck,
    countKey: "commercial",
  },
  {
    id: "motorcycle",
    label: "Motorcycles",
    description: "Bikes and scooters",
    href: "/vehicles?category=motorcycle",
    icon: Bike,
    countKey: "motorcycle",
  },
  {
    id: "boat",
    label: "Boats",
    description: "Marine listings",
    href: "/vehicles?category=boat",
    icon: Ship,
    countKey: "boat",
  },
];

export const PROPERTY_CATEGORY_BROWSE: CategoryBrowseItem[] = [
  {
    id: "apartments",
    label: "Apartments",
    description: "Flats and mini flats",
    href: "/search?property_type=flat_2",
    icon: Building2,
    countKey: "flat_2",
  },
  {
    id: "duplex",
    label: "Duplexes",
    description: "Terrace and detached",
    href: "/search?property_type=detached_duplex",
    icon: Home,
    countKey: "detached_duplex",
  },
  {
    id: "land",
    label: "Land",
    description: "Plots and estates",
    href: "/land",
    icon: LandPlot,
    countKey: "land",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Shops and offices",
    href: "/search?property_type=shop",
    icon: Building2,
    countKey: "shop",
  },
  {
    id: "warehouse",
    label: "Warehouses",
    description: "Storage and logistics",
    href: "/search?property_type=warehouse",
    icon: Warehouse,
    countKey: "warehouse",
  },
  {
    id: "shortlet",
    label: "Short Lets",
    description: "Nightly stays",
    href: "/shortlet",
    icon: Hotel,
  },
];

function formatCount(n: number | undefined): string | null {
  if (n == null || n <= 0) return null;
  return `${n.toLocaleString("en-NG")} available`;
}

/** Browse-first category cards — link to existing filtered routes. */
export function CategoryBrowseGrid({
  items,
  className,
  counts,
}: {
  items: CategoryBrowseItem[];
  className?: string;
  /** Live counts from current inventory pool — never invent numbers. */
  counts?: Record<string, number>;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const countLabel =
          item.countKey && counts
            ? formatCount(counts[item.countKey])
            : null;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="pressable group flex h-full items-start gap-3 rounded-2xl border border-navy/10 bg-gradient-to-b from-white to-[#f5f7fb] p-3.5 shadow-[0_8px_24px_-18px_rgba(3,27,78,0.35)] transition duration-200 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_16px_32px_-16px_rgba(3,27,78,0.42)] active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold transition duration-200 group-hover:scale-105 group-hover:bg-navy-light">
                <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </span>
                  <span className="min-w-0 pt-0.5">
                <span className="block text-sm font-bold text-navy">
                  {item.label}
                </span>
                {countLabel ? (
                  <span className="mt-0.5 block text-[11px] font-bold tabular-nums text-navy/55">
                    {countLabel}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
