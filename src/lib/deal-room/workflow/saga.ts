/**
 * Yike BTOS — Upgraded Durable Transaction Saga Manager (Enterprise Enhancement 1)
 * Checkpointed saga execution with persistent state repository, LIFO compensation, & recovery engine.
 */

import { activeEventTransport } from "../events/transport";
import { sagaRepository, type PersistentSagaRecord } from "./saga-repository";
import { BTOSLogger, btosTracer, btosMetrics } from "../observability";

export type SagaState = "pending" | "executing" | "waiting" | "retrying" | "completed" | "failed" | "cancelled" | "compensated";

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
  public correlationId: string;
  public sagaState: SagaState = "pending";
  private steps: SagaStepRecord[] = [];
  private executedSteps: SagaStepRecord[] = [];
  private currentStepIndex = 0;
  private static sagaRegistry: Map<string, TransactionSagaManager> = new Map();

  constructor(workspaceId: string, sagaId?: string, correlationId?: string) {
    this.workspaceId = workspaceId;
    this.sagaId = sagaId || `saga_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.correlationId = correlationId || `corr_${this.sagaId}`;
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
   * Executes long-running saga steps with step-by-step checkpoint persistence
   */
  public async executeSaga(): Promise<boolean> {
    const span = btosTracer.startSpan("execute_durable_saga", this.workspaceId);
    this.sagaState = "executing";

    // 1. Initial State Persistence
    await sagaRepository.saveSaga({
      id: `ps_${this.sagaId}`,
      sagaId: this.sagaId,
      workspaceId: this.workspaceId,
      correlationId: this.correlationId,
      sagaType: "transaction_workflow",
      currentStep: this.currentStepIndex,
      status: "executing",
      completedSteps: this.executedSteps.map((s) => s.name),
      pendingSteps: this.steps.map((s) => s.name),
      compensationStack: [],
      retryCount: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    for (let idx = this.currentStepIndex; idx < this.steps.length; idx++) {
      const step = this.steps[idx];
      this.currentStepIndex = idx;
      let stepSuccess = false;

      while (step.attempts < step.maxAttempts && !stepSuccess) {
        try {
          step.attempts += 1;
          step.status = "executing";

          await Promise.race([
            step.execute(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Saga Step Timeout (${step.name})`)), step.timeoutMs)
            ),
          ]);

          step.status = "completed";
          this.executedSteps.push(step);
          stepSuccess = true;

          // 2. Checkpoint Persistence after each step
          await sagaRepository.updateCheckpoint(
            this.sagaId,
            idx + 1,
            this.executedSteps.map((s) => s.name),
            "executing"
          );
        } catch (err: unknown) {
          if (step.attempts >= step.maxAttempts) {
            step.status = "failed";
            this.sagaState = "failed";
            const errMsg = err instanceof Error ? err.message : String(err);

            BTOSLogger.error(`Saga Step Failed: ${step.name} - ${errMsg}`, this.workspaceId, this.correlationId);
            btosMetrics.incrementCounter("saga_step_failures", 1);
            btosTracer.endSpan(span.spanId, "error", errMsg);

            await this.rollbackSaga();
            return false;
          }
        }
      }
    }

    this.sagaState = "completed";
    await sagaRepository.updateCheckpoint(
      this.sagaId,
      this.steps.length,
      this.executedSteps.map((s) => s.name),
      "completed"
    );

    btosMetrics.incrementCounter("sagas_completed", 1);
    btosTracer.endSpan(span.spanId, "ok");
    return true;
  }

  /**
   * Compensates executed steps in reverse order with persistence tracking
   */
  public async rollbackSaga(): Promise<void> {
    const reverseExecuted = [...this.executedSteps].reverse();

    for (const step of reverseExecuted) {
      try {
        await step.compensate();
        step.status = "compensated";
      } catch (compErr) {
        BTOSLogger.error(`Saga Compensation Step Failed: ${step.name}`, this.workspaceId);
      }
    }

    this.sagaState = "compensated";
    await sagaRepository.updateCheckpoint(
      this.sagaId,
      this.currentStepIndex,
      this.executedSteps.map((s) => s.name),
      "compensated"
    );
  }
}
