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
import { SellerMessageCallActions } from "@/components/marketplace/seller-message-call-actions";
import { SellerContactReviewsPreview } from "@/components/marketplace/seller-contact-reviews-preview";

type Props = SellerContactCardIdentity & {
  className?: string;
  actionsVariant?: "sidebar" | "gallery-inline";
};

export function MarketplaceSellerContactCard({
  listingId,
  assetType,
  sellerId,
  sellerName,
  sellerAvatar,
  verified,
  roleLabel,
  trustScoreLabel,
  responseLabel,
  profileHref,
  className,
  actionsVariant = "sidebar",
}: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-navy/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-navy",
        className,
      )}
      data-testid="marketplace-seller-contact-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-gold/40 bg-[#031B4E] text-white shadow-sm">
            {sellerAvatar ? (
              <Image
                src={sellerAvatar}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-white" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-base font-black text-navy dark:text-white">
                {sellerName}
              </h3>
              {verified ? (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300"
                  title="Verified seller"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-semibold text-navy/60 dark:text-white/60">
              {roleLabel}
            </p>
            {(trustScoreLabel || responseLabel) && (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-bold text-navy/70 dark:text-white/70">
                {trustScoreLabel ? (
                  <Link
                    href={profileHref}
                    className="inline-flex items-center gap-1 text-gold-dark hover:underline dark:text-gold"
                  >
                    <Award className="h-3.5 w-3.5" aria-hidden />
                    {trustScoreLabel}
                  </Link>
                ) : null}
                {responseLabel ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {responseLabel}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <Link
          href={profileHref}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          aria-label={`View ${sellerName} profile`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4">
        <SellerMessageCallActions
          listingId={listingId}
          assetType={assetType}
          sellerId={sellerId}
          sellerName={sellerName}
          variant={actionsVariant}
        />
      </div>

      <SellerContactReviewsPreview
        sellerId={sellerId}
        profileHref={profileHref}
      />
    </div>
  );
}
