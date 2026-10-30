"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ListingCategoryId } from "@/lib/listing-engine";
import {
  defaultCreatableListingCategory,
  parseListingCategoryParam,
} from "@/lib/listing-engine/default-creatable-category";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { ListingCategoryCombobox } from "@/components/listing-engine/listing-category-combobox";

export function InstantListingWorkspace({ agentId }: { agentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = useMemo(() => {
    return (
      parseListingCategoryParam(searchParams.get("category")) ??
      defaultCreatableListingCategory()
    );
  }, [searchParams]);

  const [categoryId, setCategoryId] = useState<ListingCategoryId>(initial);

  useEffect(() => {
    const parsed = parseListingCategoryParam(searchParams.get("category"));
    if (parsed && parsed !== categoryId) setCategoryId(parsed);
  }, [searchParams, categoryId]);

  const syncCategory = useCallback(
    (next: ListingCategoryId) => {
      setCategoryId(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", next);
      const hint = searchParams.get("hint");
      if (hint) params.set("hint", hint);
      router.replace(`/agent/listings/new?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4" data-testid="instant-listing-workspace">
      <ListingCategoryCombobox value={categoryId} onChange={syncCategory} />
      <ListingEngine
        key={categoryId}
        categoryId={categoryId}
        agentId={agentId}
        layout="instant"
        hideCategoryHeader
      />
    </div>
  );
}
