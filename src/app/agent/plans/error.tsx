"use client";

import Link from "next/link";

export default function AgentPlansError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-10 text-center">
      <h1 className="text-lg font-bold text-navy">Could not open plans</h1>
      <p className="text-sm text-muted">
        Something went wrong loading upgrades. You can try again or return to your profile.
      </p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link href="/agent" className="text-sm font-semibold text-navy underline">
          Back to profile
        </Link>
      </div>
    </div>
  );
}
