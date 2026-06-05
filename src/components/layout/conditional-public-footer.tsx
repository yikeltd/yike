"use client";

import { usePathname } from "next/navigation";

function shouldHideFooter(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname === "/browse" ||
    pathname.startsWith("/browse/")
  );
}

export function ConditionalPublicFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;
  return children;
}
