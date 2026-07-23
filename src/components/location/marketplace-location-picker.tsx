"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Navigation, X } from "lucide-react";
import { getAllCitiesForState } from "@/constants/nigeriaAllCities";
import { getStateDisplayLabel, getStates } from "@/lib/constants";
import {
  isNationwideMarketplaceLocation,
  markLocationPromptSeen,
  requestMarketplaceGeolocation,
  resolveCityCentroid,
  setMarketplaceLocation,
  setNationwideMarketplaceLocation,
  type MarketplaceLocation,
} from "@/lib/marketplace-location";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (loc: MarketplaceLocation | null) => void;
  initialState?: string;
  initialCity?: string;
  /** Current preference for radio selection */
  current?: MarketplaceLocation | null;
};

type View = "root" | "state";

/**
 * Marketplace location bottom sheet — Near Me / Nationwide / State → City.
 * Portaled to document.body so sticky header backdrop-filter never traps it.
 */
export function MarketplaceLocationPicker({
  open,
  onClose,
  onSaved,
  initialState = "",
  initialCity = "",
  current = null,
}: Props) {
  const [view, setView] = useState<View>("root");
  const [state, setState] = useState(initialState);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    setView("root");
    setState(initialState);
    setGeoError(null);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open, initialState, initialCity]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const states = useMemo(() => getStates(), []);
  const cities = useMemo(
    () => (state ? getAllCitiesForState(state) : []),
    [state],
  );

  const nearMeSelected = current?.source === "geo" && Boolean(current.city);
  const nationwideSelected = isNationwideMarketplaceLocation(current);

  function finish(loc: MarketplaceLocation | null) {
    markLocationPromptSeen();
    onSaved(loc);
    onClose();
  }

  async function selectNearMe() {
    setGeoBusy(true);
    setGeoError(null);
    const result = await requestMarketplaceGeolocation();
    setGeoBusy(false);
    if (!result.ok) {
      setGeoError(
        result.reason === "denied"
          ? "Location permission denied — pick a state below."
          : "Couldn't detect location — pick a state below.",
      );
      return;
    }
    trackEvent("search", {
      placement: "marketplace_location_near_me",
      city: result.location.city,
      state: result.location.state,
    });
    finish(result.location);
  }

  function selectNationwide() {
    setNationwideMarketplaceLocation();
    trackEvent("search", { placement: "marketplace_location_nationwide" });
    finish(null);
  }

  function selectEntireState(stateName: string) {
    const loc = setMarketplaceLocation({
      state: stateName,
      city: "",
      source: "manual",
    });
    trackEvent("search", {
      placement: "marketplace_location_state",
      state: stateName,
    });
    finish(loc);
  }

  function selectCity(cityName: string, stateName: string) {
    const centroid = resolveCityCentroid(cityName, stateName);
    const loc = setMarketplaceLocation({
      state: stateName,
      city: cityName,
      lat: centroid?.lat,
      lng: centroid?.lng,
      source: "manual",
    });
    trackEvent("search", {
      placement: "marketplace_location_city",
      city: cityName,
      state: stateName,
    });
    finish(loc);
  }

  if (!mounted || !open) return null;

  const sheet = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-location-title"
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 cursor-default bg-navy/45 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        aria-label="Close location switcher"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 flex max-h-[min(82dvh,600px)] w-full max-w-lg flex-col rounded-t-[1.35rem] border border-navy/10 bg-white shadow-[0_-12px_48px_-12px_rgba(2,20,51,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          visible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex shrink-0 justify-center pt-2.5 pb-1" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-navy/15" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-navy/5 px-4 pb-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            {view === "state" ? (
              <button
                type="button"
                onClick={() => setView("root")}
                className="pressable rounded-lg p-1.5 text-muted hover:text-navy"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <h2
              id="marketplace-location-title"
              className="truncate text-base font-bold text-navy"
            >
              {view === "state"
                ? getStateDisplayLabel(state)
                : "Browse Listings"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable rounded-lg p-1.5 text-muted hover:text-navy"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {view === "root" ? (
            <>
              <ScopeRow
                selected={nearMeSelected}
                disabled={geoBusy}
                onClick={() => void selectNearMe()}
                icon={
                  <Navigation className="h-4 w-4 text-gold-dark" aria-hidden />
                }
                label={geoBusy ? "Detecting…" : "Near Me"}
              />
              <ScopeRow
                selected={nationwideSelected}
                onClick={selectNationwide}
                label="Nationwide"
                hint="Nigeria"
              />

              {geoError ? (
                <p className="px-3 py-1.5 text-[11px] font-medium text-amber-800">
                  {geoError}
                </p>
              ) : null}

              <div
                className="mx-3 my-2 border-t border-navy/10"
                role="separator"
              />

              <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                Choose State
              </p>
              <ul>
                {states.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        setState(s);
                        setView("state");
                      }}
                      className={cn(
                        "pressable flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-navy hover:bg-navy/[0.04]",
                        current?.state === s && !current.city && "bg-gold/10",
                      )}
                    >
                      <span>{getStateDisplayLabel(s)}</span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => selectEntireState(state)}
                className={cn(
                  "pressable mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-navy hover:bg-navy/[0.04]",
                  current?.state === state &&
                    !current.city &&
                    "bg-gold/10 ring-1 ring-gold/30",
                )}
              >
                <RadioDot
                  selected={Boolean(current?.state === state && !current.city)}
                />
                <span>Entire {getStateDisplayLabel(state)}</span>
              </button>

              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                Select a City
              </p>
              <ul>
                {cities.map((city) => {
                  const selected =
                    current?.city === city && current?.state === state;
                  return (
                    <li key={city}>
                      <button
                        type="button"
                        onClick={() => selectCity(city, state)}
                        className={cn(
                          "pressable flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-navy/[0.04]",
                          selected && "bg-gold/10 ring-1 ring-gold/30",
                        )}
                      >
                        <RadioDot selected={selected} />
                        <span>{city}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-gold bg-gold" : "border-navy/25 bg-white",
      )}
      aria-hidden
    >
      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-navy" /> : null}
    </span>
  );
}

function ScopeRow({
  selected,
  onClick,
  label,
  hint,
  icon,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pressable flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left disabled:opacity-60",
        selected ? "bg-gold/10" : "hover:bg-navy/[0.04]",
      )}
    >
      <RadioDot selected={selected} />
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy">{label}</span>
        {hint ? (
          <span className="block text-[11px] text-muted">{hint}</span>
        ) : null}
      </span>
    </button>
  );
}
