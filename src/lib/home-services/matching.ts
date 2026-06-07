import {
  buildServiceSeoSlug,
  type ServiceProviderType,
} from "@/constants/serviceProviders";
import { isHomeServicesEnabled } from "@/lib/feature-flags";

export type ServiceMatchingCandidate = {
  providerId: string;
  providerType: ServiceProviderType;
  city: string;
  trustScore: number;
  riskScore: number;
  responsivenessScore: number;
  openJobs: number;
  complaintCount: number;
  score: number;
};

/** Internal matching prep — admin-controlled initially. */
export function scoreServiceProviderMatch(input: {
  trustScore: number;
  riskScore: number;
  responsivenessScore: number;
  openJobs: number;
  complaintCount: number;
  cityMatch: boolean;
  areaMatch: boolean;
  providerTypeMatch: boolean;
}): number {
  let score = 50;
  if (input.providerTypeMatch) score += 20;
  if (input.cityMatch) score += 15;
  if (input.areaMatch) score += 10;
  score += Math.min(20, (input.trustScore - 50) * 0.4);
  score -= Math.min(25, input.riskScore * 0.3);
  score += Math.min(10, input.responsivenessScore * 0.1);
  score -= input.openJobs * 4;
  score -= input.complaintCount * 6;
  return Math.round(score * 10) / 10;
}

export function listFutureSeoRoutes(cities: string[], types: ServiceProviderType[]): string[] {
  if (!isHomeServicesEnabled()) return [];
  return types.flatMap((type) => cities.map((city) => `/services/${buildServiceSeoSlug(type, city)}`));
}
