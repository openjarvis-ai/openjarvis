import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { SendCommentPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: SendCommentPayload = await request.json();

    if (!body.workflowId || typeof body.workflowId !== "string") {
      return NextResponse.json(
        { success: false, message: "workflowId is required and must be a string." },
        { status: 400 }
      );
    }

    if (!body.comment || typeof body.comment !== "string" || body.comment.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "comment is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (body.comment.length > 2000) {
      return NextResponse.json(
        { success: false, message: "comment must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    const allowedKeys = new Set(["workflowId", "comment", "recordingId"]);
    const extraKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
    if (extraKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected fields: ${extraKeys.join(", ")}. Only workflowId, comment, and recordingId are accepted.`,
        },
        { status: 400 }
      );
    }

    const commentId = `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await db.insert(comments).values({
      id: commentId,
      workflowId: body.workflowId,
      comment: body.comment.trim(),
      recordingId: body.recordingId ?? null,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Comment sent to Opus successfully.",
      commentId,
      timestamp: now,
    });
  } catch (err) {
    console.error("Send to Opus failed:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }
}
