"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerTrustProgressItem } from "@/lib/seller-trust";

export function SellerTrustProgress({
  items,
  title = "Seller Verification",
}: {
  items: SellerTrustProgressItem[];
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-navy/60">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 text-sm",
              item.current ? "font-semibold text-navy" : "text-navy/70",
              item.done && !item.current && "text-navy/50"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                item.done
                  ? "bg-gold/20 text-gold-dark"
                  : item.current
                    ? "border border-gold text-gold-dark"
                    : "border border-navy/20 text-navy/40"
              )}
              aria-hidden
            >
              {item.done ? <Check className="h-3 w-3" strokeWidth={3} /> : "○"}
            </span>
            <span>{item.label}</span>
            {item.current ? (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-gold-dark">
                Now
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
