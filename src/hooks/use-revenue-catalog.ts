"use client";

import { useEffect, useState } from "react";
import type { RevenuePricingCatalog } from "@/lib/revenue-pricing/types";
import { getCatalogPrice } from "@/lib/revenue-pricing/catalog-utils";

export function useRevenueCatalog() {
  const [catalog, setCatalog] = useState<RevenuePricingCatalog | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/revenue/catalog")
      .then((res) => res.json())
      .then((data: { catalog?: RevenuePricingCatalog }) => {
        if (!cancelled && data.catalog) setCatalog(data.catalog);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}

export function useCatalogPrice(product: string, variantKey: string): number | null {
  const catalog = useRevenueCatalog();
  if (!catalog) return null;
  return getCatalogPrice(catalog, product, variantKey);
}
