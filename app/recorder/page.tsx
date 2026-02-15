"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ScreenRecorder } from "@/components/recorder/ScreenRecorder";

export default function RecorderPage() {
  return (
    <>
      <PageHeader
        title="Screen Recorder"
        description="Record your screen, window, or browser tab. Capture and send to Opus."
      />
      <ScreenRecorder />
    </>
  );
}
