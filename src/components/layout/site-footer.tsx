import Link from "next/link";
import Image from "next/image";
import {
  COMPANY_DISPLAY_NAME,
  COMPANY_EMAIL,
  COMPANY_RC,
  SITE_NAME,
  YIKE_SUPPORT_PHONE_DISPLAY,
} from "@/lib/constants";
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
  { href: "/pricing", label: "Pricing" },
  { href: "/request-property", label: "Request a home" },
  { href: "/blog", label: "Rental guides" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/careers", label: "Careers" },
  { href: "/verify-agent", label: "Verify as agent" },
  { href: "/why-verified", label: "Why verified" },
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
    <footer className="text-[#f0f4fa]">
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
              <span className="text-lg font-bold text-white">{SITE_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Nigeria&apos;s visual housing marketplace. Browse homes, contact
              agents on WhatsApp, list for free.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <a
                href={`mailto:${COMPANY_EMAIL}`}
                className="block font-semibold text-white/90 transition-colors hover:text-[#e4b547]"
              >
                {COMPANY_EMAIL}
              </a>
              <a
                href={`tel:${YIKE_SUPPORT_PHONE_DISPLAY.replace(/\s/g, "")}`}
                className="block text-white/80 transition-colors hover:text-[#e4b547]"
              >
                {YIKE_SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e4b547]">
              Explore
            </p>
            <ul className="mt-3 space-y-2">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/90 transition-colors hover:text-[#e4b547]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e4b547]">
              Company
            </p>
            <ul className="mt-3 space-y-2">
              {company.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/90 transition-colors hover:text-[#e4b547]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e4b547]">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/90 transition-colors hover:text-[#e4b547]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section
          className="site-footer-legal site-footer-divider mt-10 border-t pt-8"
          aria-label="Legal information"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs leading-relaxed text-white/80">
                © {year} {COMPANY_DISPLAY_NAME} All rights reserved.
              </p>
              <p className="text-xs leading-relaxed text-white/75">
                {COMPANY_DISPLAY_NAME} · {COMPANY_RC}
              </p>
              <p className="text-xs leading-relaxed text-white/75">
                {SITE_NAME} is an online listing platform only. We do not own
                properties, collect rent, hold deposits, or guarantee listings.
                Always verify properties in person before payment. Read our{" "}
                <Link
                  href="/disclaimer"
                  className="text-white/85 underline decoration-white/30 underline-offset-2 transition-colors hover:text-[#e4b547]"
                >
                  full disclaimer
                </Link>
                .
              </p>
            </div>
            <FollowYike title="" variant="footer" className="shrink-0" />
          </div>
        </section>
      </div>
    </footer>
  );
}
