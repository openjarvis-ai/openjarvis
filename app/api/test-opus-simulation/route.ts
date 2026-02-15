import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedAssets, reviewSessions, workflows, workflowSteps } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

/**
 * Simulates the full flow:
 * 1. Opus returns tools/skills with decision
 * 2. Creates workflow entry
 * 3. Stores assets in DB
 * 4. Pushes approved assets to OpenClaw
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decision = true } = body as { decision?: boolean };

    const now = new Date().toISOString();

    // Simulate Opus response data
    const mockOpusData = {
      decision,
      tools: [
        {
          name: "screenshot_analyzer",
          description: "Analyzes screenshots for UI elements and patterns",
          parameters: {
            image_path: { type: "string", required: true },
            detect_elements: { type: "boolean", default: true },
          },
        },
        {
          name: "workflow_extractor",
          description: "Extracts workflow steps from sequential screenshots",
          parameters: {
            screenshots: { type: "array", required: true },
            min_confidence: { type: "number", default: 0.8 },
          },
        },
      ],
      skills: [
        {
          name: "ui_interaction_detection",
          description: "Detects user interactions in screen recordings",
          steps: [
            "Load screenshot sequence",
            "Identify UI elements",
            "Track cursor movements",
            "Extract interaction patterns",
          ],
        },
      ],
    };

    // Extract assets (same logic as opus-poll)
    const extractedAssets: Array<{
      type: "tool" | "skill";
      name: string;
      definition: Record<string, unknown>;
    }> = [];

    // Add tools
    if (mockOpusData.tools) {
      for (const tool of mockOpusData.tools) {
        extractedAssets.push({ type: "tool", name: tool.name, definition: tool });
      }
    }

    // Add skills
    if (mockOpusData.skills) {
      for (const skill of mockOpusData.skills) {
        extractedAssets.push({ type: "skill", name: skill.name, definition: skill });
      }
    }

    // Create workflow entry
    const newWorkflowId = generateId("wf");
    await db.insert(workflows).values({
      id: newWorkflowId,
      title: `Simulated Opus Tools/Skills - ${new Date().toLocaleDateString()}`,
      description: `Simulated generation of ${extractedAssets.length} asset(s). Decision: ${decision ? "Approved" : "Needs Review"}`,
      source: "Opus",
      version: "1.0.0",
      executionTime: 1500,
      model: "opus-simulation",
      recordingId: null,
      tags: JSON.stringify(["simulated", decision ? "approved" : "pending"]),
      createdAt: now,
      updatedAt: now,
    });

    // Create workflow steps
    for (let i = 0; i < extractedAssets.length; i++) {
      const asset = extractedAssets[i];
      await db.insert(workflowSteps).values({
        id: generateId("step"),
        workflowId: newWorkflowId,
        order: i + 1,
        title: `${asset.type}: ${asset.name}`,
        description: asset.definition.description as string || JSON.stringify(asset.definition).substring(0, 200),
        status: decision ? "completed" : "pending",
      });
    }

    // Store assets
    const assetIds: string[] = [];
    for (const asset of extractedAssets) {
      const assetId = generateId("asset");
      assetIds.push(assetId);
      await db.insert(generatedAssets).values({
        id: assetId,
        workflowId: newWorkflowId,
        opusJobId: "simulated-job-" + Date.now(),
        type: asset.type,
        name: asset.name,
        definition: JSON.stringify(asset.definition),
        status: decision ? "approved" : "pending",
        createdAt: now,
      });
    }

    // Create review session
    await db.insert(reviewSessions).values({
      id: generateId("review"),
      workflowId: newWorkflowId,
      opusJobId: "simulated-job-" + Date.now(),
      status: decision ? "approved" : "pending_review",
      feedback: decision ? "Auto-approved (simulation)" : "Awaiting review (simulation)",
      createdAt: now,
      updatedAt: now,
    });

    // If decision is true, push to OpenClaw
    let openClawResults: Array<{ assetId: string; name: string; pushed: boolean; error?: string }> = [];
    let openClawAvailable = false;

    if (decision) {
      try {
        const { getOpenClawClient } = await import("@/lib/openclaw-ws");
        const client = getOpenClawClient();

        // Check if already connected
        if (client.status === "connected") {
          openClawAvailable = true;
        } else {
          // Try to connect with timeout (gateway takes 2-5s for challenge)
          const connectPromise = client.connect();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 8000)
          );

          try {
            await Promise.race([connectPromise, timeoutPromise]);
            openClawAvailable = true;
          } catch {
            openClawAvailable = false;
          }
        }
      } catch {
        openClawAvailable = false;
      }

      if (!openClawAvailable) {
        return NextResponse.json({
          success: true,
          message: "Assets created but OpenClaw not available",
          data: {
            workflowId: newWorkflowId,
            decision,
            assetsCount: extractedAssets.length,
            openClawStatus: "unavailable",
            note: "Workflow created successfully. Connect to OpenClaw and manually push assets.",
          },
        });
      }

      // Push each asset to OpenClaw
      const { getOpenClawClient } = await import("@/lib/openclaw-ws");
      const client = getOpenClawClient();
      const { eq } = await import("drizzle-orm");

      for (let i = 0; i < extractedAssets.length; i++) {
        const asset = extractedAssets[i];
        const assetId = assetIds[i];

        try {
          const installMessage = `Install the following ${asset.type}:\n\nName: ${asset.name}\n\nDefinition:\n${JSON.stringify(asset.definition, null, 2)}`;

          await client.sendMessage(installMessage);

          openClawResults.push({
            assetId,
            name: asset.name,
            pushed: true,
          });

          // Update status to pushed
          await db
            .update(generatedAssets)
            .set({ status: "pushed" })
            .where(eq(generatedAssets.id, assetId));

        } catch (err) {
          openClawResults.push({
            assetId,
            name: asset.name,
            pushed: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: decision
        ? `Simulated Opus workflow created and ${openClawResults.filter(r => r.pushed).length}/${extractedAssets.length} assets pushed to OpenClaw`
        : "Simulated Opus workflow created (decision: false, awaiting review)",
      data: {
        workflowId: newWorkflowId,
        decision,
        assetsCount: extractedAssets.length,
        assets: extractedAssets.map((a, i) => ({
          id: assetIds[i],
          type: a.type,
          name: a.name,
          status: decision ? "approved" : "pending",
        })),
        openClaw: decision ? {
          pushed: openClawResults.filter(r => r.pushed).length,
          failed: openClawResults.filter(r => !r.pushed).length,
          results: openClawResults,
        } : null,
      },
    });
  } catch (error) {
    console.error("Test simulation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Simulation failed",
      },
      { status: 500 }
    );
  }
}
