"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Minimal chrome on home — search + filters live in HomeSearchHero below. */
export function HeaderMobile() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-elevated/95 px-3 py-2 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="shrink-0">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
        </Link>
        <Link
          href="/search"
          className="pressable flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-surface px-3 text-sm font-semibold text-foreground"
        >
          Search homes
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
