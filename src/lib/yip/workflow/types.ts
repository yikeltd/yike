/**
 * WorkflowOrchestrator — coordinates multi-step marketplace processes
 * (e.g. listing review → moderation → publish). CORE ships a stub that
 * reports every step as pending; real orchestration is V2.
 */
import type { YipContext } from "../context/types";

export type WorkflowStep = {
  id: string;
  status: "pending" | "in_progress" | "done" | "skipped";
};

export type WorkflowState = {
  workflowId: string;
  steps: WorkflowStep[];
};

export interface WorkflowOrchestrator {
  getState(workflowId: string, context: YipContext): WorkflowState;
  advance(workflowId: string, stepId: string, context: YipContext): WorkflowState;
}
