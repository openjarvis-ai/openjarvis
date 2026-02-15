import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedAssets, reviewSessions, workflows, workflowSteps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

const OPUS_BASE_URL = "https://operator.opus.com";

// In-memory store for active polling jobs
const pollingJobs = new Map<
  string,
  { status: string; result: unknown; lastPoll: string; decision?: boolean }
>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, message: "jobId query parameter is required." },
      { status: 400 }
    );
  }

  const job = pollingJobs.get(jobId);
  if (!job) {
    return NextResponse.json(
      { success: false, message: "No polling data found for this job." },
      { status: 404 }
    );
  }

  // Also fetch any generated assets for this job
  const assets = await db
    .select()
    .from(generatedAssets)
    .where(eq(generatedAssets.opusJobId, jobId));

  return NextResponse.json({
    success: true,
    data: {
      jobId,
      ...job,
      assets,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobExecutionId, workflowId } = body as {
      jobExecutionId?: string;
      workflowId?: string;
    };

    if (!jobExecutionId || !workflowId) {
      return NextResponse.json(
        {
          success: false,
          message: "jobExecutionId and workflowId are required.",
        },
        { status: 400 }
      );
    }

    const serviceKey = process.env.OPUS_SERVICE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { success: false, message: "OPUS_SERVICE_KEY not configured." },
        { status: 500 }
      );
    }

    // Step 1: Poll the Opus job status
    const statusRes = await fetch(
      `${OPUS_BASE_URL}/job/${jobExecutionId}/status`,
      {
        method: "GET",
        headers: { "x-service-key": serviceKey },
      }
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text().catch(() => "Unknown error");
      pollingJobs.set(jobExecutionId, {
        status: "error",
        result: errText,
        lastPoll: new Date().toISOString(),
      });
      return NextResponse.json(
        { success: false, message: `Opus API error: ${errText}` },
        { status: statusRes.status }
      );
    }

    const statusData = await statusRes.json();
    // Opus returns: "IN PROGRESS", "COMPLETED", or "FAILED"
    const jobStatus: string = statusData.status || "unknown";

    pollingJobs.set(jobExecutionId, {
      status: jobStatus,
      result: statusData,
      lastPoll: new Date().toISOString(),
    });

    // If FAILED, return early with error
    if (jobStatus === "FAILED") {
      return NextResponse.json({
        success: false,
        message: "Opus job failed.",
        data: { jobId: jobExecutionId, status: jobStatus },
      });
    }

    // Step 2: If COMPLETED, fetch the full results from /job/{id}/results
    if (jobStatus === "COMPLETED") {
      const resultsRes = await fetch(
        `${OPUS_BASE_URL}/job/${jobExecutionId}/results`,
        {
          method: "GET",
          headers: { "x-service-key": serviceKey },
        }
      );

      if (!resultsRes.ok) {
        const errText = await resultsRes.text().catch(() => "Unknown error");
        return NextResponse.json(
          { success: false, message: `Failed to fetch results: ${errText}` },
          { status: resultsRes.status }
        );
      }

      const resultsData = await resultsRes.json();
      const results = resultsData.results || {};
      const data = results.data || {};
      const now = new Date().toISOString();

      // Extract decision outcome (true = approved, false = needs re-request)
      const decision: boolean = data.decision === true || data.approved === true;

      // Extract tools/skills from results.data
      const extractedAssets = extractAssets(data);

      // Create a workflow entry to display on workflows page
      const newWorkflowId = generateId("wf");
      await db.insert(workflows).values({
        id: newWorkflowId,
        title: `Opus Generated Tools/Skills - ${new Date().toLocaleDateString()}`,
        description: `Generated from ${extractedAssets.length} asset(s). Decision: ${decision ? "Approved" : "Needs Review"}`,
        source: "Opus",
        version: "1.0.0",
        executionTime: 0,
        model: "opus-workflow",
        recordingId: null,
        tags: JSON.stringify(["opus-generated", decision ? "approved" : "pending"]),
        createdAt: now,
        updatedAt: now,
      });

      // Create workflow steps for each asset
      for (let i = 0; i < extractedAssets.length; i++) {
        const asset = extractedAssets[i];
        await db.insert(workflowSteps).values({
          id: generateId("step"),
          workflowId: newWorkflowId,
          order: i + 1,
          title: `${asset.type}: ${asset.name}`,
          description: JSON.stringify(asset.definition).substring(0, 200),
          status: decision ? "completed" : "pending",
        });
      }

      // Store assets in database
      for (const asset of extractedAssets) {
        const assetId = generateId("asset");
        await db.insert(generatedAssets).values({
          id: assetId,
          workflowId: newWorkflowId,
          opusJobId: jobExecutionId,
          type: asset.type,
          name: asset.name,
          definition: JSON.stringify(asset.definition),
          status: decision ? "approved" : "pending",
          createdAt: now,
        });
      }

      // Create a review session based on decision
      const reviewStatus = decision ? "approved" : "pending_review";
      await db.insert(reviewSessions).values({
        id: generateId("review"),
        workflowId: newWorkflowId,
        opusJobId: jobExecutionId,
        status: reviewStatus,
        feedback: decision ? "Auto-approved by Opus decision" : "Awaiting user review",
        createdAt: now,
        updatedAt: now,
      });

      // Update polling job with decision
      pollingJobs.set(jobExecutionId, {
        status: jobStatus,
        result: resultsData,
        lastPoll: now,
        decision,
      });

      // Re-fetch assets to return
      const assets = await db
        .select()
        .from(generatedAssets)
        .where(eq(generatedAssets.workflowId, newWorkflowId));

      return NextResponse.json({
        success: true,
        message: decision
          ? "Job completed. Assets approved by Opus."
          : "Job completed. Assets need review (decision: false).",
        data: {
          jobId: jobExecutionId,
          status: jobStatus,
          decision,
          needsReRequest: !decision,
          summary: results.summary || null,
          outputFiles: results.outputFiles || [],
          assets,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Job status: ${jobStatus}`,
      data: {
        jobId: jobExecutionId,
        status: jobStatus,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to poll Opus job";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * Extract tools and skills from Opus job results.data payload.
 * Expected structure:
 * {
 *   decision: true/false,
 *   tools: [...],
 *   skills: [...]
 * }
 */
function extractAssets(
  data: Record<string, unknown>
): Array<{ type: "tool" | "skill"; name: string; definition: Record<string, unknown> }> {
  const assets: Array<{
    type: "tool" | "skill";
    name: string;
    definition: Record<string, unknown>;
  }> = [];

  // Check for tools array
  const tools = (data.tools || data.generated_tools) as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(tools)) {
    for (const tool of tools) {
      assets.push({
        type: "tool",
        name: (tool.name as string) || "Unnamed Tool",
        definition: tool,
      });
    }
  }

  // Check for skills array
  const skills = (data.skills || data.generated_skills) as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(skills)) {
    for (const skill of skills) {
      assets.push({
        type: "skill",
        name: (skill.name as string) || "Unnamed Skill",
        definition: skill,
      });
    }
  }

  return assets;
}
