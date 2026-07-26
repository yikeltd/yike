/**
 * TrustAssessment — surfaces trust signals for a listing/seller (verified
 * badges, spam/scam flags). CORE ships a neutral stub; real scoring plugs
 * in behind this interface later without call sites changing.
 */
import type { Confidence } from "../shared/types";
import type { YipContext } from "../context/types";

export type TrustAssessment = {
  score: Confidence;
  signals: string[];
  flags: string[];
};

export interface TrustService {
  assess(context: YipContext): TrustAssessment;
}
