import type { DiscoverHub } from "@/types/database";
import { GraduationCap, Palmtree, Wallet } from "lucide-react";

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
