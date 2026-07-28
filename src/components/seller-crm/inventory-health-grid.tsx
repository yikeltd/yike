"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { InventoryHealth } from "@/lib/seller-crm/types";
import { formatPrice } from "@/lib/utils";

export function InventoryHealthGrid({
  inventoryList,
}: {
  inventoryList: InventoryHealth[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inventoryList.map((item) => (
          <div
            key={item.listingId}
            className="flex flex-col justify-between rounded-3xl border border-navy/10 bg-white p-5 shadow-sm transition-all hover:border-gold/50"
          >
            <div>
              {/* Listing Thumbnail & Title */}
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-2xl border border-navy/10 bg-navy/5">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.listingTitle} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-navy/30 text-xs">
                      Yike
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy line-clamp-2">{item.listingTitle}</h4>
                  <p className="mt-0.5 text-xs font-black text-navy">{formatPrice(item.price, "total", "rent")}</p>
                </div>
              </div>

              {/* Metric Counters */}
              <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl border border-navy/10 bg-surface p-2.5 text-center text-[10px]">
                <div>
                  <p className="font-semibold text-navy/50">Views</p>
                  <p className="font-bold text-navy">{item.viewsCount}</p>
                </div>
                <div>
                  <p className="font-semibold text-navy/50">Leads</p>
                  <p className="font-bold text-navy">{item.conversationsCount}</p>
                </div>
                <div>
                  <p className="font-semibold text-navy/50">Offers</p>
                  <p className="font-bold text-navy">{item.offersCount}</p>
                </div>
                <div>
                  <p className="font-semibold text-navy/50">DOM</p>
                  <p className="font-bold text-navy">{item.daysOnMarket}d</p>
                </div>
              </div>

              {/* Rule-Based Recommendations */}
              {item.recommendations.length > 0 && (
                <div className="mt-3 space-y-2">
                  {item.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-xs text-navy"
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="h-3.5 w-3.5 text-gold-dark" />
                        <span>{rec.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-navy/80 leading-snug">{rec.description}</p>
                      <Link
                        href={rec.actionTarget}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[10px] font-bold text-navy shadow-xs hover:bg-gold-light"
                      >
                        <span>{rec.actionLabel}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
