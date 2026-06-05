import Link from "next/link";
import {
  GraduationCap,
  Palmtree,
  Wallet,
  ShieldCheck,
  Layers,
  MapPin,
  KeyRound,
  Home,
} from "lucide-react";

const HUBS = [
  {
    href: "/browse",
    label: "Swipe homes",
    desc: "Full-screen feed · nationwide",
    icon: Layers,
    accent: "bg-navy/10 text-navy",
  },
  {
    href: "/rent",
    label: "Rent",
    desc: "Flats, rooms & houses",
    icon: Home,
    accent: "bg-emerald-500/10 text-emerald-800",
  },
  {
    href: "/land",
    label: "Land for sale",
    desc: "Plots & acreage nationwide",
    icon: MapPin,
    accent: "bg-amber-500/10 text-amber-900",
  },
  {
    href: "/search?hub=land_lease",
    label: "Land lease",
    desc: "Long-term land agreements",
    icon: KeyRound,
    accent: "bg-orange-500/10 text-orange-900",
  },
  {
    href: "/buy",
    label: "Buy property",
    desc: "Houses & commercial sale",
    icon: Home,
    accent: "bg-violet-500/10 text-violet-900",
  },
  {
    href: "/search?type=lease",
    label: "Lease",
    desc: "Commercial & property lease",
    icon: KeyRound,
    accent: "bg-sky-500/10 text-sky-900",
  },
  {
    href: "/search?hub=student",
    label: "Student housing",
    desc: "Near campus · affordable",
    icon: GraduationCap,
    accent: "bg-blue-500/10 text-blue-700",
  },
  {
    href: "/shortlet",
    label: "Shortlets",
    desc: "Nightly stays · furnished",
    icon: Palmtree,
    accent: "bg-teal-500/10 text-teal-800",
  },
  {
    href: "/search?hub=affordable",
    label: "Affordable rent",
    desc: "Budget-friendly areas",
    icon: Wallet,
    accent: "bg-amber-500/10 text-amber-800",
  },
  {
    href: "/search?verified=1",
    label: "Verified only",
    desc: "Checked agents & listings",
    icon: ShieldCheck,
    accent: "bg-gold/15 text-gold-dark",
  },
] as const;

export function DiscoverHubs() {
  return (
    <section className="mt-6 px-3 lg:mt-10 lg:px-0">
      <h2 className="text-lg font-bold text-navy lg:text-2xl">Explore Nigeria</h2>
      <p className="mt-0.5 text-sm text-muted">
        Rent, buy, lease land, shortlets — one marketplace
      </p>
      <div className="hide-scrollbar -mx-3 mt-4 flex gap-3 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {HUBS.map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="pressable card-lift flex min-w-[9.5rem] shrink-0 flex-col rounded-2xl bg-elevated p-4 shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06] lg:min-w-[calc(20%-0.75rem)]"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${hub.accent}`}
            >
              <hub.icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <p className="mt-3 text-sm font-bold text-navy">{hub.label}</p>
            <p className="mt-0.5 text-xs text-muted">{hub.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
