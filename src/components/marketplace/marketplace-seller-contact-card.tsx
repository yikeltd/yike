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
  variant?: "default" | "listingDetail";
};

function ListingDetailSellerPanel({
  sellerId,
  sellerName,
  profileHeadline,
  sellerAvatar,
  verified,
  roleLabel,
  trustScoreLabel,
  responseLabel,
  profileHref,
  className,
}: SellerContactCardIdentity & { className?: string }) {
  const showProfileNav = Boolean(profileHref?.startsWith("/agents/"));

  return (
    <article
      className={cn(
        "w-full min-h-[18rem] rounded-[1.35rem] border border-slate-200/90 bg-white p-6 shadow-[0_18px_50px_-24px_rgba(3,27,78,0.22)] sm:min-h-[20rem] sm:p-8 dark:border-white/10 dark:bg-navy",
        className,
      )}
      data-testid="marketplace-seller-contact-card"
      aria-label={`Seller profile for ${sellerName}`}
    >
      <div className="flex items-start gap-5 sm:gap-6">
        <div
          className="relative flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[2.5px] border-[#E4B547]/55 bg-[#031B4E] shadow-[0_8px_22px_-8px_rgba(3,27,78,0.55)] sm:h-[5.25rem] sm:w-[5.25rem]"
        >
          {sellerAvatar ? (
            <Image
              src={sellerAvatar}
              alt=""
              fill
              sizes="84px"
              className="object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-white" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-xl font-black leading-tight text-[#031B4E] sm:text-2xl dark:text-white">
              {profileHeadline}
            </h2>
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-navy/65 sm:text-base dark:text-white/65">
            {roleLabel}
          </p>

          {(trustScoreLabel || responseLabel) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold">
              {trustScoreLabel ? (
                showProfileNav ? (
                  <Link
                    href={profileHref}
                    className="inline-flex items-center gap-2 text-[#031B4E] hover:underline dark:text-gold"
                  >
                    <Award className="h-[18px] w-[18px] text-[#E4B547]" aria-hidden />
                    {trustScoreLabel}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[#031B4E] dark:text-gold">
                    <Award className="h-[18px] w-[18px] text-[#E4B547]" aria-hidden />
                    {trustScoreLabel}
                  </span>
                )
              ) : null}
              {responseLabel ? (
                <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Clock className="h-[18px] w-[18px]" aria-hidden />
                  {responseLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {showProfileNav ? (
          <Link
            href={profileHref}
            className="hidden shrink-0 items-center justify-center self-center rounded-full border border-slate-200 bg-slate-50 p-2 text-navy hover:bg-slate-100 sm:flex dark:border-white/10 dark:bg-white/10 dark:text-white"
            aria-label={`View ${sellerName} profile`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <hr
        className="my-6 border-0 border-t border-slate-200/90 dark:border-white/10 sm:my-7"
        data-testid="seller-panel-divider"
      />

      <SellerContactReviewsPreview
        sellerId={sellerId}
        profileHref={profileHref}
        showEmptyState
        variant="listingDetail"
      />
    </article>
  );
}

export function MarketplaceSellerContactCard({
  listingId: _listingId,
  assetType: _assetType,
  sellerId,
  sellerName,
  profileHeadline,
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

  if (variant === "listingDetail") {
    return (
      <ListingDetailSellerPanel
        listingId={_listingId}
        assetType={_assetType}
        sellerId={sellerId}
        sellerName={sellerName}
        profileHeadline={profileHeadline}
        sellerAvatar={sellerAvatar}
        verified={verified}
        roleLabel={roleLabel}
        trustScoreLabel={trustScoreLabel}
        responseLabel={responseLabel}
        profileHref={profileHref}
        className={className}
      />
    );
  }

  const showProfileNav = Boolean(profileHref?.startsWith("/agents/"));

  return (
    <article
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
              <Image src={sellerAvatar} alt="" fill className="object-cover" />
            ) : (
              <User className="h-7 w-7 text-white" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-base font-black text-navy dark:text-white">{sellerName}</h3>
              {verified ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-semibold text-navy/60 dark:text-white/60">
              {roleLabel}
            </p>
          </div>
        </div>
        {showProfileNav ? (
          <Link
            href={profileHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200 dark:bg-white/10 dark:text-white"
            aria-label={`View ${sellerName} profile`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      <SellerContactReviewsPreview
        className="mt-4 border-t border-navy/10 pt-4 dark:border-white/10"
        sellerId={sellerId}
        profileHref={profileHref}
      />
    </article>
  );
}
