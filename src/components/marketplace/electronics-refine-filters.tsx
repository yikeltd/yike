"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { cn } from "@/lib/utils";

/** Collapsible refine filters for electronics browse — preserves query via GET navigation. */
export function ElectronicsRefineFilters({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of fd.entries()) {
      const v = String(value).trim();
      if (v) params.set(key, v);
    }
    const qs = params.toString();
    router.push(qs ? `/electronics?${qs}` : "/electronics");
  }

  return (
    <form
      onSubmit={submit}
      className={cn("flex flex-col gap-3 px-3.5 py-3", className)}
    >
      <input
        name="q"
        defaultValue={sp.get("q") ?? ""}
        placeholder="Search brand, model, city…"
        className="w-full rounded-2xl border border-navy/15 px-4 py-2.5 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="category"
          defaultValue={sp.get("category") ?? ""}
          className="rounded-2xl border border-navy/15 px-3 py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {ELECTRONICS_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          name="brand"
          defaultValue={sp.get("brand") ?? ""}
          placeholder="Brand"
          className="rounded-2xl border border-navy/15 px-3 py-2.5 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="city"
          defaultValue={sp.get("city") ?? ""}
          placeholder="City"
          className="rounded-2xl border border-navy/15 px-3 py-2.5 text-sm"
        />
        <input
          name="state"
          defaultValue={sp.get("state") ?? ""}
          placeholder="State"
          className="rounded-2xl border border-navy/15 px-3 py-2.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="pressable rounded-2xl bg-navy px-5 py-2.5 text-sm font-bold text-white"
      >
        Apply filters
      </button>
    </form>
  );
}
