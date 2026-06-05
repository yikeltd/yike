import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toSlug } from "@/lib/location-slugs";
import { SITE_URL } from "@/lib/constants";

export function PropertyBreadcrumbs({
  city,
  area,
  title,
}: {
  city: string;
  area: string;
  title: string;
}) {
  const citySlug = toSlug(city);
  const areaSlug = toSlug(area);

  const crumbs = [
    { name: "Home", href: "/" },
    { name: city, href: `/houses/${citySlug}` },
    { name: area, href: `/houses/${citySlug}/${areaSlug}` },
    { name: title, href: undefined },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted sm:text-sm"
      >
        {crumbs.map((c, i) => (
          <span key={c.name} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
            {c.href ? (
              <Link href={c.href} className="font-medium hover:text-gold-dark">
                {c.name}
              </Link>
            ) : (
              <span className="line-clamp-1 max-w-[12rem] font-semibold text-foreground sm:max-w-md">
                {c.name}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
