import { NextResponse } from "next/server";
import { getOpenClawClient } from "@/lib/openclaw-ws";
import { db } from "@/lib/db";
import { generatedAssets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const client = getOpenClawClient();

    if (client.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Not connected to OpenClaw." },
        { status: 400 }
      );
    }

    const response = await client.listTools();

    return NextResponse.json({
      success: true,
      message: "Tools retrieved from OpenClaw.",
      data: response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tools";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetId, toolName, args } = body as {
      assetId?: string;
      toolName?: string;
      args?: Record<string, unknown>;
    };

    const client = getOpenClawClient();

    if (client.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Not connected to OpenClaw." },
        { status: 400 }
      );
    }

    // If assetId provided, push the tool definition to OpenClaw
    if (assetId) {
      const [asset] = await db
        .select()
        .from(generatedAssets)
        .where(eq(generatedAssets.id, assetId))
        .limit(1);

      if (!asset) {
        return NextResponse.json(
          { success: false, message: "Asset not found." },
          { status: 404 }
        );
      }

      if (asset.type !== "tool") {
        return NextResponse.json(
          { success: false, message: "Asset is not a tool." },
          { status: 400 }
        );
      }

      const definition = JSON.parse(asset.definition);
      const installMessage = `Register the following tool:\nName: ${asset.name}\nDefinition: ${JSON.stringify(definition, null, 2)}`;
      const response = await client.sendMessage(installMessage);

      await db
        .update(generatedAssets)
        .set({ status: "pushed" })
        .where(eq(generatedAssets.id, assetId));

      return NextResponse.json({
        success: true,
        message: `Tool "${asset.name}" pushed to OpenClaw.`,
        data: response,
      });
    }

    // If toolName provided, invoke the tool
    if (toolName) {
      const response = await client.invokeTool(toolName, args || {});
      return NextResponse.json({
        success: true,
        message: `Tool "${toolName}" invoked.`,
        data: response,
      });
    }

    return NextResponse.json(
      { success: false, message: "Provide either assetId or toolName." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process tool request";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
