import Link from "next/link";
import Image from "next/image";
import { SITE_NAME } from "@/lib/constants";
import { brand } from "@/lib/design/tokens";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  FOOTER_TAGLINE,
  FOOTER_SAFETY_DISCLAIMER,
  FOOTER_OWNERSHIP_LINE,
  FOOTER_EXPLORE_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  footerCopyrightLine,
} from "@/lib/layout/site-footer-content";

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
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const explore = FOOTER_EXPLORE_LINKS.filter(
    (link) => !("vehiclesOnly" in link && link.vehiclesOnly && !vehiclesOn),
  );

  return (
    <footer className="text-[#f0f4fa]">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14 xl:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src={brand.logoSm}
                alt={brand.logoAlt}
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-[17rem] text-[15px] leading-relaxed text-white/65">
              {FOOTER_TAGLINE}
            </p>
          </div>

          <FooterNavColumn title="Explore" links={explore} />
          <FooterNavColumn title="Company" links={FOOTER_COMPANY_LINKS} />
          <FooterNavColumn title="Legal" links={FOOTER_LEGAL_LINKS} />
        </div>

        <section
          className="site-footer-legal site-footer-divider mt-12 border-t pt-8"
          aria-label="Legal information"
        >
          <p className="text-sm font-medium text-white/65">
            {footerCopyrightLine(year)}
          </p>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/40">
            {FOOTER_SAFETY_DISCLAIMER}
          </p>
          <p className="mt-4 text-xs text-white/40">{FOOTER_OWNERSHIP_LINE}</p>
        </section>
      </div>
    </footer>
  );
}
