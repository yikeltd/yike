import type { Profile, Property } from "@/types/database";
import { PropertyFeed } from "@/components/property/property-feed";
import { isDemoProperty } from "@/lib/mock-listings";

function splitDeveloperListings(listings: Property[]) {
  const current: Property[] = [];
  const completed: Property[] = [];
  for (const p of listings) {
    const tag = (p.title + " " + (p.description ?? "")).toLowerCase();
    if (tag.includes("completed") || tag.includes("sold out") || tag.includes("handed over")) {
      completed.push(p);
    } else {
      current.push(p);
    }
  }
  return { current, completed };
}

export function AgencyDeveloperProfileSections({
  agent,
  listings,
}: {
  agent: Profile;
  listings: Property[];
}) {
  const isAgency = agent.account_type === "agency" || agent.agent_type === "agency";
  const isDeveloper = agent.account_type === "developer";
  const isDemo = listings.every((p) => isDemoProperty(p.id));

  if (!isAgency && !isDeveloper) return null;

  if (isAgency) {
    return (
      <section className="space-y-4 rounded-2xl border border-border bg-white p-4">
        <div>
          <h2 className="text-sm font-bold text-navy">About this agency</h2>
          <p className="mt-2 text-sm text-muted">
            {agent.company_bio?.trim() ||
              "Professional property agency on Yike — browse active listings below."}
          </p>
          {agent.office_address ? (
            <p className="mt-2 text-xs text-navy/80">{agent.office_address}</p>
          ) : null}
        </div>
      </section>
    );
  }

  const { current, completed } = splitDeveloperListings(listings);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-4">
        <h2 className="text-sm font-bold text-navy">Developer showcase</h2>
        <p className="mt-2 text-sm text-muted">
          {agent.company_bio?.trim() || "Projects and listings from this developer on Yike."}
        </p>
      </section>

      {current.length > 0 ? (
        <section>
          <h2 className="mb-3 px-1 text-sm font-bold text-navy">Current projects</h2>
          <PropertyFeed properties={current} isDemo={isDemo} />
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section>
          <h2 className="mb-3 px-1 text-sm font-bold text-navy">Completed projects</h2>
          <PropertyFeed properties={completed} isDemo={isDemo} />
        </section>
      ) : null}
    </div>
  );
}
