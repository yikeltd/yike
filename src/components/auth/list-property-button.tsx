"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { canListProperties } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
      { type: "list_property", redirectPath: "/post-property" },
      () => {
        if (!user || !emailVerified) return;
        if (profile && canListProperties(profile.verification_status)) {
          router.push("/agent/listings/new");
        } else {
          router.push("/agent/verification");
        }
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
