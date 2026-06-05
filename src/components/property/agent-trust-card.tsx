import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { VerifiedBadge, TrustPill } from "@/components/ui/badge";
import { ContactButtons } from "./contact-buttons";
import { isVerifiedAgent, cn } from "@/lib/utils";
import { MessageCircle, Shield } from "lucide-react";

export function AgentTrustCard({
  agent,
  propertyId,
  title,
  area,
  city,
  listingType,
  propertyType,
  sticky,
  verified: verifiedProp,
}: {
  agent: Profile;
  propertyId?: string;
  title?: string;
  area?: string;
  city?: string;
  listingType?: string;
  propertyType?: string | null;
  sticky?: boolean;
  verified?: boolean;
}) {
  const verified =
    verifiedProp ?? isVerifiedAgent(agent.verification_status);

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-float-lg",
        verified && "ring-2 ring-gold/25",
        sticky && "lg:sticky lg:top-24"
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Listed by
      </p>
      <Link
        href={`/agents/${agent.id}`}
        className="mt-3 flex items-center gap-3 pressable"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt={agent.full_name ?? "Agent"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-gold">
              {(agent.full_name ?? "A").charAt(0)}
            </span>
          )}
        </div>
        <div>
          <p className="font-bold text-navy">{agent.full_name ?? "Agent"}</p>
          {agent.agent_type && (
            <p className="text-xs capitalize text-muted">
              {agent.agent_type.replace("_", " ")}
            </p>
          )}
        </div>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {verified ? <VerifiedBadge /> : <TrustPill />}
        {agent.trust_score > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-navy">
            <Shield className="h-3 w-3 text-gold" />
            {agent.trust_score}% trust
          </span>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <MessageCircle className="h-3.5 w-3.5 text-gold" />
        Contact via WhatsApp — typical response same day
      </p>
      {propertyId && title && area && city && listingType && (
        <div className="mt-5 border-t border-surface pt-5">
          <ContactButtons
            propertyId={propertyId}
            title={title}
            area={area}
            city={city}
            listingType={listingType}
            propertyType={propertyType}
            agentId={agent.id}
            phone={agent.phone}
            whatsapp={agent.whatsapp}
            layout="detail"
            placement="agent_card"
          />
        </div>
      )}
    </div>
  );
}

/** @deprecated use AgentTrustCard */
export const AgentCard = AgentTrustCard;
