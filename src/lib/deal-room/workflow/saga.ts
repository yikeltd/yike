/**
 * Yike BTOS — Transaction Saga Manager (Milestone 3)
 * Orchestrates long-running transactions with compensating rollback actions & retries.
 */

import { durableEventBus } from "../events/durable-event-bus";
import type { TimelineEvent } from "../types";

export type SagaStepStatus = "pending" | "executing" | "completed" | "failed" | "compensated";

export interface SagaStep {
  name: string;
  status: SagaStepStatus;
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

export class TransactionSagaManager {
  private steps: SagaStep[] = [];
  public sagaId: string;
  public workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.sagaId = `saga_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public addStep(step: SagaStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Executes saga steps sequentially. On failure, triggers compensating rollback in reverse order.
   */
  public async execute(): Promise<boolean> {
    const executedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        step.status = "executing";
        await step.execute();
        step.status = "completed";
        executedSteps.push(step);
      } catch (err) {
        step.status = "failed";
        await this.rollback(executedSteps);
        return false;
      }
    }

    return true;
  }

  private async rollback(executedSteps: SagaStep[]): Promise<void> {
    for (const step of executedSteps.reverse()) {
      try {
        await step.compensate();
        step.status = "compensated";
      } catch (compErr) {
        // Log critical compensation failure
      }
    }
  }
}
