import { NextRequest, NextResponse } from "next/server";

const MAX_SCREENSHOTS = 600; // e.g. 10 min at 1/sec
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const workflowId = formData.get("workflowId");
    const recordingId = formData.get("recordingId");

    const workflowIdStr =
      workflowId != null && typeof workflowId === "string" ? workflowId.trim() : undefined;
    const recordingIdStr =
      recordingId != null && typeof recordingId === "string" ? recordingId.trim() : undefined;

    const files: File[] = [];
    for (const [key] of formData.entries()) {
      if (key === "workflowId" || key === "recordingId") continue;
      const value = formData.get(key);
      if (value instanceof File && value.size > 0) {
        if (!ALLOWED_TYPES.has(value.type)) {
          return NextResponse.json(
            { success: false, message: `Invalid file type: ${value.type}. Allowed: image/jpeg, image/png, image/webp.` },
            { status: 400 }
          );
        }
        if (value.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { success: false, message: `File ${value.name} exceeds 5MB limit.` },
            { status: 400 }
          );
        }
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one screenshot file is required." },
        { status: 400 }
      );
    }

    if (files.length > MAX_SCREENSHOTS) {
      return NextResponse.json(
        { success: false, message: `Too many screenshots (max ${MAX_SCREENSHOTS}).` },
        { status: 400 }
      );
    }

    // Simulate sending screenshots to Opus (e.g. upload to storage and notify Opus)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const batchId = `screens_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      message: "Screenshots sent to Opus successfully.",
      batchId,
      count: files.length,
      workflowId: workflowIdStr,
      recordingId: recordingIdStr,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 }
    );
  }
}
