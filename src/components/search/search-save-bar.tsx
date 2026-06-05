"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SaveSearchButton } from "./save-search-button";

export function SearchSaveBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `${pathname}?${qs}` : pathname;

  if (pathname !== "/search" || !qs) return null;

  const label = [
    searchParams.get("type"),
    searchParams.get("city"),
    searchParams.get("area"),
  ]
    .filter(Boolean)
    .join(" · ") || "Saved search";

  return (
    <SaveSearchButton
      label={label}
      href={href}
      className="ml-2"
    />
  );
}
