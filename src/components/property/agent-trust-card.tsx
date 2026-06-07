import Image from "next/image";
import Link from "next/link";
import type { Profile, PaymentPeriod, ListingType } from "@/types/database";
import { VerifiedBadge, TrustPill, ResponsiveBadge, DeveloperBadge, AgencyBadge } from "@/components/ui/badge";
import { ContactButtons } from "./contact-buttons";
import { isVerifiedAgent, cn } from "@/lib/utils";
import {
  getAgentActiveStatus,
  getAgentMicroLabel,
  getAgentResponseLabel,
  isResponsiveAgent,
} from "@/lib/agent-response";
import { agentPublicPath } from "@/lib/agent-slugs";
import { MessageCircle } from "lucide-react";

export function AgentTrustCard({
  agent,
  propertyId,
  title,
  area,
  city,
  listingType,
  propertyType,
  bedrooms,
  price,
  paymentPeriod,
  sticky,
  verified: verifiedProp,
  contactClicks,
  recentLeads,
  hideContact,
}: {
  agent: Profile;
  propertyId?: string;
  title?: string;
  area?: string;
  city?: string;
  listingType?: ListingType;
  propertyType?: string | null;
  bedrooms?: number;
  price?: number;
  paymentPeriod?: PaymentPeriod;
  sticky?: boolean;
  verified?: boolean;
  contactClicks?: number;
  recentLeads?: number;
  /** Hide CTAs on mobile detail — sticky bar handles contact */
  hideContact?: boolean;
}) {
  const verified = verifiedProp ?? isVerifiedAgent(agent);
  const responsive = isResponsiveAgent(agent);
  const isDeveloper = agent.account_type === "developer";
  const isAgency =
    agent.account_type === "agency" || agent.agent_type === "agency";
  const signals = { contactClicks, recentLeads };
  const responseLabel = getAgentResponseLabel(agent, signals);
  const microLabel = getAgentMicroLabel(agent, signals);
  const activeStatus = getAgentActiveStatus(signals);

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
        href={agentPublicPath(agent)}
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
        {responsive ? <ResponsiveBadge size="sm" /> : null}
        {isDeveloper && agent.developer_verified ? <DeveloperBadge /> : null}
        {isAgency && agent.agency_verified ? <AgencyBadge /> : null}
        {microLabel && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {microLabel}
          </span>
        )}
        {activeStatus === "popular" && (
          <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-gold-dark">
            Popular agent
          </span>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <MessageCircle className="h-3.5 w-3.5 text-gold" />
        {responseLabel}
      </p>
      {!hideContact &&
        propertyId &&
        title &&
        area &&
        city &&
        listingType &&
        price != null &&
        paymentPeriod && (
          <div className="mt-5 border-t border-surface pt-5">
            <ContactButtons
              propertyId={propertyId}
              title={title}
              area={area}
              city={city}
              listingType={listingType}
              propertyType={propertyType}
              bedrooms={bedrooms}
              agentId={agent.id}
              agentName={agent.full_name ?? "Agent"}
              price={price}
              paymentPeriod={paymentPeriod}
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
