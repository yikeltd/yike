import Link from "next/link";
import { cn } from "@/lib/utils";

const HUBS = [
  { href: "/explore", label: "Explore" },
  { href: "/rent", label: "Rent" },
  { href: "/buy", label: "Buy" },
  { href: "/hotel", label: "Hotels" },
  { href: "/shortlet", label: "Shortlet" },
  { href: "/land", label: "Land" },
  { href: "/browse", label: "Swipe" },
  { href: "/post-property", label: "List" },
  { href: "/request-property", label: "Request" },
  { href: "/blog", label: "Guides" },
] as const;

export function ExploreHubLinks({
  active,
  className,
}: {
  active?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Browse categories"
      className={cn(
        "hide-scrollbar flex gap-2 overflow-x-auto px-3 lg:px-0",
        className
      )}
    >
      {HUBS.map((hub) => {
        const isActive = active === hub.href;
        return (
          <Link
            key={hub.href}
            href={hub.href}
            className={cn(
              "pressable shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-gold text-navy shadow-glow-gold"
                : "bg-white text-navy shadow-float hover:bg-gold/10"
            )}
          >
            {hub.label}
          </Link>
        );
      })}
    </nav>
  );
}
