/**
 * Yike BTOS — Upgraded Transaction Saga Manager (Milestone 3)
 * Long-running process orchestrator coordinating Settlement, Execution, Workflow, Evidence, Trust, Lifecycle, & Communication.
 */

import { activeEventTransport } from "../events/transport";
import type { TimelineEvent } from "../types";

export type SagaState = "pending" | "executing" | "completed" | "failed" | "cancelled" | "compensated";

export type SagaStepStatus = "pending" | "executing" | "completed" | "failed" | "compensated";

export interface SagaStepRecord {
  stepId: string;
  name: string;
  domain: "settlement" | "execution" | "workflow" | "evidence" | "trust" | "lifecycle" | "communication";
  status: SagaStepStatus;
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
  timeoutMs?: number;
  attempts: number;
  maxAttempts: number;
}

export class TransactionSagaManager {
  public sagaId: string;
  public workspaceId: string;
  public sagaState: SagaState = "pending";
  private steps: SagaStepRecord[] = [];
  private executedSteps: SagaStepRecord[] = [];
  private static sagaRegistry: Map<string, TransactionSagaManager> = new Map();

  constructor(workspaceId: string, sagaId?: string) {
    this.workspaceId = workspaceId;
    this.sagaId = sagaId || `saga_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    TransactionSagaManager.sagaRegistry.set(this.sagaId, this);
  }

  public static getSaga(sagaId: string): TransactionSagaManager | undefined {
    return TransactionSagaManager.sagaRegistry.get(sagaId);
  }

  public addStep(
    name: string,
    domain: SagaStepRecord["domain"],
    execute: () => Promise<void>,
    compensate: () => Promise<void>,
    timeoutMs = 10000,
    maxAttempts = 3
  ): this {
    const stepId = `step_${this.steps.length + 1}_${Math.random().toString(36).substring(2, 6)}`;
    this.steps.push({
      stepId,
      name,
      domain,
      status: "pending",
      execute,
      compensate,
      timeoutMs,
      attempts: 0,
      maxAttempts,
    });
    return this;
  }

  /**
   * Executes long-running saga steps with timeout & retry handling.
   * Triggers compensating rollback if any step fails.
   */
  public async executeSaga(): Promise<boolean> {
    this.sagaState = "executing";

    for (const step of this.steps) {
      let stepSuccess = false;

      while (step.attempts < step.maxAttempts && !stepSuccess) {
        try {
          step.attempts += 1;
          step.status = "executing";

          // Execute with timeout promise racing
          await Promise.race([
            step.execute(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Saga Timeout after ${step.timeoutMs}ms`)), step.timeoutMs)
            ),
          ]);

          step.status = "completed";
          this.executedSteps.push(step);
          stepSuccess = true;
        } catch (err) {
          if (step.attempts >= step.maxAttempts) {
            step.status = "failed";
            this.sagaState = "failed";
            await this.rollbackSaga();
            return false;
          }
        }
      }
    }

    this.sagaState = "completed";
    return true;
  }

  /**
   * Compensates all executed steps in reverse order (LIFO)
   */
  public async rollbackSaga(): Promise<void> {
    const reverseExecuted = [...this.executedSteps].reverse();

    for (const step of reverseExecuted) {
      try {
        await step.compensate();
        step.status = "compensated";
      } catch (compErr) {
        // Log critical compensation error
      }
    }

    this.sagaState = "compensated";
  }

  /**
   * Cancels an active saga mid-flight and triggers rollback
   */
  public async cancelSaga(reason: string): Promise<void> {
    if (this.sagaState === "completed" || this.sagaState === "compensated") return;
    this.sagaState = "cancelled";
    await this.rollbackSaga();
  }
}
