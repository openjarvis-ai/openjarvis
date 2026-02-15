import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 }
      );
    }

    const recordingId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await db.insert(recordings).values({
      id: recordingId,
      name: `recording_${recordingId}`,
      duration: 0,
      size: file.size,
      status: "uploaded",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Recording uploaded successfully.",
      recordingId,
      size: file.size,
      timestamp: now,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { success: false, message: "Upload failed." },
      { status: 500 }
    );
  }
}
