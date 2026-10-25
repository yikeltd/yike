"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  clearBrowseReturn,
  inferMarketplacePortal,
  isPublicListingDetailPath,
  resolveBrowseBackTarget,
  resolveListingDetailBackFallback,
} from "@/lib/marketplace/browse-navigation";
import { cn } from "@/lib/utils";

type Props = {
  fallback?: string;
  className?: string;
  label?: string;
  variant?: "inline" | "overlay";
  /** Prefer server-passed query param so href is correct before hydration. */
  browseReturnParam?: string | null;
};

export function MarketplaceBackButton({
  fallback,
  className,
  label = "Back",
  variant = "inline",
  browseReturnParam,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const browseReturn =
    browseReturnParam ?? searchParams.get("browseReturn");

  const href = useMemo(() => {
    const portalFallback =
      fallback ??
      (isPublicListingDetailPath(pathname)
        ? resolveListingDetailBackFallback(pathname)
        : inferMarketplacePortal(pathname) === "agent"
          ? "/agent/listings"
          : "/search");
    return resolveBrowseBackTarget(browseReturn, portalFallback);
  }, [browseReturn, browseReturnParam, fallback, pathname]);

  const shared = {
    href,
    onClick: () => clearBrowseReturn(),
    "aria-label": variant === "overlay" ? "Go back" : undefined,
  };

  if (variant === "overlay") {
    return (
      <Link
        {...shared}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20",
          className
        )}
      >
        <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
      </Link>
    );
  }

  return (
    <Link
      {...shared}
      className={cn(
        "pressable mb-2 flex items-center gap-0.5 text-sm font-semibold text-navy lg:hidden",
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
