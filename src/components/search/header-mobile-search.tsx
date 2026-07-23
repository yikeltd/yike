"use client";

import { HeaderUniversalSearch } from "./header-universal-search";

/** Thin adapter for older call sites that used `variant`. */
export function HeaderMobileSearch({
  variant = "default",
}: {
  variant?: "default" | "hero";
}) {
  return (
    <HeaderUniversalSearch
      size={variant === "hero" ? "large" : "default"}
      tone={variant === "hero" ? "hero" : "default"}
      placement="header_mobile"
    />
  );
}
