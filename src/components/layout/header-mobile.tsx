"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { brand } from "@/lib/design/tokens";

export function HeaderMobile() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-surface/80 bg-white/95 px-3 py-2 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="pressable flex min-h-[44px] flex-1 items-center gap-2 rounded-xl bg-surface px-3 text-left text-sm text-muted"
        >
          <Search className="h-4 w-4 shrink-0 text-gold" />
          <span className="truncate">Search city, area, budget…</span>
        </button>
      </div>
    </header>
  );
}
