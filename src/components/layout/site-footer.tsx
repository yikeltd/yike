import Link from "next/link";
import Image from "next/image";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { brand } from "@/lib/design/tokens";
import { FollowYike } from "@/components/social/follow-yike";
const explore = [
  { href: "/explore", label: "Explore" },
  { href: "/rent", label: "Rent" },
  { href: "/buy", label: "Buy" },
  { href: "/shortlet", label: "Shortlet" },
  { href: "/land", label: "Land for sale" },
  { href: "/browse", label: "Swipe homes" },
  { href: "/post-property", label: "List property" },
  { href: "/request-property", label: "Request a home" },
  { href: "/blog", label: "Rental guides" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/verify-agent", label: "Verify as agent" },
  { href: "/safety", label: "Safety tips" },
  { href: "/moderation", label: "Moderation policy" },
];

const legal = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/account/delete", label: "Delete account" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/cookies", label: "Cookie policy" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-elevated">
      <div className="mx-auto max-w-7xl px-6 py-10 xl:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src={brand.logoSm}
                alt={SITE_NAME}
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-foreground">{SITE_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Nigeria&apos;s visual housing marketplace. Browse homes, contact
              agents on WhatsApp, list for free.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Explore
            </p>
            <ul className="mt-3 space-y-2">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/80 hover:text-gold-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Company
            </p>
            <ul className="mt-3 space-y-2">
              {company.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/80 hover:text-gold-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/80 hover:text-gold-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-surface pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} {SITE_NAME}. All rights reserved. ·{" "}
            <a href={SITE_URL} className="hover:text-foreground">
              {SITE_URL.replace("https://", "")}
            </a>
          </p>
          <FollowYike title="" variant="footer" />
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted">
          {SITE_NAME} is an online listing platform only. We do not own
          properties, collect rent, hold deposits, or guarantee listings.
          Always verify properties in person before payment. Read our{" "}
          <Link href="/disclaimer" className="underline hover:text-foreground">
            full disclaimer
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
