"use client";

import { usePathname } from "next/navigation";
import { useStandaloneApp } from "@/hooks/use-standalone-app";
import { useAuth } from "@/components/auth/auth-provider";

function shouldHideFooter(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex") ||
    pathname.startsWith("/agent") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/saved" ||
    pathname.startsWith("/saved/") ||
    pathname === "/discover" ||
    pathname.startsWith("/discover/")
  );
}

export function ConditionalPublicFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isApp } = useStandaloneApp();
  const auth = useAuth();

  if (shouldHideFooter(pathname)) return null;

  // Logged-in users should never see the public marketing footer
  if (auth?.user) return null;

  // Hide footer in standalone app mode
  if (isApp) return null;

  return <>{children}</>;
}
