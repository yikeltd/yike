/**
 * Yike BTOS — Saga Recovery Service (Enterprise Enhancement 1)
 * Discovers and resumes interrupted in-flight sagas on application startup.
 */

import { sagaRepository, type PersistentSagaRecord } from "./saga-repository";
import { TransactionSagaManager } from "./saga";
import { BTOSLogger, btosTracer, btosMetrics } from "../observability";

export class SagaRecoveryService {
  private static instance: SagaRecoveryService;
  private isRecovering = false;

  public static getInstance(): SagaRecoveryService {
    if (!SagaRecoveryService.instance) {
      SagaRecoveryService.instance = new SagaRecoveryService();
    }
    return SagaRecoveryService.instance;
  }

  /**
   * Discovers and resumes all uncompleted in-flight sagas from persisted database checkpoints
   */
  public async recoverInFlightSagas(): Promise<PersistentSagaRecord[]> {
    if (this.isRecovering) return [];
    this.isRecovering = true;

    const span = btosTracer.startSpan("saga_recovery_service_startup");
    BTOSLogger.info("Initiating SagaRecoveryService scan for resumable sagas...");

    try {
      const resumableSagas = await sagaRepository.getResumableSagas();
      btosMetrics.incrementCounter("saga_recovery_scans", 1);

      for (const record of resumableSagas) {
        BTOSLogger.info(`Resuming persisted saga: ${record.sagaId}`, record.workspaceId, record.correlationId);
        
        let manager = TransactionSagaManager.getSaga(record.sagaId);
        if (!manager) {
          manager = new TransactionSagaManager(record.workspaceId, record.sagaId);
        }

        // Resume saga execution from last completed step
        await manager.executeSaga();
      }

      btosTracer.endSpan(span.spanId, "ok");
      return resumableSagas;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      btosTracer.endSpan(span.spanId, "error", errMsg);
      BTOSLogger.error(`SagaRecoveryService Exception: ${errMsg}`);
      return [];
    } finally {
      this.isRecovering = false;
    }
  }
}

export const sagaRecoveryService = SagaRecoveryService.getInstance();
