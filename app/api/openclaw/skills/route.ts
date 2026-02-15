import { NextResponse } from "next/server";
import { getOpenClawClient } from "@/lib/openclaw-ws";
import { db } from "@/lib/db";
import { generatedAssets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const client = getOpenClawClient();

    if (client.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Not connected to OpenClaw." },
        { status: 400 }
      );
    }

    const response = await client.listSkills();

    return NextResponse.json({
      success: true,
      message: "Skills retrieved from OpenClaw.",
      data: response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list skills";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetId } = body as { assetId?: string };

    if (!assetId) {
      return NextResponse.json(
        { success: false, message: "assetId is required." },
        { status: 400 }
      );
    }

    // Fetch the asset from DB
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

    if (asset.type !== "skill") {
      return NextResponse.json(
        { success: false, message: "Asset is not a skill." },
        { status: 400 }
      );
    }

    const client = getOpenClawClient();

    if (client.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Not connected to OpenClaw." },
        { status: 400 }
      );
    }

    const definition = JSON.parse(asset.definition);

    // Push skill to OpenClaw by instructing the agent
    const installMessage = `Install the following skill:\nName: ${asset.name}\nDefinition: ${JSON.stringify(definition, null, 2)}`;
    const response = await client.sendMessage(installMessage);

    // Update asset status
    await db
      .update(generatedAssets)
      .set({ status: "pushed" })
      .where(eq(generatedAssets.id, assetId));

    return NextResponse.json({
      success: true,
      message: `Skill "${asset.name}" pushed to OpenClaw.`,
      data: response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to push skill";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
