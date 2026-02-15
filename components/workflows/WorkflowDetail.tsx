"use client";

import { useState } from "react";
import { Workflow } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { useOpenClaw } from "@/hooks/useOpenClaw";
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
  Plug,
  PlugZap,
  Shield,
  ShieldX,
  ArrowUpCircle,
  MessageSquare,
  Wrench,
  Sparkles,
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

const statusColors: Record<string, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500 animate-pulse",
  disconnected: "bg-surface-400",
  error: "bg-red-500",
};

export function WorkflowDetail({ workflow }: WorkflowDetailProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});

  const {
    connectionStatus,
    connect,
    disconnect,
    assets,
    activityFeed,
    approveAsset,
    rejectAsset,
    loading: openClawLoading,
  } = useOpenClaw(workflow.id);

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

  const handleApprove = async (assetId: string) => {
    try {
      await approveAsset(assetId);
      toast("Asset pushed to OpenClaw!", "success");
    } catch {
      toast("Failed to push asset.", "error");
    }
  };

  const handleReject = async (assetId: string) => {
    const feedback = rejectFeedback[assetId];
    if (!feedback?.trim()) {
      toast("Please provide feedback for reconfiguration.", "error");
      return;
    }
    try {
      await rejectAsset(assetId, feedback.trim());
      toast("Asset rejected. Reconfiguration request sent.", "info");
      setRejectFeedback((prev) => ({ ...prev, [assetId]: "" }));
    } catch {
      toast("Failed to reject asset.", "error");
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

      {/* OpenClaw Connection Status */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                statusColors[connectionStatus]
              )}
            />
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              OpenClaw Connection
            </h3>
            <span className="text-xs text-surface-400 capitalize">
              {connectionStatus}
            </span>
          </div>
          <button
            onClick={connectionStatus === "connected" ? disconnect : connect}
            className={cn(
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              connectionStatus === "connected"
                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            )}
          >
            {connectionStatus === "connected" ? (
              <>
                <PlugZap className="w-3.5 h-3.5" />
                Disconnect
              </>
            ) : connectionStatus === "connecting" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Plug className="w-3.5 h-3.5" />
                Connect
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Assets Panel */}
      {assets.length > 0 && (
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Generated Assets
          </h3>
          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="border border-surface-200 dark:border-surface-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {asset.type === "tool" ? (
                        <Wrench className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                        {asset.name}
                      </span>
                      <span
                        className={cn(
                          "badge text-[10px]",
                          asset.type === "tool"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        )}
                      >
                        {asset.type}
                      </span>
                      <span
                        className={cn(
                          "badge text-[10px]",
                          asset.status === "pending" &&
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                          asset.status === "approved" && "badge-success",
                          asset.status === "pushed" && "badge-success",
                          asset.status === "rejected" && "badge-error"
                        )}
                      >
                        {asset.status}
                      </span>
                    </div>
                    {/* Definition preview */}
                    <pre className="mt-2 text-xs text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-lg p-3 overflow-x-auto max-h-32">
                      {JSON.stringify(asset.definition, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                {asset.status === "pending" && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(asset.id)}
                        disabled={
                          openClawLoading ||
                          connectionStatus !== "connected"
                        }
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        Approve & Push to OpenClaw
                      </button>
                      <button
                        onClick={() => handleReject(asset.id)}
                        disabled={openClawLoading}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      >
                        <ShieldX className="w-3.5 h-3.5" />
                        Reject & Reconfigure
                      </button>
                    </div>
                    {/* Feedback textarea for rejection */}
                    <textarea
                      value={rejectFeedback[asset.id] || ""}
                      onChange={(e) =>
                        setRejectFeedback((prev) => ({
                          ...prev,
                          [asset.id]: e.target.value,
                        }))
                      }
                      placeholder="Feedback for reconfiguration (required for rejection)…"
                      rows={2}
                      className="input-field resize-none text-xs"
                      maxLength={1000}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OpenClaw Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            OpenClaw Activity
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activityFeed.map((event, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-surface-500"
              >
                <span className="text-surface-300 dark:text-surface-600 flex-shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="break-all">{event.data}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
