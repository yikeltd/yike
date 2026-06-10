import Link from "next/link";
import { Building2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import {
  COMPANY_DISPLAY_NAME,
  COMPANY_EMAIL,
  COMPANY_RC,
  YIKE_SUPPORT_PHONE_DISPLAY,
} from "@/lib/constants";

const QUICK_LINKS = [
  { href: "/rent", label: "Rent" },
  { href: "/buy", label: "Buy" },
  { href: "/land", label: "Land" },
  { href: "/search?property_type=shop", label: "Shops" },
] as const;

const LOCATIONS = ["Lagos", "Abuja", "Aba", "Enugu", "Owerri", "Port Harcourt"];

export function HomeMarketplaceIntro() {
  return (
    <section
      className="mx-auto max-w-7xl px-3 pt-4 lg:px-6 xl:px-8"
      aria-label="About Yike"
    >
      <div className="rounded-2xl border border-gold/20 bg-white px-4 py-5 shadow-float ring-1 ring-black/[0.04] lg:px-6 lg:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Nigeria property marketplace
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy lg:text-3xl">
              Find Verified Homes Across Nigeria
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted lg:text-base">
              {COMPANY_DISPLAY_NAME} helps Nigerians discover real homes to{" "}
              <strong className="font-semibold text-foreground">rent</strong>,{" "}
              <strong className="font-semibold text-foreground">buy</strong>, or{" "}
              <strong className="font-semibold text-foreground">lease</strong> —
              including flats, bungalows, land, and shops. Browse listings free,
              contact agents on WhatsApp, no sign-in required.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="pressable rounded-full bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy/90"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl bg-surface/80 p-4 lg:max-w-xs">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy">
              <Building2 className="h-4 w-4 text-gold-dark" aria-hidden />
              {COMPANY_DISPLAY_NAME}
            </p>
            <p className="mt-1 text-xs text-muted">{COMPANY_RC}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="inline-flex items-center gap-2 font-semibold text-navy hover:text-gold-dark"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  {COMPANY_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${YIKE_SUPPORT_PHONE_DISPLAY.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 font-semibold text-navy hover:text-gold-dark"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                  {YIKE_SUPPORT_PHONE_DISPLAY}
                </a>
              </li>
              <li className="inline-flex items-start gap-2 text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                <span>
                  Serving {LOCATIONS.join(" · ")} and all Nigerian states
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
