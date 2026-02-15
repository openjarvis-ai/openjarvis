"use client";

import { useState } from "react";
import { Workflow } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  XCircle,
  Send,
  Tag,
  Clock,
  Cpu,
  FileText,
  Loader2,
} from "lucide-react";

interface WorkflowDetailProps {
  workflow: Workflow;
}

const stepStatusIcon = {
  completed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  pending: <Circle className="w-5 h-5 text-surface-300 dark:text-surface-600" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
};

const stepStatusLabel = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

export function WorkflowDetail({ workflow }: WorkflowDetailProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendComment = async () => {
    if (!comment.trim()) {
      toast("Please enter a comment before sending.", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/send-to-opus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          comment: comment.trim(),
          recordingId: workflow.recordingId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Comment sent to Opus successfully!", "success");
        setComment("");
      } else {
        toast(data.message || "Failed to send comment.", "error");
      }
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workflow header */}
      <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft overflow-hidden">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-display font-medium text-surface-900 dark:text-surface-100">
                {workflow.title}
              </h2>
              <p className="mt-2 text-sm text-surface-500 leading-relaxed">
                {workflow.description}
              </p>
            </div>
            <span
              className={cn(
                "badge flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg",
                workflow.metadata.source === "Opus"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
              )}
            >
              {workflow.metadata.source}
            </span>
          </div>

          {/* Metadata chips */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-surface-500">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800/80">
              <Cpu className="w-4 h-4 text-surface-400" />
              {workflow.metadata.model} · v{workflow.metadata.version}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800/80">
              <Clock className="w-4 h-4 text-surface-400" />
              {(workflow.metadata.executionTime / 1000).toFixed(1)}s execution
            </span>
            {workflow.recordingId && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800/80">
                <FileText className="w-4 h-4 text-surface-400" />
                {workflow.recordingId}
              </span>
            )}
          </div>

          {/* Tags */}
          {workflow.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {workflow.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-100 dark:bg-surface-800/80 text-xs font-medium text-surface-600 dark:text-surface-400"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Steps timeline */}
      <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft overflow-hidden">
        <div className="p-6">
        <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-6">
          Workflow Steps
        </h3>
        <div className="space-y-0">
          {workflow.steps.map((step, idx) => (
            <div key={step.id} className="relative flex gap-5">
              {/* Timeline line */}
              {idx < workflow.steps.length - 1 && (
                <div className="absolute left-[10px] top-10 bottom-0 w-px bg-surface-200 dark:bg-surface-700" />
              )}
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5 relative z-10">
                {stepStatusIcon[step.status]}
              </div>
              {/* Content */}
              <div className="pb-8 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {step.order}. {step.title}
                  </p>
                  <span
                    className={cn(
                      "badge text-xs px-2.5 py-0.5",
                      step.status === "completed" && "badge-success",
                      step.status === "pending" && "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
                      step.status === "failed" && "badge-error"
                    )}
                  >
                    {stepStatusLabel[step.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-surface-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Comment Panel */}
      <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft overflow-hidden">
        <div className="p-6">
        <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">
          Send Comment to Opus
        </h3>
        <p className="text-sm text-surface-500 mb-4">
          Share your feedback about this workflow. Only text comments are accepted.
        </p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. The workflow missed the step where I opened the dashboard…"
          rows={4}
          className="input-field resize-none rounded-xl"
          maxLength={2000}
        />

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-xs text-surface-500">
            {comment.length}/2000 characters
          </span>
          <button
            onClick={handleSendComment}
            disabled={!comment.trim() || sending}
            className="btn-primary px-5 py-2.5 rounded-xl font-medium"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? "Sending…" : "Send Comment to Opus"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
