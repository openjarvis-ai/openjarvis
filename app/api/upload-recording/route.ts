import { NextRequest, NextResponse } from "next/server";

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

    // Simulate upload processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const recordingId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      message: "Recording uploaded successfully.",
      recordingId,
      size: file.size,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Upload failed." },
      { status: 500 }
    );
  }
}
