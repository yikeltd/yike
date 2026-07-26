/**
 * RulesEngine — named-rule evaluation over a `YipContext`, analogous to
 * listing-engine's `NAMED_VISIBILITY_RULES` / `NAMED_VALIDATION_RULES` but
 * scoped to cross-cutting marketplace intelligence rules rather than form
 * field rules.
 */
import type { YipContext } from "../context/types";

export type RuleEvaluator = (context: YipContext) => boolean;

export interface RulesEngine {
  register(ruleId: string, evaluator: RuleEvaluator): void;
  evaluate(ruleId: string, context: YipContext): boolean;
  has(ruleId: string): boolean;
}
