import Link from "next/link";
import { cn } from "@/lib/utils";

export type CityBrowseItem = {
  id: string;
  label: string;
  href: string;
  /** Real listing count only — never invent. */
  count?: number;
  /** Lagos / Abuja / Port Harcourt — stronger weight. */
  priority?: boolean;
};

export const VEHICLE_CITY_BROWSE: CityBrowseItem[] = [
  { id: "lagos", label: "Lagos", href: "/vehicles?state=Lagos", priority: true },
  { id: "abuja", label: "Abuja", href: "/vehicles?state=FCT", priority: true },
  {
    id: "ph",
    label: "Port Harcourt",
    href: "/vehicles?state=Rivers",
    priority: true,
  },
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
  { id: "lagos", label: "Lagos", href: "/houses/lagos", priority: true },
  { id: "abuja", label: "Abuja", href: "/houses/abuja", priority: true },
  {
    id: "ph",
    label: "Port Harcourt",
    href: "/houses/port-harcourt",
    priority: true,
  },
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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * Compact city chips — fintech density, not dashboard cards.
 * Homepage should prefer inventory rails; use this in search/empty states.
 */
export function CityBrowseGrid({
  items,
  className,
  title = "Popular cities",
  subtitle,
  viewAllHref,
}: {
  items: readonly CityBrowseItem[];
  className?: string;
  title?: string;
  /** Omit for a quieter, denser block. */
  subtitle?: string | null;
  viewAllHref?: string;
}) {
  const priority = items.filter((c) => c.priority);
  const rest = items.filter((c) => !c.priority);
  const allHref =
    viewAllHref ??
    (items[0]?.href.startsWith("/vehicles") ? "/vehicles" : "/search");

  return (
    <section className={cn("space-y-2.5", className)} aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy/45">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs font-medium text-navy/40">{subtitle}</p>
          ) : null}
        </div>
        <Link
          href={allHref}
          className="pressable shrink-0 text-xs font-bold text-navy/55 transition hover:text-navy"
        >
          View all
          <span aria-hidden> →</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {priority.map((city) => (
          <CityChip key={city.id} city={city} emphasis />
        ))}
      </div>

      {rest.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {rest.map((city) => (
            <CityChip key={city.id} city={city} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CityChip({
  city,
  emphasis = false,
}: {
  city: CityBrowseItem;
  emphasis?: boolean;
}) {
  const hasCount = typeof city.count === "number" && city.count > 0;

  return (
    <Link
      href={city.href}
      className={cn(
        "pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200",
        "active:scale-[0.98] hover:-translate-y-px",
        emphasis
          ? "border-navy/14 bg-navy text-white shadow-[0_1px_2px_rgba(2,20,51,0.12)] hover:border-navy/20 hover:bg-[#04245f]"
          : "border-navy/[0.08] bg-white text-navy/75 shadow-[0_1px_0_rgba(2,20,51,0.04)] hover:border-gold/35 hover:text-navy hover:shadow-[0_2px_8px_rgba(2,20,51,0.06)]",
      )}
    >
      <span>{city.label}</span>
      {hasCount ? (
        <span
          className={cn(
            "tabular-nums text-[10px] font-bold",
            emphasis ? "text-white/70" : "text-navy/40",
          )}
        >
          {formatCount(city.count!)}
        </span>
      ) : null}
    </Link>
  );
}
