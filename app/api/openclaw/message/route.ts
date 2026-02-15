import { NextResponse } from "next/server";
import { getOpenClawClient } from "@/lib/openclaw-ws";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body as { content?: string };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, message: "Message content is required." },
        { status: 400 }
      );
    }

    const client = getOpenClawClient();

    if (client.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Not connected to OpenClaw. Connect first." },
        { status: 400 }
      );
    }

    const response = await client.sendMessage(content.trim());

    return NextResponse.json({
      success: true,
      message: "Message sent to OpenClaw.",
      data: response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
