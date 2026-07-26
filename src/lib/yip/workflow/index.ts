import type { YipContext } from "../context/types";
import type { WorkflowOrchestrator, WorkflowState } from "./types";

/** Stub — no persisted state, no step transitions. Returns an empty workflow shell. */
export class StubWorkflowOrchestrator implements WorkflowOrchestrator {
  getState(workflowId: string, _context: YipContext): WorkflowState {
    return { workflowId, steps: [] };
  }

  advance(workflowId: string, _stepId: string, _context: YipContext): WorkflowState {
    return { workflowId, steps: [] };
  }
}

export function createWorkflowOrchestrator(): WorkflowOrchestrator {
  return new StubWorkflowOrchestrator();
}

export type { WorkflowOrchestrator, WorkflowState, WorkflowStep } from "./types";
