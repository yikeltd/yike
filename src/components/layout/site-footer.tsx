import Link from "next/link";
import Image from "next/image";
import {
  COMPANY_DISPLAY_NAME,
  COMPANY_RC,
  SITE_NAME,
} from "@/lib/constants";
import { brand } from "@/lib/design/tokens";

const explore = [
  { href: "/buy", label: "Buy Property" },
  { href: "/rent", label: "Rent Property" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/land", label: "Land" },
  { href: "/post-property", label: "Sell on Yike" },
] as const;

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety Centre" },
  { href: "/verify-agent", label: "Become Verified" },
] as const;

const legal = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
] as const;

function FooterNavColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E4B547]">
        {title}
      </p>
      <ul className="mt-5 space-y-3.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-[#E4B547]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-[#f0f4fa]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 xl:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src={brand.logoSm}
                alt={SITE_NAME}
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-5 max-w-[17rem] text-[15px] leading-relaxed text-white/65">
              Nigeria&apos;s trusted marketplace for verified property and
              vehicles.
            </p>
          </div>

          <FooterNavColumn title="Explore" links={explore} />
          <FooterNavColumn title="Company" links={company} />
          <FooterNavColumn title="Legal" links={legal} />
        </div>

        <section
          className="site-footer-legal site-footer-divider mt-16 border-t pt-10"
          aria-label="Legal information"
        >
          <p className="text-sm font-medium text-white/65">
            © {year} {COMPANY_DISPLAY_NAME} All rights reserved. {COMPANY_RC}
          </p>
          <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-white/40">
            Yike is a trusted property marketplace. Always inspect listings and
            complete your due diligence before making payments.
          </p>
          <p className="mt-5 text-xs text-white/35">
            Owned &amp; Operated by Stankings Legacy Ltd.{" "}
            <span aria-hidden className="text-white/25">
              •
            </span>{" "}
            <a
              href="https://stankings.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-colors hover:text-white/60"
            >
              stankings.com
            </a>
          </p>
        </section>
      </div>
    </footer>
  );
}
