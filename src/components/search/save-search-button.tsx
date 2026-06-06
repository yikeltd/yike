"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  saveSearch,
  removeSavedSearch,
  isSearchSaved,
} from "@/lib/saved-searches";
import { cn } from "@/lib/utils";

export function SaveSearchButton({
  label,
  href,
  className,
  compact,
}: {
  label: string;
  href: string;
  className?: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSearchSaved(href));
  }, [href]);

  function toggle() {
    if (saved) {
      removeSavedSearch(href);
      setSaved(false);
    } else {
      saveSearch({ label, href });
      setSaved(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        saved
          ? "bg-gold/20 text-gold-dark"
          : "bg-surface text-navy hover:bg-gold/10",
        className
      )}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {!compact && (saved ? "Saved" : "Save")}
    </button>
  );
}
