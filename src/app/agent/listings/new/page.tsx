import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAgentLister } from "@/lib/auth";
import {
  buildSellerVerifyUrl,
  mustCompleteSellerVerification,
} from "@/lib/seller-trust";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";
import { InstantListingWorkspace } from "@/components/listing-engine/instant-listing-workspace";

export const metadata = {
  title: "New listing | Yike",
  description: "List property, vehicles, or electronics on Yike.",
};

function listingWorkspaceReturnPath(
  sp: Record<string, string | string[] | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const key of ["category", "hint"] as const) {
    const v = sp[key];
    if (typeof v === "string" && v.trim()) qs.set(key, v.trim());
  }
  const tail = qs.toString();
  return tail ? `/agent/listings/new?${tail}` : "/agent/listings/new";
}

function WorkspaceFallback() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-40 w-full rounded-2xl" />
    </div>
  );
}

export default async function NewListingWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const returnPath = listingWorkspaceReturnPath(sp);

  const { user, profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
    returnPath,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(buildSellerVerifyUrl(returnPath));
  }

  return (
    <SellerFlowShell
      eyebrow="Sell on Yike"
      title="New listing"
      backHref="/agent/listings"
      backLabel="My listings"
      maxWidth="workspace"
      actions={
        <Link
          href="/search"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          Browse marketplace
        </Link>
      }
    >
      <Suspense fallback={<WorkspaceFallback />}>
        <InstantListingWorkspace agentId={user.id} />
      </Suspense>
    </SellerFlowShell>
  );
}
