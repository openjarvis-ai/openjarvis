"use client";

import { useState, useEffect, useCallback } from "react";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatDuration, formatFileSize, generateId } from "@/lib/utils";
import { extractFramesOnePerSecond } from "@/lib/videoFrames";
import { RecordingSource } from "@/types";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  Monitor,
  AppWindow,
  Globe,
  AlertCircle,
  CircleDot,
  Send,
  ImageIcon,
  X,
  Images,
} from "lucide-react";

const sourceOptions: { value: RecordingSource; label: string; icon: typeof Monitor; desc: string }[] = [
  { value: "screen", label: "Entire Screen", icon: Monitor, desc: "Record your full display" },
  { value: "window", label: "Application Window", icon: AppWindow, desc: "Record a specific app" },
  { value: "tab", label: "Browser Tab", icon: Globe, desc: "Record a single tab" },
];

export function ScreenRecorder() {
  const {
    status,
    duration,
    error,
    previewUrl,
    recordedBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
  } = useScreenRecorder();
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<RecordingSource>("screen");
  const [uploading, setUploading] = useState(false);
  const [sendingFrames, setSendingFrames] = useState(false);
  const [workflowIdForOpus, setWorkflowIdForOpus] = useState("");
  const [lastRecordingId, setLastRecordingId] = useState<string | null>(null);
  const [screenshotUrls, setScreenshotUrls] = useState<string[] | null>(null);
  const [viewingFrameIndex, setViewingFrameIndex] = useState<number | null>(null);
  const [extractingToView, setExtractingToView] = useState(false);

  // Revoke object URLs when clearing or unmounting
  useEffect(() => {
    return () => {
      if (screenshotUrls) screenshotUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [screenshotUrls]);

  const clearScreenshots = useCallback(() => {
    if (screenshotUrls) {
      screenshotUrls.forEach((u) => URL.revokeObjectURL(u));
      setScreenshotUrls(null);
    }
    setViewingFrameIndex(null);
  }, [screenshotUrls]);

  const handleUpload = async () => {
    if (!recordedBlob) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", recordedBlob, `recording_${generateId("rec")}.webm`);
      const res = await fetch("/api/upload-recording", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        if (data.recordingId) setLastRecordingId(data.recordingId);
        toast("Recording uploaded successfully!", "success");
      } else {
        toast("Upload failed. Please try again.", "error");
      }
    } catch {
      toast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleViewScreenshots = async () => {
    if (!recordedBlob) return;
    setExtractingToView(true);
    clearScreenshots();
    try {
      toast("Extracting one frame per second…", "info");
      const frames = await extractFramesOnePerSecond(recordedBlob, duration);
      if (frames.length === 0) {
        toast("No frames could be extracted from the video.", "error");
        setExtractingToView(false);
        return;
      }
      const urls = frames.map((blob) => URL.createObjectURL(blob));
      setScreenshotUrls(urls);
      toast(`Showing ${urls.length} screenshot(s).`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to extract frames.", "error");
    } finally {
      setExtractingToView(false);
    }
  };

  const handleSendFramesToOpus = async () => {
    if (!recordedBlob) return;
    setSendingFrames(true);
    try {
      toast("Extracting one frame per second…", "info");
      const frames = await extractFramesOnePerSecond(recordedBlob, duration);
      if (frames.length === 0) {
        toast("No frames could be extracted from the video.", "error");
        setSendingFrames(false);
        return;
      }
      const urls = frames.map((blob) => URL.createObjectURL(blob));
      if (screenshotUrls) screenshotUrls.forEach((u) => URL.revokeObjectURL(u));
      setScreenshotUrls(urls);
      toast(`Sending ${frames.length} screenshot(s) to Opus…`, "info");
      const formData = new FormData();
      if (workflowIdForOpus.trim()) formData.append("workflowId", workflowIdForOpus.trim());
      if (lastRecordingId) formData.append("recordingId", lastRecordingId);
      frames.forEach((blob, i) => {
        formData.append(`screenshot_${i}`, blob, `frame_${i}.jpg`);
      });
      const res = await fetch("/api/send-screenshots-to-opus", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast(`${data.count} screenshot(s) sent to Opus successfully!`, "success");
      } else {
        toast(data.message || "Failed to send screenshots to Opus.", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to extract or send frames.", "error");
    } finally {
      setSendingFrames(false);
    }
  };

  const isIdle = status === "idle" || status === "error";
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isStopped = status === "stopped";

  return (
    <div className="space-y-6">
      {/* Source Selector — only when idle */}
      {isIdle && (
        <div className="card-elevated p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
            Choose what to record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sourceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedSource(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  selectedSource === opt.value
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10"
                    : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedSource === opt.value
                      ? "bg-brand-100 dark:bg-brand-900/30"
                      : "bg-surface-100 dark:bg-surface-800"
                  )}
                >
                  <opt.icon
                    className={cn(
                      "w-5 h-5",
                      selectedSource === opt.value
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-surface-500"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                    {opt.label}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={() => startRecording(selectedSource)}
            className="btn-primary mt-6 w-full sm:w-auto"
          >
            <Play className="w-4 h-4" />
            Start Recording
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={resetRecording}
              className="mt-2 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      {(isRecording || isPaused) && (
        <div className="card-elevated p-8 animate-slide-up">
          {/* Status indicator */}
          <div className="flex flex-col items-center gap-6">
            {/* Recording dot + timer */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isRecording
                    ? "bg-red-500 recording-indicator"
                    : "bg-amber-500"
                )}
              />
              <span className="text-sm font-medium text-surface-500">
                {isRecording ? "Recording" : "Paused"}
              </span>
            </div>

            {/* Timer */}
            <div className="font-mono text-5xl font-medium tracking-tight text-surface-900 dark:text-surface-100 tabular-nums">
              {formatDuration(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {isRecording ? (
                <button
                  onClick={pauseRecording}
                  className="btn-secondary"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="btn-primary"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button onClick={stopRecording} className="btn-danger">
                <Square className="w-4 h-4" />
                Stop
              </button>
            </div>

            {/* Source badge */}
            <div className="badge-brand flex items-center gap-1.5">
              <CircleDot className="w-3 h-3" />
              Capturing: {selectedSource}
            </div>
          </div>
        </div>
      )}

      {/* Requesting permission state */}
      {status === "requesting" && (
        <div className="card-elevated p-12 flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-brand-600 animate-pulse" />
          </div>
          <p className="text-sm text-surface-500 font-medium">
            Waiting for screen sharing permission…
          </p>
        </div>
      )}

      {/* Preview */}
      {isStopped && previewUrl && (
        <div className="card-elevated overflow-hidden animate-slide-up">
          <div className="aspect-video bg-black">
            <video
              src={previewUrl}
              controls
              className="w-full h-full"
              playsInline
            />
          </div>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                Recording Preview
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Duration: {formatDuration(duration)}
                {recordedBlob && ` · Size: ${formatFileSize(recordedBlob.size)}`}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setLastRecordingId(null);
                    clearScreenshots();
                    resetRecording();
                  }}
                  className="btn-ghost"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Recording
                </button>
                <button
                  onClick={handleViewScreenshots}
                  disabled={extractingToView}
                  className="btn-secondary"
                >
                  {extractingToView ? (
                    <ImageIcon className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Images className="w-4 h-4" />
                  )}
                  {extractingToView ? "Extracting…" : "View screenshots"}
                </button>
                <button
                  onClick={() => downloadRecording()}
                  className="btn-secondary"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-secondary"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                <button
                  onClick={handleSendFramesToOpus}
                  disabled={sendingFrames}
                  className="btn-primary"
                >
                  {sendingFrames ? (
                    <ImageIcon className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingFrames ? "Extracting & sending…" : "Send frames to Opus"}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                <label className="text-xs text-surface-500 font-medium">Workflow ID (optional)</label>
                <input
                  type="text"
                  value={workflowIdForOpus}
                  onChange={(e) => setWorkflowIdForOpus(e.target.value)}
                  placeholder="e.g. wf_001"
                  className="input-field flex-1 max-w-xs text-sm"
                />
                <span className="text-xs text-surface-400">
                  One screenshot per second will be sent to Opus.
                </span>
              </div>
            </div>
          </div>

          {/* Screenshot gallery */}
          {screenshotUrls && screenshotUrls.length > 0 && (
            <div className="p-5 pt-0 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  Screenshots ({screenshotUrls.length} frames, 1 per second)
                </h4>
                <button
                  type="button"
                  onClick={clearScreenshots}
                  className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {screenshotUrls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewingFrameIndex(i)}
                    className="aspect-video rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 hover:ring-2 ring-brand-500 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-900"
                  >
                    <img
                      src={url}
                      alt={`Frame at ${i}s`}
                      className="w-full h-full object-cover"
                    />
                    <span className="sr-only">View frame at {i}s</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-size screenshot modal */}
      {viewingFrameIndex !== null && screenshotUrls && screenshotUrls[viewingFrameIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingFrameIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View screenshot"
        >
          <button
            type="button"
            onClick={() => setViewingFrameIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-surface-800/80 text-white hover:bg-surface-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 max-w-[90vw] max-h-[90vh]">
            {viewingFrameIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingFrameIndex(viewingFrameIndex - 1);
                }}
                className="p-2 rounded-full bg-surface-800/80 text-white hover:bg-surface-700 shrink-0"
                aria-label="Previous"
              >
                ←
              </button>
            )}
            <img
              src={screenshotUrls[viewingFrameIndex]}
              alt={`Frame at ${viewingFrameIndex}s`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {screenshotUrls.length > 1 && viewingFrameIndex < screenshotUrls.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingFrameIndex(viewingFrameIndex + 1);
                }}
                className="p-2 rounded-full bg-surface-800/80 text-white hover:bg-surface-700 shrink-0"
                aria-label="Next"
              >
                →
              </button>
            )}
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/90 bg-black/50 px-3 py-1 rounded-full">
            Frame {viewingFrameIndex + 1} of {screenshotUrls.length} ({viewingFrameIndex}s)
          </p>
        </div>
      )}
    </div>
  );
}
