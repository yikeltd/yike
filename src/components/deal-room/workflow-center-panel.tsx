"use client";

import type { WorkflowAggregate } from "@/lib/deal-room/workflow/types";
import {
  Workflow,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  workflow: WorkflowAggregate;
  onCompleteTask?: (taskId: string) => void;
};

export function WorkflowCenterPanel({ workflow, onCompleteTask }: Props) {
  const completedTasks = workflow.tasks.filter((t) => t.taskStatus === "completed").length;
  const progressPercentage = workflow.tasks.length > 0 ? Math.round((completedTasks / workflow.tasks.length) * 100) : 0;

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER & PROGRESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#031B4E] text-[#E4B547] shadow-md">
            <Workflow className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Workflow & Orchestration Center
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                {workflow.workflowState}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Multi-Domain Task Board • {workflow.workflowType.replace("_", " ").toUpperCase()}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[#031B4E]">
            <span>Workflow Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#031B4E] to-[#E4B547] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* APPROVAL CHAIN STEPPER */}
      {workflow.approvalChain.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase text-slate-400">Sequential Approval Chain</h4>
          <div className="flex flex-wrap items-center gap-2">
            {workflow.approvalChain.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border",
                    step.status === "approved"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  )}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="capitalize">{step.role} Approval</span>
                  {step.status === "approved" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                {idx < workflow.approvalChain.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase text-slate-400">Actionable Tasks ({completedTasks} / {workflow.tasks.length})</h4>
        </div>

        <div className="space-y-2">
          {workflow.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold",
                    task.taskStatus === "completed" ? "bg-emerald-600" : "bg-[#031B4E]"
                  )}
                >
                  {task.taskStatus === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <ListTodo className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-[#031B4E]">{task.title}</h5>
                    <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 capitalize">
                      {task.assignedRole}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Priority: {task.priority.toUpperCase()} • Type: {task.taskType}
                  </p>
                </div>
              </div>

              {task.taskStatus !== "completed" && onCompleteTask && (
                <button
                  type="button"
                  onClick={() => onCompleteTask(task.id)}
                  className="pressable rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 min-h-[34px]"
                >
                  Mark Complete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
