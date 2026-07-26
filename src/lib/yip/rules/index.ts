import { YipError } from "../shared/errors";
import type { YipContext } from "../context/types";
import type { RuleEvaluator, RulesEngine } from "./types";

/** In-memory named-rule registry. Ships empty — no rules pre-registered in CORE. */
export class DefaultRulesEngine implements RulesEngine {
  private readonly rules = new Map<string, RuleEvaluator>();

  register(ruleId: string, evaluator: RuleEvaluator): void {
    this.rules.set(ruleId, evaluator);
  }

  has(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  evaluate(ruleId: string, context: YipContext): boolean {
    const evaluator = this.rules.get(ruleId);
    if (!evaluator) {
      throw new YipError("rule_not_found", `Rule "${ruleId}" is not registered.`, { ruleId });
    }
    return evaluator(context);
  }
}

export function createRulesEngine(): RulesEngine {
  return new DefaultRulesEngine();
}

export type { RuleEvaluator, RulesEngine } from "./types";
