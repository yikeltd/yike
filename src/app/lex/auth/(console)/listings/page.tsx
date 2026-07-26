import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminListingsPath } from "@/lib/admin-paths";
import { ModerationCard } from "@/components/admin/moderation-card";
import { ListingActions } from "@/components/admin/listing-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { parseAdminPage } from "@/lib/admin/pagination";
import { canPermanentlyDeleteListing } from "@/lib/admin/listing-delete";
import { propertyPath } from "@/lib/property-url";
import type { Property, Profile } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import { SampleBulkPurgeButton } from "@/components/admin/sample-bulk-purge-button";
import { isSampleListing } from "@/lib/mock-listings";
import { cn } from "@/lib/utils";

/** Slim projection for moderation queue — avoid `*` media_items / jsonb bloat. */
const LISTINGS_QUEUE_SELECT = `
  id, title, price, payment_period, listing_type, property_type, bedrooms,
  city, area, slug, status, media_urls, attributes, description, asset_type,
  created_at, agent_id, review_overall_score, review_risk_level,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, verification_status, verified_badge, role, phone, whatsapp
  )
`.replace(/\s+/g, " ").trim();

type QueueAgent = Pick<
  Profile,
  | "id"
  | "full_name"
  | "verification_status"
  | "verified_badge"
  | "role"
  | "phone"
  | "whatsapp"
>;

type QueueListing = Property & { agent: QueueAgent | null };

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    agent?: string;
    vertical?: string;
  }>;
}) {
  const { profile } = await requireAdmin();
  const allowPermanentDelete = canPermanentlyDeleteListing(profile.role);
  const sp = await searchParams;
  const tabs = ["pending", "approved", "hidden", "rejected"] as const;
  if (!sp.status || !tabs.includes(sp.status as (typeof tabs)[number])) {
    redirect(adminListingsPath("pending"));
  }
  const status = sp.status;
  const vertical =
    sp.vertical === "vehicle"
      ? "vehicle"
      : sp.vertical === "property"
        ? "property"
        : "all";
  const { page, from, to } = parseAdminPage(sp);

  let listings: QueueListing[] = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    let query = admin
      .from("properties")
      .select(LISTINGS_QUEUE_SELECT, { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (sp.agent) query = query.eq("agent_id", sp.agent);
    if (vertical === "vehicle") query = query.eq("asset_type", "VEHICLE");
    if (vertical === "property") {
      query = query.or("asset_type.eq.PROPERTY,asset_type.is.null");
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("[lex/listings]", error.message);
      loadError = "Could not load the moderation queue. Try again.";
    } else {
      listings = (data ?? []) as unknown as QueueListing[];
      total = count ?? 0;
    }
  } catch (err) {
    console.error("[lex/listings] fatal:", err);
    loadError = "Could not load the moderation queue. Try again.";
  }

  const pageParams = {
    status,
    agent: sp.agent,
    vertical: vertical === "all" ? undefined : vertical,
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">
          Moderate listings
        </h1>
        <p className="text-sm text-muted">{total} in queue</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {(
            [
              ["all", "All"],
              ["property", "Property"],
              ["vehicle", "Vehicles"],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={adminListingsPath(status, {
                ...(sp.agent ? { agent: sp.agent } : {}),
                ...(key !== "all" ? { vertical: key } : {}),
              })}
              className={
                vertical === key || (key === "all" && vertical === "all")
                  ? "font-bold text-gold-dark"
                  : "text-muted hover:text-navy"
              }
            >
              {label}
            </Link>
          ))}
        </div>
        <Link
          href="/lex/auth/listings/review"
          className="mt-2 inline-block text-sm font-bold text-gold-dark hover:underline"
        >
          Open bulk review →
        </Link>
        <SampleBulkPurgeButton />
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {tabs.map((s) => (
          <Link
            key={s}
            href={adminListingsPath(s, sp.agent ? { agent: sp.agent } : undefined)}
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
      {loadError ? (
        <p className="rounded-2xl bg-white py-16 text-center text-sm text-danger shadow-float">
          {loadError}
        </p>
      ) : listings.length === 0 ? (
        <p className="rounded-2xl bg-white py-16 text-center text-sm text-muted shadow-float">
          No {status} listings.
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-float lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface bg-surface/50 text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((p) => {
                  const thumb = Array.isArray(p.media_urls) ? p.media_urls[0] : undefined;
                  const pubPath = propertyPath(p);
                  const sample = isSampleListing(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-surface last:border-0"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/lex/auth/listings/${p.id}`}
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
                          <span className="min-w-0">
                            <span className="line-clamp-2 max-w-[220px] block">
                              {p.title}
                            </span>
                            {sample ? (
                              <span className="mt-1 inline-block rounded bg-navy/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
                                Sample Listing
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        {p.status === "approved" ? (
                          <Link
                            href={pubPath}
                            className="font-mono text-xs text-gold-dark hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {p.slug ?? "—"}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted" title="Live after approval">
                            {p.slug ?? "—"}
                          </span>
                        )}
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
                      <td className="px-4 py-4 align-top">
                        <ListingActions
                          propertyId={p.id}
                          title={p.title}
                          status={p.status}
                          agentId={p.agent?.id}
                          agentName={p.agent?.full_name ?? undefined}
                          agentWhatsapp={p.agent?.whatsapp}
                          agentPhone={p.agent?.phone}
                          isSample={sample}
                          allowPermanentDelete={allowPermanentDelete}
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
          <ul className="space-y-3 lg:hidden">
            {listings.map((p) => (
              <ModerationCard
                key={p.id}
                allowPermanentDelete={allowPermanentDelete}
                property={
                  {
                    ...p,
                    media_urls: Array.isArray(p.media_urls) ? p.media_urls : [],
                    agent: p.agent,
                  } as Property & { agent: Profile | null }
                }
              />
            ))}
          </ul>
          <AdminPagination
            basePath="/lex/auth/listings"
            total={total}
            page={page}
            params={pageParams}
          />
        </>
      )}
    </div>
  );
}
