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
        <div className="relative overflow-hidden rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="relative p-8">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">
              Choose what to record
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Select your capture source to begin
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {sourceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSource(opt.value)}
                  className={cn(
                    "group flex flex-col items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                    "hover:scale-[1.02] active:scale-[0.99]",
                    selectedSource === opt.value
                      ? "border-brand-500 bg-brand-50/80 dark:bg-brand-900/20 shadow-sm ring-2 ring-brand-500/20"
                      : "border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30 hover:border-brand-300 dark:hover:border-brand-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      selectedSource === opt.value
                        ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400"
                        : "bg-white dark:bg-surface-700/80 text-surface-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 shadow-sm"
                    )}
                  >
                    <opt.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                      {opt.label}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Start button */}
            <button
              onClick={() => startRecording(selectedSource)}
              className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Recording
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={resetRecording}
              className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      {(isRecording || isPaused) && (
        <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-medium p-10 animate-slide-up">
          <div className="flex flex-col items-center gap-8">
            {/* Status indicator */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-100 dark:bg-surface-800/80">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0",
                  isRecording
                    ? "bg-red-500 recording-indicator"
                    : "bg-amber-500"
                )}
              />
              <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                {isRecording ? "Recording" : "Paused"}
              </span>
            </div>

            {/* Timer */}
            <div className="font-mono text-6xl font-medium tracking-tight text-surface-900 dark:text-surface-100 tabular-nums">
              {formatDuration(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {isRecording ? (
                <button
                  onClick={pauseRecording}
                  className="btn-secondary px-6 py-3 rounded-xl font-medium"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="btn-primary px-6 py-3 rounded-xl font-medium"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume
                </button>
              )}
              <button
                onClick={stopRecording}
                className="btn-danger px-6 py-3 rounded-xl font-medium"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </button>
            </div>

            {/* Source badge */}
            <div className="badge-brand flex items-center gap-2 px-3 py-1.5 text-sm">
              <CircleDot className="w-3.5 h-3.5" />
              Capturing: {selectedSource}
            </div>
          </div>
        </div>
      )}

      {/* Requesting permission state */}
      {status === "requesting" && (
        <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft p-16 flex flex-col items-center gap-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center animate-pulse">
            <Monitor className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Waiting for screen sharing permission…
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Please select a screen, window, or tab in the browser prompt
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      {isStopped && previewUrl && (
        <div className="rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 shadow-soft overflow-hidden animate-slide-up">
          <div className="aspect-video bg-surface-900">
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  Recording Preview
                </p>
                <p className="text-sm text-surface-500 mt-0.5">
                  Duration: {formatDuration(duration)}
                  {recordedBlob && ` · Size: ${formatFileSize(recordedBlob.size)}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setLastRecordingId(null);
                    clearScreenshots();
                    resetRecording();
                  }}
                  className="btn-ghost px-4 py-2.5 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Recording
                </button>
                <button
                  onClick={handleViewScreenshots}
                  disabled={extractingToView}
                  className="btn-secondary px-4 py-2.5 rounded-xl"
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
                  className="btn-secondary px-4 py-2.5 rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-secondary px-4 py-2.5 rounded-xl"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                <button
                  onClick={handleSendFramesToOpus}
                  disabled={sendingFrames}
                  className="btn-primary px-4 py-2.5 rounded-xl"
                >
                  {sendingFrames ? (
                    <ImageIcon className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingFrames ? "Extracting & sending…" : "Send frames to Opus"}
                </button>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
                <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                  Opus Workflow ID (optional)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={workflowIdForOpus}
                    onChange={(e) => setWorkflowIdForOpus(e.target.value)}
                    placeholder="e.g. m610yMivl2rx2Sdy"
                    className="input-field flex-1 max-w-sm text-sm rounded-xl"
                  />
                  <span className="text-xs text-surface-500">
                    One screenshot per second will be sent to Opus.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot gallery */}
          {screenshotUrls && screenshotUrls.length > 0 && (
            <div className="p-6 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                  Screenshots ({screenshotUrls.length} frames, 1 per second)
                </h4>
                <button
                  type="button"
                  onClick={clearScreenshots}
                  className="text-xs font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto rounded-xl p-1">
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
