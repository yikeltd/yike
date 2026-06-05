"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { brand } from "@/lib/design/tokens";
import { FloatingSearchBar } from "@/components/search/floating-search-bar";
import { cn } from "@/lib/utils";

export function ConsumerTopBar({ minimal }: { minimal?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const showBack =
    !minimal &&
    pathname !== "/" &&
    !pathname.startsWith("/search") &&
    !pathname.startsWith("/saved") &&
    !pathname.startsWith("/agent") &&
    !pathname.startsWith("/post-property");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]",
        minimal ? "pb-2" : "pb-3"
      )}
    >
      <div
        className={cn(
          "glass shadow-float rounded-2xl px-3 py-2",
          minimal && "rounded-2xl"
        )}
      >
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-navy"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link href="/" className="pressable shrink-0">
              <Image
                src={brand.logoSm}
                alt="Yike"
                width={36}
                height={36}
                className="rounded-lg"
                priority
              />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <FloatingSearchBar compact={minimal} />
          </div>
        </div>
      </div>
    </header>
  );
}
