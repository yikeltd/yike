"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAppShellRoute, isStandaloneApp } from "@/lib/app-environment";

function shouldHideFooter(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex") ||
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
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneApp());
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setStandalone(isStandaloneApp());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (shouldHideFooter(pathname)) return null;
  if (isAppShellRoute(pathname)) return null;
  if (standalone) return null;

  return <div className="hidden md:block">{children}</div>;
}
