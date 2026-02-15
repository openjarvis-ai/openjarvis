import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows as workflowsTable, workflowSteps } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { Workflow, WorkflowStep } from "@/types";

export async function GET() {
  try {
    const workflowRows = await db
      .select()
      .from(workflowsTable)
      .orderBy(desc(workflowsTable.createdAt));
    const allSteps = await db.select().from(workflowSteps);

    const data: Workflow[] = workflowRows.map((w) => {
      const steps: WorkflowStep[] = allSteps
        .filter((s) => s.workflowId === w.id)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          order: s.order,
          title: s.title,
          description: s.description,
          status: s.status as "completed" | "pending" | "failed",
        }));
      return {
        id: w.id,
        title: w.title,
        description: w.description,
        steps,
        metadata: {
          source: w.source as "OpenJarvis" | "Opus",
          version: w.version,
          executionTime: w.executionTime,
          model: w.model,
        },
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        recordingId: w.recordingId ?? undefined,
        tags: JSON.parse(w.tags) as string[],
      };
    });

    return NextResponse.json({
      success: true,
      message: "Workflows fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Failed to fetch workflows:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch workflows." },
      { status: 500 }
    );
  }
}
