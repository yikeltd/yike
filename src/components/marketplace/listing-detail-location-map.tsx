import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function ListingDetailLocationMap({
  locationLabel,
  title = "Location & Neighborhood",
  className,
}: {
  locationLabel: string;
  title?: string;
  className?: string;
}) {
  if (!locationLabel.trim()) return null;

  return (
    <div
      className={cn(
        "rounded-3xl border border-navy/10 bg-white p-5 shadow-xl space-y-3 dark:border-white/10 dark:bg-navy",
        className,
      )}
      data-testid="listing-detail-location-map"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-gold" aria-hidden />
          {title}
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          Exact location disclosed after contact
        </span>
      </div>

      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-white/10">
        <Image
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&fit=crop"
          alt=""
          fill
          className="object-cover brightness-[0.8]"
        />
        <div className="absolute inset-0 bg-navy/20 backdrop-blur-[1px]" />
        <div className="relative z-10 text-center px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#031B4E] text-white px-4 py-2 text-xs font-black shadow-lg border border-gold/40">
            <MapPin className="h-4 w-4 text-gold" aria-hidden />
            {locationLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
