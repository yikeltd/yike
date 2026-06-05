import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo/utils";

export function SeoBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1 text-sm text-muted">
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1">
          {i > 0 && <span>/</span>}
          {i === items.length - 1 ? (
            <span className="font-medium text-navy">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-navy">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
