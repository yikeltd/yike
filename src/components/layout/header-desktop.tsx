import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/search?type=rent", label: "Rent" },
  { href: "/search?type=sale", label: "Buy" },
  { href: "/search?type=shortlet", label: "Shortlet" },
  { href: "/post-property", label: "List Property" },
  { href: "/safety", label: "Safety" },
];

export function HeaderDesktop({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 hidden border-b border-surface bg-white/95 backdrop-blur-md lg:block",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 xl:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-navy">
            {brand.name}
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-navy"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/post-property"
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-glow-gold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          List Property
        </Link>
      </div>
    </header>
  );
}
