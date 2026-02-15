"use client";

import { Workflow } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  GitBranch,
  Clock,
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
    <div className="space-y-3">
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
              "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300",
              "hover:scale-[1.01] active:scale-[0.99]",
              isActive
                ? "border-brand-500 bg-brand-50/80 dark:bg-brand-900/20 shadow-sm ring-2 ring-brand-500/20"
                : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-brand-300 dark:hover:border-brand-700/50 hover:shadow-soft"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                    wf.metadata.source === "Opus"
                      ? "bg-violet-100 dark:bg-violet-900/40"
                      : "bg-teal-100 dark:bg-teal-900/40"
                  )}
                >
                  <GitBranch
                    className={cn(
                      "w-5 h-5",
                      wf.metadata.source === "Opus"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-teal-600 dark:text-teal-400"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {wf.title}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                    {wf.description}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "badge flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg",
                  wf.metadata.source === "Opus"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                )}
              >
                {wf.metadata.source}
              </span>
            </div>

            {/* Metadata row */}
            <div className="mt-4 flex items-center flex-wrap gap-3 text-xs text-surface-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(wf.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {completed}/{total}
              </span>
              {failed > 0 && (
                <span className="flex items-center gap-1.5 text-red-500 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {failed} failed
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                {(wf.metadata.executionTime / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
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
