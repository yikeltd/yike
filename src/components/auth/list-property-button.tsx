"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { canListProperties } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  isSellerReadyToList,
  SELLER_CHOOSE_LISTING_PATH,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import type { Profile } from "@/types/database";

function sellerListDestination(profile: Profile | null | undefined) {
  if (profile && canListProperties(profile) && isSellerReadyToList(profile)) {
    return SELLER_CHOOSE_LISTING_PATH;
  }
  return SELLER_VERIFY_PATH;
}

export function ListPropertyButton({
  className,
  children,
  asLink = false,
}: {
  className?: string;
  children: React.ReactNode;
  asLink?: boolean;
}) {
  const router = useRouter();
  const { guardAction, user, profile, emailVerified } = useAuth();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    guardAction(
      { type: "list_property", redirectPath: SELLER_VERIFY_PATH },
      () => {
        if (!user || !emailVerified) return;
        router.push(sellerListDestination(profile));
      }
    );
  }

  if (asLink) {
    return (
      <button type="button" onClick={handleClick} className={cn(className)}>
        {children}
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={cn(className)}>
      {children}
    </button>
  );
}

/** Nav link styled like Next Link */
export function ListPropertyNavLink({
  href: _href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ListPropertyButton className={className} asLink>
      {children}
    </ListPropertyButton>
  );
}
