"use client";

import { track as vercelTrack } from "@vercel/analytics";

const QUEUE_KEY = "yike_analytics_queue";
const MAX_QUEUE = 50;

export type AnalyticsEvent =
  | "page_view"
  | "whatsapp_click"
  | "call_click"
  | "save_listing"
  | "unsave_listing"
  | "property_request"
  | "search"
  | "share_listing"
  | "pwa_install_prompt"
  | "pwa_install_accept";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | undefined
>;

/** Lightweight event tracking — Vercel Analytics + local queue for debugging. */
export function trackEvent(name: AnalyticsEvent, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  const payload = Object.fromEntries(
    Object.entries(props ?? {}).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean>;

  try {
    vercelTrack(name, payload);
  } catch {
    /* analytics optional */
  }

  try {
    const prev = JSON.parse(
      localStorage.getItem(QUEUE_KEY) ?? "[]"
    ) as Array<{ name: string; props?: AnalyticsProps; at: number }>;
    prev.unshift({ name, props: payload, at: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(prev.slice(0, MAX_QUEUE)));
  } catch {
    /* ignore storage errors */
  }
}

export function getAnalyticsQueue() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
