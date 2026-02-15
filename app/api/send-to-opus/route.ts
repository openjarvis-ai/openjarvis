import { NextRequest, NextResponse } from "next/server";
import { SendCommentPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: SendCommentPayload = await request.json();

    // Validate: only accept workflowId and comment (+ optional recordingId)
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

    // Reject any extra fields (ratings, scores, etc.)
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

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    const commentId = `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      message: "Comment sent to Opus successfully.",
      commentId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }
}
