import type { DiscoverHub } from "@/types/database";
import {
  GraduationCap,
  Palmtree,
  Wallet,
  MapPin,
  KeyRound,
  Home,
} from "lucide-react";

const HUB_COPY: Record<
  DiscoverHub,
  { title: string; desc: string; icon: typeof GraduationCap }
> = {
  student: {
    title: "Student housing",
    desc: "Near campus · self contains · budget-friendly",
    icon: GraduationCap,
  },
  affordable: {
    title: "Affordable rent",
    desc: "Homes under ₦800k/year and budget neighbourhoods",
    icon: Wallet,
  },
  shortlet: {
    title: "Shortlets",
    desc: "Furnished nightly stays across Nigeria",
    icon: Palmtree,
  },
  land_sale: {
    title: "Land for sale",
    desc: "Residential, commercial and farm plots nationwide",
    icon: MapPin,
  },
  land_lease: {
    title: "Land for lease",
    desc: "Long-term land lease — confirm title and survey",
    icon: KeyRound,
  },
  buy: {
    title: "Homes for sale",
    desc: "Houses, flats and commercial property to buy",
    icon: Home,
  },
  lease: {
    title: "Property lease",
    desc: "Commercial spaces and long-term property lease",
    icon: KeyRound,
  },
};

export function SearchHubBanner({ hub }: { hub: DiscoverHub }) {
  const copy = HUB_COPY[hub];
  if (!copy) return null;
  const Icon = copy.icon;

  return (
    <div className="mx-3 mb-4 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-float ring-1 ring-gold/20 lg:mx-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
        <Icon className="h-5 w-5 text-gold-dark" strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-sm font-bold text-navy">{copy.title}</p>
        <p className="mt-0.5 text-xs text-muted">{copy.desc}</p>
      </div>
    </div>
  );
}
