"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/lib/design/tokens";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { parseLocationQuery } from "@/lib/location-search";
import { Search } from "lucide-react";

function HeaderHomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit() {
    const trimmed = query.trim();
    const params = new URLSearchParams();

    if (trimmed) {
      const parsed = parseLocationQuery(trimmed);
      if (parsed.state) params.set("state", parsed.state);
      if (parsed.city) params.set("city", parsed.city);
      if (parsed.area) params.set("area", parsed.area);
      if (parsed.bedrooms) params.set("beds", String(parsed.bedrooms));
      if (!parsed.city && !parsed.area && !parsed.state) params.set("q", trimmed);
    }

    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form
      className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Search className="h-4 w-4 shrink-0 text-gold-light" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Browse real listings"
        aria-label="Browse real listings"
        className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
      />
    </form>
  );
}

export function HeaderMobile() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "sticky top-0 z-40 border-b border-gold/10 bg-navy/95 px-3 py-2 backdrop-blur-md lg:hidden"
          : "sticky top-0 z-40 border-b border-surface bg-elevated/95 px-3 py-2 backdrop-blur-md lg:hidden"
      }
    >
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
        {isHome ? (
          <HeaderHomeSearch />
        ) : (
          <Link
            href="/search"
            className="pressable flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-surface px-3 text-sm font-semibold text-foreground"
          >
            Search homes
          </Link>
        )}
        <ThemeToggle inverted={isHome} />
      </div>
    </header>
  );
}
