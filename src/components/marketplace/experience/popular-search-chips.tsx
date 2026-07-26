import Link from "next/link";
import { cn } from "@/lib/utils";

export type PopularSearchItem = {
  label: string;
  href: string;
};

export const VEHICLE_POPULAR_SEARCHES: PopularSearchItem[] = [
  { label: "Toyota", href: "/vehicles?make=Toyota" },
  { label: "Lexus", href: "/vehicles?make=Lexus" },
  { label: "Mercedes", href: "/vehicles?make=Mercedes-Benz" },
  { label: "Honda", href: "/vehicles?make=Honda" },
  { label: "Hyundai", href: "/vehicles?make=Hyundai" },
  { label: "Kia", href: "/vehicles?make=Kia" },
  { label: "Hilux", href: "/vehicles?q=Hilux" },
  { label: "Prado", href: "/vehicles?q=Prado" },
  { label: "Corolla", href: "/vehicles?q=Corolla" },
  { label: "SUV", href: "/vehicles?category=suv" },
  { label: "Pickup", href: "/vehicles?category=truck" },
  { label: "Truck", href: "/vehicles?category=commercial" },
];

export const PROPERTY_POPULAR_SEARCHES: PopularSearchItem[] = [
  { label: "Land", href: "/land" },
  { label: "Duplex", href: "/search?property_type=detached_duplex" },
  { label: "Apartment", href: "/search?property_type=flat_2" },
  { label: "Short Let", href: "/shortlet" },
  { label: "Commercial", href: "/search?property_type=shop" },
  { label: "Warehouse", href: "/search?property_type=warehouse" },
  { label: "Office", href: "/search?property_type=office" },
  { label: "For Rent", href: "/rent" },
  { label: "For Sale", href: "/buy" },
  { label: "Lagos", href: "/search?city=Lagos" },
  { label: "Abuja", href: "/search?city=Abuja" },
];

/** One-tap discovery chips — URL navigation only. */
export function PopularSearchChips({
  items,
  className,
  label = "Popular searches",
}: {
  items: PopularSearchItem[];
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
        {label}
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="pressable inline-flex shrink-0 items-center rounded-full border border-navy/10 bg-white px-3.5 py-2 text-xs font-bold text-navy shadow-sm transition duration-200 hover:-translate-y-px hover:border-gold/40 hover:shadow-md active:scale-[0.98]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
