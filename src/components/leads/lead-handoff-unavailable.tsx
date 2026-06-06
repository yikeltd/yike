import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";

export function LeadHandoffUnavailable() {
  return (
    <div className="mx-auto min-h-[60vh] max-w-lg px-4 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface">
        <MessageCircle className="h-7 w-7 text-gold" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-navy">This chat link has expired</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        The agent handoff link may be old or already used. Search homes or contact
        the agent from the listing page instead.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/search"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
        >
          <Search className="h-4 w-4" />
          Search homes
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-navy"
        >
          Explore listings
        </Link>
      </div>
    </div>
  );
}
