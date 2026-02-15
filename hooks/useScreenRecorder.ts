"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RecorderStatus, RecordingSource } from "@/types";
import { generateId } from "@/lib/utils";

interface UseScreenRecorderReturn {
  status: RecorderStatus;
  duration: number;
  error: string | null;
  previewUrl: string | null;
  recordedBlob: Blob | null;
  startRecording: (source: RecordingSource) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  downloadRecording: (filename?: string) => void;
}

export function useScreenRecorder(): UseScreenRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [cleanup, previewUrl]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDuration(elapsed);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(
    async (source: RecordingSource) => {
      try {
        setStatus("requesting");
        setError(null);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setRecordedBlob(null);

        const displayMediaOptions: DisplayMediaStreamOptions = {
          video: {
            displaySurface:
              source === "screen"
                ? "monitor"
                : source === "window"
                  ? "window"
                  : "browser",
          },
          audio: true,
        };

        const stream =
          await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        streamRef.current = stream;

        // Handle user stopping share via browser UI
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        });

        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        pausedDurationRef.current = 0;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stopTimer();
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setRecordedBlob(blob);
          setStatus("stopped");

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorder.onerror = () => {
          setError("Recording encountered an error.");
          setStatus("error");
          cleanup();
        };

        mediaRecorder.start(15000); // Collect data every 15 seconds
        setDuration(0);
        setStatus("recording");
        startTimer();
      } catch (err: unknown) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Screen sharing permission was denied. Please allow access and try again."
            : err instanceof DOMException && err.name === "NotFoundError"
              ? "No screen source was selected. Please choose a screen to record."
              : "Failed to start recording. Please check your browser permissions.";
        setError(message);
        setStatus("error");
        cleanup();
      }
    },
    [cleanup, previewUrl, startTimer, stopTimer]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current = duration;
      stopTimer();
      setStatus("paused");
    }
  }, [duration, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setStatus("recording");
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setDuration(0);
    setStatus("idle");
    setError(null);
    pausedDurationRef.current = 0;
  }, [cleanup, previewUrl]);

  const downloadRecording = useCallback(
    (filename?: string) => {
      if (!recordedBlob) return;
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        filename || `recording_${generateId("rec")}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [recordedBlob]
  );

  return {
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
  };
}
