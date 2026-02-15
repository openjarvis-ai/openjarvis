import { NextRequest, NextResponse } from "next/server";
import { SendCommentPayload, OpusJobPayload } from "@/types";

const OPUS_BASE_URL = "https://operator.opus.com";

interface OpusInitiateResponse {
  jobExecutionId: string;
}

interface OpusExecuteResponse {
  success: boolean;
  message: string;
  jobExecutionId: string;
  jobPayloadSchemaInstance?: Record<string, unknown>;
}

/**
 * Parse comment text to extract structured data for Opus
 * Supports Review Feedback, Session Metadata, and Screen Captures
 */
function parseCommentToOpusPayload(comment: string): OpusJobPayload {
  const payload: OpusJobPayload = {};

  try {
    // Try to parse as JSON first
    const jsonData = JSON.parse(comment);
    
    // Check for Review Feedback structure
    if (jsonData.date && jsonData.reviewer_id && jsonData.feedback_text) {
      payload.reviewFeedback = {
        date: jsonData.date,
        reviewer_id: jsonData.reviewer_id,
        feedback_text: jsonData.feedback_text,
      };
    }
    
    // Check for Session Metadata structure
    if (jsonData.timestamp && jsonData.session_id && jsonData.active_applications) {
      payload.sessionMetadata = {
        timestamp: jsonData.timestamp,
        session_id: jsonData.session_id,
        active_applications: Array.isArray(jsonData.active_applications) 
          ? jsonData.active_applications 
          : [],
      };
    }
    
    // Check for Screen Captures structure
    if (jsonData.screen_captures && Array.isArray(jsonData.screen_captures)) {
      payload.screenCaptures = jsonData.screen_captures.map((capture: { image_file: string }) => ({
        image_file: capture.image_file,
      }));
    }
  } catch {
    // If not JSON, treat as plain review feedback
    payload.reviewFeedback = {
      date: new Date().toISOString().split('T')[0],
      reviewer_id: "unknown",
      feedback_text: comment,
    };
  }

  return payload;
}

/**
 * Convert OpusJobPayload to Opus API format
 */
function buildJobPayloadSchemaInstance(payload: OpusJobPayload): Record<string, { value: unknown; type: string; displayName: string }> {
  const schemaInstance: Record<string, { value: unknown; type: string; displayName: string }> = {};

  if (payload.reviewFeedback) {
    schemaInstance.review_feedback = {
      value: payload.reviewFeedback,
      type: "object",
      displayName: "Review Feedback Record",
    };
  }

  if (payload.sessionMetadata) {
    schemaInstance.session_metadata = {
      value: payload.sessionMetadata,
      type: "object",
      displayName: "Session Metadata",
    };
  }

  if (payload.screenCaptures) {
    schemaInstance.screen_captures = {
      value: payload.screenCaptures,
      type: "array",
      displayName: "Screen Capture Images",
    };
  }

  return schemaInstance;
}

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

    // Get service key from environment
    const serviceKey = process.env.OPUS_SERVICE_KEY;
    if (!serviceKey) {
      console.error("OPUS_SERVICE_KEY not configured in environment");
      return NextResponse.json(
        { success: false, message: "Opus service is not properly configured." },
        { status: 500 }
      );
    }

    // Parse comment into structured Opus payload
    const opusPayload = parseCommentToOpusPayload(body.comment);
    const jobPayloadSchemaInstance = buildJobPayloadSchemaInstance(opusPayload);

    if (Object.keys(jobPayloadSchemaInstance).length === 0) {
      return NextResponse.json(
        { success: false, message: "Unable to parse comment into valid Opus data format." },
        { status: 400 }
      );
    }

    // Step 1: Initiate job with Opus
    const initiateResponse = await fetch(`${OPUS_BASE_URL}/job/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceKey,
      },
      body: JSON.stringify({
        workflowId: body.workflowId,
        title: `OpenJarvis Feedback - ${body.recordingId || "Manual Entry"}`,
        description: `Feedback submission from OpenJarvis at ${new Date().toISOString()}`,
      }),
    });

    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error("Opus initiate job failed:", initiateResponse.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to initiate Opus job: ${initiateResponse.status} ${initiateResponse.statusText}` 
        },
        { status: 502 }
      );
    }

    const initiateData: OpusInitiateResponse = await initiateResponse.json();
    const { jobExecutionId } = initiateData;

    // Step 2: Execute job with payload
    const executeResponse = await fetch(`${OPUS_BASE_URL}/job/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceKey,
      },
      body: JSON.stringify({
        jobExecutionId,
        jobPayloadSchemaInstance,
      }),
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      console.error("Opus execute job failed:", executeResponse.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to execute Opus job: ${executeResponse.status} ${executeResponse.statusText}` 
        },
        { status: 502 }
      );
    }

    const executeData: OpusExecuteResponse = await executeResponse.json();

    return NextResponse.json({
      success: true,
      message: "Feedback sent to Opus successfully.",
      commentId: jobExecutionId,
      timestamp: new Date().toISOString(),
      opusJobId: executeData.jobExecutionId,
    });
  } catch (error) {
    console.error("Error in send-to-opus route:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid request body." 
      },
      { status: 400 }
    );
  }
}
