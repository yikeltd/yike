import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteHeader({
  compact,
  stickySearch,
}: {
  compact?: boolean;
  stickySearch?: React.ReactNode;
}) {
  return (
    <header className="nav-bar sticky top-0 z-40 shadow-md">
      <div className="mx-auto max-w-lg px-4">
        <div className="flex h-14 items-center justify-between">
          <Logo
            href="/"
            showText={!compact}
            className="text-white [&_span]:text-white"
          />
          {!compact && (
            <Link
              href="/agent"
              className="rounded-lg bg-gold/15 px-3 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/25"
            >
              Agent
            </Link>
          )}
        </div>
        {stickySearch && <div className="pb-3">{stickySearch}</div>}
      </div>
    </header>
  );
}
