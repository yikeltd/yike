"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ChevronRight,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerContactCardIdentity } from "@/lib/marketplace/seller-contact-card-props";
import { SellerContactReviewsPreview } from "@/components/marketplace/seller-contact-reviews-preview";

type Props = SellerContactCardIdentity & {
  className?: string;
  /** Listing detail pages — full profile + reviews chrome (no contact CTAs). */
  variant?: "default" | "listingDetail";
};

export function MarketplaceSellerContactCard({
  listingId: _listingId,
  assetType: _assetType,
  sellerId,
  sellerName,
  sellerAvatar,
  verified,
  roleLabel,
  trustScoreLabel,
  responseLabel,
  profileHref,
  className,
  variant = "default",
}: Props) {
  void _listingId;
  void _assetType;
  const isDetail = variant === "listingDetail";
  const showProfileNav = Boolean(profileHref?.startsWith("/agents/"));

  return (
    <article
      className={cn(
        "rounded-3xl border border-navy/10 bg-white shadow-[0_16px_48px_-20px_rgba(3,27,78,0.28)] ring-1 ring-navy/[0.04] dark:border-white/10 dark:bg-navy dark:ring-white/[0.06]",
        isDetail ? "p-5 sm:p-6" : "p-5 shadow-xl",
        className,
      )}
      data-testid="marketplace-seller-contact-card"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:gap-4">
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-gold/45 bg-[#031B4E] text-white shadow-[0_4px_14px_-4px_rgba(3,27,78,0.45)]",
              isDetail ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" : "h-14 w-14",
            )}
          >
            {sellerAvatar ? (
              <Image
                src={sellerAvatar}
                alt=""
                fill
                sizes={isDetail ? "72px" : "56px"}
                className="object-cover"
              />
            ) : (
              <User
                className={cn("text-white", isDetail ? "h-8 w-8" : "h-7 w-7")}
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  "font-black leading-tight text-navy dark:text-white",
                  isDetail ? "text-lg sm:text-xl" : "text-base",
                )}
              >
                {sellerName}
              </h3>
              {verified ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-300"
                  title="Verified seller"
                >
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-semibold text-navy/60 dark:text-white/60 sm:text-[13px]">
              {roleLabel}
            </p>
            {(trustScoreLabel || responseLabel) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {trustScoreLabel ? (
                  showProfileNav ? (
                    <Link
                      href={profileHref}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-[#031B4E] hover:bg-gold/15 dark:text-gold"
                    >
                      <Award className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                      {trustScoreLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-[#031B4E] dark:text-gold">
                      <Award className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                      {trustScoreLabel}
                    </span>
                  )
                ) : null}
                {responseLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {responseLabel}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {showProfileNav ? (
          <Link
            href={profileHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy/8 bg-slate-50 text-navy shadow-sm transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:h-10 sm:w-10"
            aria-label={`View ${sellerName} profile`}
          >
            <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
          </Link>
        ) : null}
      </div>

      <SellerContactReviewsPreview
        className="mt-5 sm:mt-6"
        sellerId={sellerId}
        profileHref={profileHref}
        showEmptyState={isDetail}
      />
    </article>
  );
}
