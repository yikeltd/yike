"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";
import { formatMemberSince } from "@/lib/home/discovery-from-pool";

/** Verified dealers / sellers derived from existing listing embeds. */
export function DealerDiscoveryRow({
  dealers,
  className,
  title = "Verified Dealers",
  subtitle = "Trusted sellers with live inventory on Yike",
}: {
  dealers: DiscoveryDealerCard[];
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  if (dealers.length === 0) return null;

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
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dealers.map((d) => {
          const since = formatMemberSince(d.memberSince);
          return (
            <li key={d.id} className="shrink-0">
              <Link
                href={d.href}
                className="pressable group flex w-[11.5rem] flex-col rounded-2xl border border-navy/10 bg-gradient-to-b from-white to-[#f4f6fa] p-3.5 shadow-[0_10px_28px_-20px_rgba(3,27,78,0.4)] transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_16px_32px_-18px_rgba(3,27,78,0.45)] sm:w-[12.5rem]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy text-gold">
                    {d.avatarUrl ? (
                      <Image
                        src={d.avatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <Store className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-bold text-navy">
                      {d.name}
                    </span>
                    {d.verified ? (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                        {d.isDealer ? "Verified Dealer" : "Verified Seller"}
                      </span>
                    ) : null}
                  </span>
                </div>
                {d.location ? (
                  <p className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-navy/50">
                    <MapPin className="h-3 w-3 shrink-0 text-gold" aria-hidden />
                    <span className="line-clamp-1">{d.location}</span>
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] font-semibold text-navy/55">
                  {d.listingCount} listing{d.listingCount === 1 ? "" : "s"}
                  {since ? ` · Since ${since}` : ""}
                </p>
                <span className="mt-3 inline-flex text-xs font-bold text-navy transition group-hover:text-gold-dark">
                  View store →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
