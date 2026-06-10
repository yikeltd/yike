"use client";

import { usePathname } from "next/navigation";
import { useStandaloneApp } from "@/hooks/use-standalone-app";

function shouldHideFooter(pathname: string) {
  return pathname.startsWith("/auth") || pathname.startsWith("/lex");
}

export function ConditionalPublicFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isApp } = useStandaloneApp();

  if (shouldHideFooter(pathname)) return null;

  // SSR + first paint: show footer in browser (SEO/trust). Hide after standalone detected.
  if (isApp) return null;

  return <>{children}</>;
}
