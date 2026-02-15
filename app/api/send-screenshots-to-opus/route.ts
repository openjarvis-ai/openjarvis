import { NextRequest, NextResponse } from "next/server";

const MAX_SCREENSHOTS = 600;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OPUS_BASE_URL = "https://operator.opus.com";
<<<<<<< HEAD
const OPUS_WORKFLOW_ID = "m610yMivI2rx2Sdy";
=======

interface OpusInitiateResponse {
  jobExecutionId: string;
}

interface OpusExecuteResponse {
  success: boolean;
  message: string;
  jobExecutionId: string;
}
>>>>>>> 6052215 (feat: openclaw connection)

export async function POST(request: NextRequest) {
  console.log("[send-screenshots-to-opus] POST request received");
  try {
    const formData = await request.formData();
    const recordingId = formData.get("recordingId");
    console.log("[send-screenshots-to-opus] Using hardcoded workflowId:", OPUS_WORKFLOW_ID, "recordingId:", recordingId);

<<<<<<< HEAD
=======
    // workflowId is optional - for internal tracking only
    const workflowIdStr =
      workflowId && typeof workflowId === "string" && workflowId.trim()
        ? workflowId.trim()
        : undefined;
>>>>>>> 6052215 (feat: openclaw connection)
    const recordingIdStr =
      recordingId != null && typeof recordingId === "string"
        ? recordingId.trim()
        : undefined;

    // Collect screenshot files
    const files: File[] = [];
    const fileUrls: string[] = [];

    for (const [key] of formData.entries()) {
      if (key === "recordingId") continue;
      const value = formData.get(key);
      if (value instanceof File && value.size > 0) {
        console.log(`[send-screenshots-to-opus] Processing file: ${value.name}, type: ${value.type}, size: ${value.size} bytes`);
        if (!ALLOWED_TYPES.has(value.type)) {
          console.log(`[send-screenshots-to-opus] Rejecting invalid file type: ${value.type}`);
          return NextResponse.json(
            {
              success: false,
              message: `Invalid file type: ${value.type}. Allowed: image/jpeg, image/png, image/webp.`,
            },
            { status: 400 }
          );
        }
        if (value.size > MAX_FILE_SIZE_BYTES) {
          console.log(`[send-screenshots-to-opus] Rejecting file ${value.name} - exceeds size limit`);
          return NextResponse.json(
            { success: false, message: `File ${value.name} exceeds 5MB limit.` },
            { status: 400 }
          );
        }
        files.push(value);

        // Convert to base64 data URL for Opus
        const arrayBuffer = await value.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const dataUrl = `data:${value.type};base64,${base64}`;
        fileUrls.push(dataUrl);
      }
    }
    console.log(`[send-screenshots-to-opus] Total files collected: ${files.length}`);

    if (files.length === 0) {
      console.log("[send-screenshots-to-opus] Error: No files provided");
      return NextResponse.json(
        { success: false, message: "At least one screenshot file is required." },
        { status: 400 }
      );
    }

    if (files.length > MAX_SCREENSHOTS) {
      console.log(`[send-screenshots-to-opus] Error: Too many screenshots (${files.length} > ${MAX_SCREENSHOTS})`);
      return NextResponse.json(
        {
          success: false,
          message: `Too many screenshots (max ${MAX_SCREENSHOTS}).`,
        },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Get service key from environment
    const serviceKey = process.env.OPUS_SERVICE_KEY;
    if (!serviceKey) {
      console.error("[send-screenshots-to-opus] OPUS_SERVICE_KEY not configured in environment");
      return NextResponse.json(
        { success: false, message: "Opus service is not properly configured." },
        { status: 500 }
      );
    }

    // Step 1: Upload files to Opus
    console.log("[send-screenshots-to-opus] Uploading files to Opus...");
    const fileUrls: string[] = [];

    for (const file of files) {
      // Get extension from file type
      const extMap: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      };
      const fileExtension = extMap[file.type] || ".jpg";
      
      console.log(`[send-screenshots-to-opus] Getting upload URL for ${file.name}...`);
      
      // Get presigned upload URL
      const uploadUrlResponse = await fetch(`${OPUS_BASE_URL}/job/file/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": serviceKey,
        },
        body: JSON.stringify({
          fileExtension,
          accessScope: "workspace",
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        console.error(`[send-screenshots-to-opus] Failed to get upload URL for ${file.name}:`, uploadUrlResponse.status, errorText);
        return NextResponse.json(
          {
            success: false,
            message: `Failed to get upload URL: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`,
          },
          { status: 502 }
        );
      }

      const { presignedUrl, fileUrl } = await uploadUrlResponse.json();
      console.log(`[send-screenshots-to-opus] Got upload URL for ${file.name}, uploading...`);

      // Upload file to presigned URL
      const fileBuffer = await file.arrayBuffer();
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`[send-screenshots-to-opus] Failed to upload ${file.name}:`, uploadResponse.status, errorText);
        return NextResponse.json(
          {
            success: false,
            message: `Failed to upload file ${file.name}: ${uploadResponse.status}`,
          },
          { status: 502 }
        );
      }

      fileUrls.push(fileUrl);
      console.log(`[send-screenshots-to-opus] Successfully uploaded ${file.name}`);
    }
    
    console.log(`[send-screenshots-to-opus] All ${fileUrls.length} files uploaded successfully`);

    // Step 2: Initiate job with Opus
    console.log("[send-screenshots-to-opus] Initiating job with Opus...");
    const initiateResponse = await fetch(`${OPUS_BASE_URL}/job/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceKey,
      },
      body: JSON.stringify({
        workflowId: OPUS_WORKFLOW_ID,
        title: `OpenJarvis Screenshots - ${recordingIdStr || "Batch Upload"}`,
        description: `Screenshot batch uploaded from OpenJarvis at ${new Date().toISOString()}`,
      }),
    });

    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error("[send-screenshots-to-opus] Opus initiate job failed:", initiateResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to initiate Opus job: ${initiateResponse.status} ${initiateResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const initiateData = await initiateResponse.json();
    const { jobExecutionId } = initiateData;
    console.log(`[send-screenshots-to-opus] Job initiated with ID: ${jobExecutionId}`);

    // Step 3: Execute job with screenshot payload
    console.log("[send-screenshots-to-opus] Executing job with screenshots...");
    const executeResponse = await fetch(`${OPUS_BASE_URL}/job/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceKey,
      },
      body: JSON.stringify({
        jobExecutionId,
        jobPayloadSchemaInstance: {
          screen_capture_images: {
            value: fileUrls,
            type: "array_files",
            displayName: "Screen Capture Images",
          },
        },
      }),
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      console.error("[send-screenshots-to-opus] Opus execute job failed:", executeResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to execute Opus job: ${executeResponse.status} ${executeResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const executeData = await executeResponse.json();
    console.log(`[send-screenshots-to-opus] Success! Job executed: ${executeData.jobExecutionId}`);

    const batchId = `screens_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[send-screenshots-to-opus] Success! batchId: ${batchId}, count: ${files.length}`);
=======
    const serviceKey = process.env.OPUS_SERVICE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { success: false, message: "Opus service is not configured." },
        { status: 500 }
      );
    }

    // Opus workflow ID from env (the Opus platform workflow, not internal workflowId)
    const opusWorkflowId = process.env.OPUS_WORKFLOW_ID;
    if (!opusWorkflowId) {
      return NextResponse.json(
        { success: false, message: "OPUS_WORKFLOW_ID not configured." },
        { status: 500 }
      );
    }

    // Step 1: Initiate Opus job
    const initiateResponse = await fetch(`${OPUS_BASE_URL}/job/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceKey,
      },
      body: JSON.stringify({
        workflowId: opusWorkflowId,
        title: `OpenJarvis Screenshots - ${recordingIdStr || "Batch"}`,
        description: `Screenshot analysis from OpenJarvis at ${new Date().toISOString()}`,
      }),
    });

    if (!initiateResponse.ok) {
      const errorText = await initiateResponse.text();
      console.error("Opus initiate failed:", initiateResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to initiate Opus job: ${errorText}`,
        },
        { status: 502 }
      );
    }

    const initiateData: OpusInitiateResponse = await initiateResponse.json();
    const { jobExecutionId } = initiateData;

    // Step 2: Execute job with screenshots
    // Build payload schema instance with screenshot array
    const jobPayloadSchemaInstance = {
      screenshots: {
        value: fileUrls,
        type: "array_files",
        displayName: "Screenshot Images",
      },
    };

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
      console.error("Opus execute failed:", executeResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to execute Opus job: ${executeResponse.status} ${executeResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const executeData: OpusExecuteResponse = await executeResponse.json();
>>>>>>> 6052215 (feat: openclaw connection)

    return NextResponse.json({
      success: true,
      message: "Screenshots sent to Opus successfully.",
<<<<<<< HEAD
      batchId,
      count: files.length,
      workflowId: OPUS_WORKFLOW_ID,
=======
      jobExecutionId: executeData.jobExecutionId,
      workflowId: workflowIdStr,
>>>>>>> 6052215 (feat: openclaw connection)
      recordingId: recordingIdStr,
      screenshotCount: files.length,
      timestamp: new Date().toISOString(),
      opusJobId: executeData.jobExecutionId,
    });
  } catch (error) {
<<<<<<< HEAD
    console.error("[send-screenshots-to-opus] Error processing request:", error);
=======
    console.error("Error in send-screenshots-to-opus:", error);
>>>>>>> 6052215 (feat: openclaw connection)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Invalid request.",
      },
      { status: 400 }
    );
  }
}
