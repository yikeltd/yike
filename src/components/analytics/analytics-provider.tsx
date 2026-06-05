"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { recordVisit } from "@/lib/engagement";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    recordVisit();
  }, []);

  useEffect(() => {
    const query = searchParams?.toString();
    trackEvent("page_view", {
      path: pathname,
      query: query || undefined,
    });
  }, [pathname, searchParams]);

  return null;
}
