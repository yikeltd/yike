"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
  LISTING_SAVE_CARD_OVERLAY_CLASS,
  LISTING_SAVE_CARD_OVERLAY_ICON_CLASS,
  listingSaveAriaLabel,
  readGuestListingSaved,
  toggleAuthenticatedListingSave,
  toggleGuestListingSaveWithAnalytics,
  type ListingSaveAnalyticsContext,
} from "@/lib/listings/toggle-listing-save";

export type ListingSaveButtonProps = {
  listingId: string;
  className?: string;
  /** Circular heart on listing imagery (default for cards). */
  variant?: "card-overlay" | "inline";
  disabled?: boolean;
  redirectPath?: string;
  analytics?: ListingSaveAnalyticsContext;
  sellerId?: string | null;
  listingTitle?: string | null;
};

export function ListingSaveButton({
  listingId,
  className,
  variant = "card-overlay",
  disabled = false,
  redirectPath,
  analytics,
  sellerId,
  listingTitle,
}: ListingSaveButtonProps) {
  const {
    user,
    loading: authLoading,
    isListingSaved,
    setListingSaved,
    guardAction,
  } = useAuth();

  const [guestSaved, setGuestSaved] = useState(false);
  const [guestHydrated, setGuestHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const mutationInFlightRef = useRef(false);

  const accountSaved = user ? isListingSaved(listingId) : false;
  const saved = user ? accountSaved : guestSaved;

  useEffect(() => {
    if (user) {
      setGuestSaved(false);
      setGuestHydrated(true);
      return;
    }
    setGuestSaved(readGuestListingSaved(listingId));
    setGuestHydrated(true);
  }, [listingId, user]);

  const showTransientError = useCallback((message: string) => {
    setErrorMessage(message);
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = window.setTimeout(() => {
      setErrorMessage(null);
      errorTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    };
  }, []);

  const runToggle = useCallback(async () => {
    if (busy || disabled || mutationInFlightRef.current) return;
    mutationInFlightRef.current = true;
    setBusy(true);
    setErrorMessage(null);

    if (!user?.id) {
      const guestAnalytics: ListingSaveAnalyticsContext | undefined = analytics
        ? {
            ...analytics,
            source:
              analytics.source === "account" || analytics.source === "card"
                ? "guest"
                : analytics.source,
          }
        : undefined;
      const next = toggleGuestListingSaveWithAnalytics(
        listingId,
        guestAnalytics,
      );
      setGuestSaved(next);
      setBusy(false);
      mutationInFlightRef.current = false;
      return;
    }

    const previousSaved = accountSaved;
    const optimisticSaved = !previousSaved;
    setListingSaved(listingId, optimisticSaved);

    const result = await toggleAuthenticatedListingSave({
      listingId,
      currentlySaved: previousSaved,
      userId: user.id,
      analytics,
      sellerId,
      listingTitle,
      sourcePage:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (result.ok) {
      setListingSaved(listingId, result.saved);
    } else {
      setListingSaved(listingId, previousSaved);
      showTransientError("Could not update saved listing. Try again.");
    }
    setBusy(false);
    mutationInFlightRef.current = false;
  }, [
    accountSaved,
    analytics,
    busy,
    disabled,
    listingId,
    listingTitle,
    sellerId,
    setListingSaved,
    showTransientError,
    user?.id,
  ]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (busy || disabled || authLoading) return;

      if (!user?.id) {
        void runToggle();
        return;
      }

      guardAction(
        {
          type: "save",
          listingId,
          redirectPath: redirectPath ?? window.location.pathname,
        },
        () => void runToggle(),
      );
    },
    [
      authLoading,
      busy,
      disabled,
      guardAction,
      listingId,
      redirectPath,
      runToggle,
      user?.id,
    ],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      handleClick(e as unknown as React.MouseEvent);
    },
    [handleClick],
  );

  const isCardOverlay = variant === "card-overlay";
  const ariaLabel = listingSaveAriaLabel(saved);

  return (
    <>
      <button
        type="button"
        data-testid="listing-save-button"
        data-listing-id={listingId}
        data-variant={variant}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={busy || disabled || (!user && !guestHydrated && !authLoading)}
        aria-label={ariaLabel}
        aria-pressed={saved}
        aria-busy={busy}
        className={cn(
          isCardOverlay
            ? LISTING_SAVE_CARD_OVERLAY_CLASS
            : "inline-flex items-center gap-1.5 rounded-full border border-navy/12 bg-white px-3 py-1.5 text-xs font-bold text-navy pressable focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60",
          className,
        )}
      >
        <Heart
          aria-hidden
          className={cn(
            isCardOverlay
              ? LISTING_SAVE_CARD_OVERLAY_ICON_CLASS
              : "h-4 w-4",
            saved && !busy && "animate-heart-pop motion-reduce:animate-none",
            saved
              ? "fill-gold text-gold"
              : isCardOverlay
                ? "text-navy/80"
                : "text-navy/50",
          )}
        />
        {!isCardOverlay ? (saved ? "Saved" : "Save") : null}
      </button>
      {errorMessage ? (
        <span className="sr-only" role="status" aria-live="polite">
          {errorMessage}
        </span>
      ) : null}
    </>
  );
}
