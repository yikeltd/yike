"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type HomeMarketplaceFilterContextValue = {
  meaningfulFilterActive: boolean;
  filtersPanelOpen: boolean;
  setMeaningfulFilterActive: (active: boolean) => void;
  setFiltersPanelOpen: (open: boolean) => void;
  /** Homepage large unified search + hero search CTA visibility. */
  showLargeSearchBar: boolean;
  resetHomeMarketplaceFilters: () => void;
};

const HomeMarketplaceFilterContext =
  createContext<HomeMarketplaceFilterContextValue | null>(null);

export function HomeMarketplaceFilterProvider({ children }: { children: ReactNode }) {
  const [meaningfulFilterActive, setMeaningfulFilterActive] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  const resetHomeMarketplaceFilters = useCallback(() => {
    setMeaningfulFilterActive(false);
    setFiltersPanelOpen(false);
  }, []);

  const showLargeSearchBar = meaningfulFilterActive && filtersPanelOpen;

  const value = useMemo(
    (): HomeMarketplaceFilterContextValue => ({
      meaningfulFilterActive,
      filtersPanelOpen,
      setMeaningfulFilterActive,
      setFiltersPanelOpen,
      showLargeSearchBar,
      resetHomeMarketplaceFilters,
    }),
    [
      meaningfulFilterActive,
      filtersPanelOpen,
      showLargeSearchBar,
      resetHomeMarketplaceFilters,
    ],
  );

  return (
    <HomeMarketplaceFilterContext.Provider value={value}>
      {children}
    </HomeMarketplaceFilterContext.Provider>
  );
}

export function useHomeMarketplaceFilterContext(): HomeMarketplaceFilterContextValue | null {
  return useContext(HomeMarketplaceFilterContext);
}

/** True on non-home routes; on `/` requires meaningful filter + open panel. */
export function useHomeLargeSearchBarVisible(): boolean {
  const pathname = usePathname();
  const ctx = useHomeMarketplaceFilterContext();
  if (pathname !== "/") return true;
  return ctx?.showLargeSearchBar ?? false;
}
