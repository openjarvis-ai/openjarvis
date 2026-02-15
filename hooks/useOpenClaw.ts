"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  OpenClawConnectionStatus,
  GeneratedAsset,
  ReviewSession,
  OpenClawEvent,
} from "@/types";

interface UseOpenClawReturn {
  connectionStatus: OpenClawConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => Promise<unknown>;
  assets: GeneratedAsset[];
  reviewSessions: ReviewSession[];
  activityFeed: OpenClawEvent[];
  approveAsset: (assetId: string) => Promise<void>;
  rejectAsset: (assetId: string, feedback: string) => Promise<void>;
  pollOpusJob: (jobExecutionId: string, workflowId: string) => Promise<void>;
  refreshAssets: (workflowId: string) => Promise<void>;
  loading: boolean;
}

export function useOpenClaw(workflowId?: string): UseOpenClawReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<OpenClawConnectionStatus>("disconnected");
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>([]);
  const [activityFeed, setActivityFeed] = useState<OpenClawEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/openclaw/connect");
        const data = await res.json();
        if (data.success) {
          setConnectionStatus(data.data.status);
        }
      } catch {
        setConnectionStatus("disconnected");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    setConnectionStatus("connecting");
    try {
      const res = await fetch("/api/openclaw/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      setConnectionStatus(data.data?.status || "error");
    } catch {
      setConnectionStatus("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await fetch("/api/openclaw/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setConnectionStatus("disconnected");
    } catch {
      // Ignore
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const res = await fetch("/api/openclaw/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();

    setActivityFeed((prev) => [
      ...prev,
      {
        type: "agent.message.complete" as const,
        data: JSON.stringify(data.data),
        timestamp: new Date().toISOString(),
      },
    ]);

    return data;
  }, []);

  const refreshAssets = useCallback(async (wfId: string) => {
    // This would fetch assets from a dedicated endpoint; for now,
    // we rely on opus-poll returning them
  }, []);

  const approveAsset = useCallback(
    async (assetId: string) => {
      setLoading(true);
      try {
        const asset = assets.find((a) => a.id === assetId);
        if (!asset) return;

        const endpoint =
          asset.type === "skill"
            ? "/api/openclaw/skills"
            : "/api/openclaw/tools";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId }),
        });
        const data = await res.json();

        if (data.success) {
          setAssets((prev) =>
            prev.map((a) =>
              a.id === assetId ? { ...a, status: "pushed" as const } : a
            )
          );
          setActivityFeed((prev) => [
            ...prev,
            {
              type: "agent.message.complete" as const,
              data: `Pushed ${asset.type} "${asset.name}" to OpenClaw`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    },
    [assets]
  );

  const rejectAsset = useCallback(
    async (assetId: string, feedback: string) => {
      setLoading(true);
      try {
        // Mark as rejected locally
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId ? { ...a, status: "rejected" as const } : a
          )
        );

        const asset = assets.find((a) => a.id === assetId);

        // Send feedback to Opus for reconfiguration
        if (asset && workflowId) {
          await fetch("/api/send-to-opus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId,
              comment: `Reconfigure ${asset.type} "${asset.name}": ${feedback}`,
            }),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [assets, workflowId]
  );

  const pollOpusJob = useCallback(
    async (jobExecutionId: string, wfId: string, screenshotsData?: FormData) => {
      // Clear existing poll
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      const poll = async () => {
        try {
          const res = await fetch("/api/opus-poll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobExecutionId, workflowId: wfId }),
          });
          const data = await res.json();

          if (data.data?.assets) {
            setAssets(
              data.data.assets.map((a: Record<string, unknown>) => ({
                ...a,
                definition:
                  typeof a.definition === "string"
                    ? JSON.parse(a.definition as string)
                    : a.definition,
              }))
            );
          }

          // Handle decision outcome
          if (data.data?.status === "COMPLETED") {
            const decision = data.data.decision;
            const needsReRequest = data.data.needsReRequest;

            setActivityFeed((prev) => [
              ...prev,
              {
                type: "agent.message.complete" as const,
                data: decision
                  ? "✓ Opus approved the generated tools/skills"
                  : "✗ Opus decision: false - Re-requesting automatically...",
                timestamp: new Date().toISOString(),
              },
            ]);

            // If decision is false, automatically re-send screenshots
            if (needsReRequest && screenshotsData) {
              setActivityFeed((prev) => [
                ...prev,
                {
                  type: "agent.message.complete" as const,
                  data: "Re-sending screenshots to Opus...",
                  timestamp: new Date().toISOString(),
                },
              ]);

              // Re-send screenshots
              const reRes = await fetch("/api/send-screenshots-to-opus", {
                method: "POST",
                body: screenshotsData,
              });
              const reData = await reRes.json();

              if (reData.success && reData.jobExecutionId) {
                // Start polling the new job
                pollOpusJob(reData.jobExecutionId, wfId, screenshotsData);
              }
            }

            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }

          if (data.data?.status === "FAILED") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch {
          // Silently retry on next interval
        }
      };

      await poll();
      pollIntervalRef.current = setInterval(poll, 5000);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    assets,
    reviewSessions,
    activityFeed,
    approveAsset,
    rejectAsset,
    pollOpusJob,
    refreshAssets,
    loading,
  };
}
