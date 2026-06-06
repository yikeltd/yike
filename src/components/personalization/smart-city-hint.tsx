"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X } from "lucide-react";
import {
  dismissCityHint,
  getInferredLocation,
  isCityHintDismissed,
} from "@/lib/inferred-location";
import { cn } from "@/lib/utils";

export function SmartCityHint({ className }: { className?: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const inferred = getInferredLocation();
    if (!inferred.hasSignal || !inferred.city) {
      setVisible(false);
      return;
    }
    if (isCityHintDismissed(inferred.city)) {
      setVisible(false);
      return;
    }
    setCity(inferred.city);
    setHint(inferred.hint);
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2",
        className
      )}
    >
      <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
        <span className="truncate">{hint}</span>
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => router.push("/?focus=search")}
          className="pressable rounded-lg px-2.5 py-1 text-[11px] font-bold text-navy dark:text-gold"
        >
          Change city
        </button>
        <button
          type="button"
          onClick={() => {
            dismissCityHint(city);
            setVisible(false);
          }}
          className="pressable rounded-lg p-1 text-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
