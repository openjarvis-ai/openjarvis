import { NextResponse } from "next/server";
import { getOpenClawClient, resetOpenClawClient } from "@/lib/openclaw-ws";

export async function GET() {
  const client = getOpenClawClient();
  return NextResponse.json({
    success: true,
    data: { status: client.status },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = (body as { action?: string }).action || "connect";

    if (action === "disconnect") {
      resetOpenClawClient();
      return NextResponse.json({
        success: true,
        message: "Disconnected from OpenClaw.",
        data: { status: "disconnected" },
      });
    }

    const client = getOpenClawClient();

    if (client.status === "connected") {
      return NextResponse.json({
        success: true,
        message: "Already connected to OpenClaw.",
        data: { status: "connected" },
      });
    }

    await client.connect();

    return NextResponse.json({
      success: true,
      message: "Connected to OpenClaw successfully.",
      data: { status: client.status },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect";
    return NextResponse.json(
      {
        success: false,
        message,
        data: { status: "error" },
      },
      { status: 500 }
    );
  }
}
