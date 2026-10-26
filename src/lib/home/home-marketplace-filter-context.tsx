"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
type HomeMarketplaceFilterContextValue = {
  meaningfulFilterActive: boolean;
  filtersPanelOpen: boolean;
  setMeaningfulFilterActive: (active: boolean) => void;
  setFiltersPanelOpen: (open: boolean) => void;
  /** Scroll to hero and expand in-flow marketplace filters (mobile homepage). */
  openHomeMarketplaceFilters: () => void;
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

  const openHomeMarketplaceFilters = useCallback(() => {
    setFiltersPanelOpen(true);
    if (typeof document !== "undefined") {
      document.getElementById("home-search")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const value = useMemo(
    (): HomeMarketplaceFilterContextValue => ({
      meaningfulFilterActive,
      filtersPanelOpen,
      setMeaningfulFilterActive,
      setFiltersPanelOpen,
      openHomeMarketplaceFilters,
      resetHomeMarketplaceFilters,
    }),
    [
      meaningfulFilterActive,
      filtersPanelOpen,
      resetHomeMarketplaceFilters,
      openHomeMarketplaceFilters,
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

/** Full unified header search pill (default header state on marketplace routes). */
export function useHomeLargeSearchBarVisible(): boolean {
  return true;
}
