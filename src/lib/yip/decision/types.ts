/**
 * DecisionService — evaluates a context and returns a single recommended
 * next action (e.g. "ask for more photos", "flag for review"). CORE ships
 * a no-op implementation; decision logic beyond simple rules is V2.
 */
import type { Confidence } from "../shared/types";
import type { YipContext } from "../context/types";

export type Decision = {
  action: "none" | (string & {});
  reason: string;
  confidence: Confidence;
};

export interface DecisionService {
  decide(context: YipContext): Decision;
}
