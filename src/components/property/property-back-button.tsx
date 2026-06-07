"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function PropertyBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="pressable mb-2 flex items-center gap-0.5 text-sm font-semibold text-navy lg:hidden"
      aria-label="Go back"
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      Back
    </button>
  );
}
