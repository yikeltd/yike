"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isStandaloneApp } from "@/lib/app-environment";

function shouldHideFooter(pathname: string) {
  return pathname.startsWith("/auth") || pathname.startsWith("/lex");
}

export function ConditionalPublicFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [standalone, setStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStandalone(isStandaloneApp());
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setStandalone(isStandaloneApp());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (shouldHideFooter(pathname)) return null;

  // SSR + first paint: show footer in browser (SEO/trust). Hide after standalone detected.
  if (mounted && standalone) return null;

  return <>{children}</>;
}
