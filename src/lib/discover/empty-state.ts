import type { DiscoverFilterState } from "@/lib/discover/filters";
import { getDiscoverElectronicsSubOptions } from "@/lib/discover/categories";

export type DiscoverEmptyReason = "no_results" | "deck_exhausted";

export type DiscoverEmptyPrimaryAction =
  | "clear_filters"
  | "browse_all_categories"
  | "refresh_deck"
  | "increase_budget"
  | "widen_search";

export function resolveDiscoverEmptyReason(
  feedLength: number,
  index: number,
): DiscoverEmptyReason {
  if (feedLength === 0) return "no_results";
  if (index >= feedLength) return "deck_exhausted";
  return "deck_exhausted";
}

export function discoverFiltersAreRestrictive(
  filters: DiscoverFilterState,
): boolean {
  return (
    filters.category !== "all" ||
    Boolean(filters.electronicsSub) ||
    Boolean(filters.deal) ||
    Boolean(filters.state) ||
    Boolean(filters.city) ||
    filters.maxBudget != null ||
    filters.featuredOnly ||
    filters.verifiedOnly
  );
}

function categoryNoun(filters: DiscoverFilterState): string {
  switch (filters.category) {
    case "property":
      return "property";
    case "vehicle":
      return "vehicle";
    case "electronics":
      return "electronics";
    default:
      return "listing";
  }
}

function electronicsSubLabel(subId: string): string | null {
  const match = getDiscoverElectronicsSubOptions().find((s) => s.id === subId);
  return match?.label ?? null;
}

export function getDiscoverEmptyCopy(
  reason: DiscoverEmptyReason,
  filters: DiscoverFilterState,
): { title: string; subtitle: string } {
  if (reason === "deck_exhausted") {
    return {
      title: "You've seen everything matching your filters.",
      subtitle: "Refresh the deck for another pass, or clear filters to widen what you see.",
    };
  }

  if (filters.electronicsSub) {
    const sub = electronicsSubLabel(filters.electronicsSub);
    return {
      title: sub
        ? `No ${sub.toLowerCase()} listings match these filters yet.`
        : "No electronics listings match these filters yet.",
      subtitle: "Clear filters or pick another category.",
    };
  }

  if (filters.category !== "all") {
    return {
      title: `No ${categoryNoun(filters)} listings match these filters yet.`,
      subtitle: "Clear filters or browse all categories.",
    };
  }

  if (discoverFiltersAreRestrictive(filters)) {
    return {
      title: "No listings match these filters.",
      subtitle: "Clear filters to see more in Discover.",
    };
  }

  return {
    title: "Nothing to discover yet.",
    subtitle: "Check back soon — new listings are added regularly.",
  };
}

export function getDiscoverEmptyPrimaryAction(
  reason: DiscoverEmptyReason,
  filters: DiscoverFilterState,
): DiscoverEmptyPrimaryAction {
  if (reason === "no_results") {
    if (filters.maxBudget != null) return "increase_budget";
    if (filters.city || filters.state) return "widen_search";
    if (
      filters.category !== "all" &&
      !filters.deal &&
      !filters.featuredOnly &&
      !filters.verifiedOnly &&
      filters.maxBudget == null &&
      !filters.city &&
      !filters.state &&
      !filters.electronicsSub
    ) {
      return "browse_all_categories";
    }
    if (discoverFiltersAreRestrictive(filters)) return "clear_filters";
    return "browse_all_categories";
  }

  if (discoverFiltersAreRestrictive(filters)) return "clear_filters";
  return "refresh_deck";
}

export const DISCOVER_EMPTY_PRIMARY_LABELS: Record<
  DiscoverEmptyPrimaryAction,
  string
> = {
  clear_filters: "Clear filters",
  browse_all_categories: "Browse all categories",
  refresh_deck: "Refresh deck",
  increase_budget: "Increase budget",
  widen_search: "Widen search",
};
