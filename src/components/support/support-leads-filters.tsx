"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "spam", label: "Spam" },
  { value: "unresolved", label: "Unresolved" },
  { value: "all", label: "All" },
] as const;

export function SupportLeadsFilters({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "active") params.delete("filter");
    else params.set("filter", value);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => setFilter(f.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            current === f.value
              ? "bg-navy text-white"
              : "border border-navy/15 bg-white text-navy"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
