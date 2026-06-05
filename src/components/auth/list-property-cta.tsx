"use client";

import { ListPropertyNavLink } from "./list-property-button";

/** Client CTA for server-rendered pages that link to list property. */
export function ListPropertyCta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ListPropertyNavLink href="/post-property" className={className}>
      {children}
    </ListPropertyNavLink>
  );
}
