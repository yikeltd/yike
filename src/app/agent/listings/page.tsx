import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";
import Image from "next/image";

export default async function AgentListingsPage() {
  const { user } = await requireAgent();
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as Property[];

  return (
    <div className="space-y-4 px-3 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My listings</h1>
        <Link href="/agent/listings/new" className="text-sm font-medium text-primary">
          + New
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-sm text-muted">No listings yet.</p>
      ) : (
        <ul className="space-y-3">
          {listings.map((p) => (
            <li key={p.id}>
              <Link
                href={`/agent/listings/${p.id}/edit`}
                className="card-shadow flex gap-3 rounded-xl border border-border p-3"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={p.media_urls[0] ?? "/placeholder-property.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium line-clamp-1">{p.title}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(Number(p.price), p.payment_period, p.listing_type)}
                  </p>
                  <StatusBadge status={p.status} className="mt-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
