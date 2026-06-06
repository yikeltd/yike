import { requireServerClient } from "@/lib/supabase/require-client";
import { ModerationCard } from "@/components/admin/moderation-card";
import { ListingActions } from "@/components/admin/listing-actions";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Property, Profile } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "pending" } = await searchParams;
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (id, full_name, verification_status)`
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  const listings = (data ?? []) as (Property & { agent: Profile })[];

  const tabs = ["pending", "approved", "hidden", "rejected"] as const;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">
          Moderate listings
        </h1>
        <p className="text-sm text-muted">{listings.length} in queue</p>
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {tabs.map((s) => (
          <Link
            key={s}
            href={`/lex/auth/listings?status=${s}`}
            className={cn(
              "pressable shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize",
              status === s
                ? "bg-gold text-navy shadow-glow-gold"
                : "bg-white text-muted shadow-float"
            )}
          >
            {s}
          </Link>
        ))}
      </div>
      {listings.length === 0 ? (
        <p className="rounded-2xl bg-white py-16 text-center text-sm text-muted shadow-float">
          No {status} listings.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-float lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface bg-surface/50 text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((p) => {
                  const thumb = p.media_urls[0];
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-surface last:border-0"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/properties/${p.id}`}
                          className="flex items-center gap-3 font-semibold text-navy hover:text-gold-dark"
                        >
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized={thumb.startsWith("http")}
                              />
                            ) : null}
                          </span>
                          <span className="line-clamp-2 max-w-[220px]">
                            {p.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-bold text-navy">
                        {formatPrice(
                          Number(p.price),
                          p.payment_period,
                          p.listing_type
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {p.area}, {p.city}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {p.agent?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-4">
                        <ListingActions
                          propertyId={p.id}
                          agentVerified={
                            !!(
                              p.agent?.verified_badge ||
                              p.agent?.role === "agent_verified" ||
                              p.agent?.verification_status === "approved"
                            )
                          }
                          compact
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {listings.map((p) => (
              <ModerationCard key={p.id} property={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
