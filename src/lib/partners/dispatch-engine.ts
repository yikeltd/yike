import type { PartnerProfile, DispatchJob, PartnerDiscipline } from "@/types/partner-platform";

export function findMatchingPartner(
  discipline: PartnerDiscipline,
  region: string,
  availablePartners: PartnerProfile[]
): PartnerProfile | null {
  const eligible = availablePartners.filter(
    (p) => p.status === "active" && p.discipline === discipline && p.geoFenceRegion.toLowerCase() === region.toLowerCase()
  );

  if (eligible.length === 0) return null;

  // Sort by highest rating and lowest active jobs
  return eligible.sort((a, b) => b.rating - a.rating || a.activeJobs - b.activeJobs)[0];
}

export function evaluateSlaBreach(dispatch: DispatchJob): {
  isBreached: boolean;
  elapsedMinutes: number;
  btosEventTriggered?: string;
} {
  const dispatchedTime = new Date(dispatch.dispatchedAt).getTime();
  const currentTime = new Date().getTime();
  const elapsedMinutes = Math.floor((currentTime - dispatchedTime) / (1000 * 60));

  const isBreached = elapsedMinutes > dispatch.slaMinutes && dispatch.status !== "completed";

  return {
    isBreached,
    elapsedMinutes,
    btosEventTriggered: isBreached ? "SlaBreached.v1" : undefined,
  };
}
