import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  workflows as workflowsTable,
  workflowSteps,
  recordings,
  comments,
} from "@/lib/db/schema";
import { count, sum, desc } from "drizzle-orm";
import type { Recording, Workflow, WorkflowStep } from "@/types";

export async function GET() {
  try {
    const [recordingsCount] = await db.select({ value: count() }).from(recordings);
    const [workflowsCount] = await db.select({ value: count() }).from(workflowsTable);
    const [commentsCount] = await db.select({ value: count() }).from(comments);
    const [durationRow] = await db.select({ value: sum(recordings.duration) }).from(recordings);

    const totalRecordings = Number(recordingsCount?.value ?? 0);
    const totalWorkflows = Number(workflowsCount?.value ?? 0);
    const commentsSent = Number(commentsCount?.value ?? 0);
    const totalDuration = Number(durationRow?.value ?? 0);

    const workflowRows = await db.select().from(workflowsTable).orderBy(desc(workflowsTable.createdAt)).limit(10);
    const allSteps = await db.select().from(workflowSteps);
    const recordingRows = await db.select().from(recordings).orderBy(desc(recordings.createdAt)).limit(10);

    const workflows: Workflow[] = workflowRows.map((w) => {
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

    const recordingsData: Recording[] = recordingRows.map((r) => ({
      id: r.id,
      name: r.name,
      duration: r.duration,
      size: r.size,
      createdAt: r.createdAt,
      status: r.status as Recording["status"],
    }));

    return NextResponse.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        stats: {
          totalRecordings,
          totalWorkflows,
          commentsSent,
          totalDuration,
        },
        recordings: recordingsData,
        workflows,
      },
    });
  } catch (err) {
    console.error("Dashboard fetch failed:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard data." },
      { status: 500 }
    );
  }
}
