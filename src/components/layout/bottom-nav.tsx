"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Search, Heart, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { ListPropertyNavLink } from "@/components/auth/list-property-button";

const items = [
  { href: "/", label: "Home", icon: Home, auth: false },
  { href: "/?focus=search", label: "Search", icon: Search, auth: false },
  { href: "/saved", label: "Saved", icon: Heart, auth: true, intent: "saved" as const },
  { href: "/post-property", label: "List", icon: PlusCircle, auth: true, intent: "list_property" as const },
  { href: "/agent", label: "Profile", icon: User, auth: true, intent: "profile" as const },
];

function isNavActive(
  href: string,
  pathname: string,
  focusSearch: boolean
): boolean {
  if (href === "/?focus=search") {
    return pathname === "/" && focusSearch;
  }
  if (href === "/") {
    return pathname === "/" && !focusSearch;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusSearch = searchParams.get("focus") === "search";
  const { guardAction } = useAuth();

  if (pathname.startsWith("/auth") || pathname.startsWith("/lex")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 shadow-[0_-4px_24px_rgb(3_27_78/8%)] backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1.5">
        {items.map(({ href, label, icon: Icon, auth, intent }) => {
          const active = isNavActive(href, pathname, focusSearch);

          if (auth && intent === "list_property") {
            return (
              <ListPropertyNavLink
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-150 touch-feedback",
                  active ? "text-navy" : "text-muted hover:text-navy/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    active && "bg-gold text-navy shadow-sm"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </span>
                {label}
              </ListPropertyNavLink>
            );
          }

          if (auth && intent) {
            return (
              <button
                key={href}
                type="button"
                onClick={() =>
                  guardAction(
                    { type: intent, redirectPath: href },
                    () => {
                      window.location.href = href;
                    }
                  )
                }
                className={cn(
                  "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-150 touch-feedback",
                  active ? "text-navy" : "text-muted hover:text-navy/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    active && "bg-gold text-navy shadow-sm"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </span>
                {label}
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-150 touch-feedback",
                active ? "text-navy" : "text-muted hover:text-navy/70"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  active && "bg-gold text-navy shadow-sm"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
