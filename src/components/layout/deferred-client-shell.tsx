"use client";

import dynamic from "next/dynamic";

const PwaInstallPrompt = dynamic(
  () => import("@/components/pwa/install-prompt").then((m) => m.PwaInstallPrompt),
  { ssr: false }
);

export function DeferredClientShell() {
  return <PwaInstallPrompt />;
}
