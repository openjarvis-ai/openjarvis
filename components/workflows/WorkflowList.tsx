"use client";

import { Workflow } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  GitBranch,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Timer,
} from "lucide-react";

interface WorkflowListProps {
  workflows: Workflow[];
  selectedId: string | null;
  onSelect: (workflow: Workflow) => void;
}

const statusCount = (workflow: Workflow, status: string) =>
  workflow.steps.filter((s) => s.status === status).length;

export function WorkflowList({ workflows, selectedId, onSelect }: WorkflowListProps) {
  return (
    <div className="space-y-2">
      {workflows.map((wf) => {
        const completed = statusCount(wf, "completed");
        const total = wf.steps.length;
        const failed = statusCount(wf, "failed");
        const isActive = selectedId === wf.id;

        return (
          <button
            key={wf.id}
            onClick={() => onSelect(wf)}
            className={cn(
              "w-full text-left p-4 rounded-xl border transition-all duration-200",
              isActive
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-sm"
                : "border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 bg-white dark:bg-surface-900"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    wf.metadata.source === "Opus"
                      ? "bg-violet-100 dark:bg-violet-900/30"
                      : "bg-teal-100 dark:bg-teal-900/30"
                  )}
                >
                  <GitBranch
                    className={cn(
                      "w-4 h-4",
                      wf.metadata.source === "Opus"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-teal-600 dark:text-teal-400"
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">
                    {wf.title}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5 line-clamp-1">
                    {wf.description}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "badge flex-shrink-0",
                  wf.metadata.source === "Opus"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                )}
              >
                {wf.metadata.source}
              </span>
            </div>

            {/* Metadata row */}
            <div className="mt-3 flex items-center gap-4 text-xs text-surface-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(wf.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {completed}/{total}
              </span>
              {failed > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle className="w-3 h-3" />
                  {failed} failed
                </span>
              )}
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {(wf.metadata.executionTime / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  failed > 0
                    ? "bg-gradient-to-r from-emerald-500 to-red-500"
                    : "bg-gradient-to-r from-brand-500 to-emerald-500"
                )}
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
