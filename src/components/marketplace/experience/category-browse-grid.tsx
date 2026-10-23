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
  Tractor,
  HardHat,
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
    id: "pickup_van",
    label: "Pickups & vans",
    description: "Hilux, Ranger and more",
    href: "/vehicles?category=pickup_van",
    icon: Truck,
    countKey: "pickup_van",
  },
  {
    id: "commercial_truck",
    label: "Commercial trucks",
    description: "Trailers and haulage",
    href: "/vehicles?category=commercial_truck",
    icon: Truck,
    countKey: "commercial_truck",
  },
  {
    id: "bus_minibus",
    label: "Buses",
    description: "Coaster and minibuses",
    href: "/vehicles?category=bus_minibus",
    icon: Truck,
    countKey: "bus_minibus",
  },
  {
    id: "motorcycle_tricycle",
    label: "Bikes & keke",
    description: "Motorcycles and tricycles",
    href: "/vehicles?category=motorcycle_tricycle",
    icon: Bike,
    countKey: "motorcycle_tricycle",
  },
  {
    id: "excavator",
    label: "Excavators",
    description: "Construction earthmovers",
    href: "/vehicles?category=excavator",
    icon: HardHat,
    countKey: "excavator",
  },
  {
    id: "tractor",
    label: "Tractors",
    description: "Farm and ag machinery",
    href: "/vehicles?category=tractor",
    icon: Tractor,
    countKey: "tractor",
  },
  {
    id: "heavy",
    label: "All heavy equipment",
    description: "Cranes, loaders and more",
    href: "/vehicles?group=heavy",
    icon: HardHat,
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
  },
  {
    id: "houses",
    label: "Houses",
    description: "Detached homes and duplexes",
    href: "/search?property_type=detached_duplex",
    icon: Home,
  },
  {
    id: "land",
    label: "Land",
    description: "Plots and acreage",
    href: "/search?hub=land_sale",
    icon: LandPlot,
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Shops, offices and warehouses",
    href: "/search?property_type=shop",
    icon: Warehouse,
  },
  {
    id: "shortlet",
    label: "Short let",
    description: "Serviced stays",
    href: "/shortlet",
    icon: Hotel,
  },
];

export function CategoryBrowseGrid({
  items,
  counts,
  className,
}: {
  items: readonly CategoryBrowseItem[];
  counts?: Record<string, number>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const count =
          item.countKey && counts ? counts[item.countKey] : undefined;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="pressable flex flex-col gap-1 rounded-2xl border border-navy/8 bg-white p-3 shadow-sm transition hover:border-gold/35 hover:shadow-md"
          >
            <Icon className="h-5 w-5 text-gold" aria-hidden />
            <span className="text-sm font-bold text-navy">{item.label}</span>
            <span className="line-clamp-2 text-[11px] leading-snug text-muted">
              {item.description}
            </span>
            {count != null && count > 0 ? (
              <span className="text-[10px] font-bold text-navy/50">{count} listings</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
