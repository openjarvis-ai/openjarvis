// ─── Recording Types ─────────────────────────────────────────
export interface Recording {
  id: string;
  name: string;
  duration: number; // seconds
  size: number; // bytes
  createdAt: string;
  thumbnailUrl?: string;
  blobUrl?: string;
  status: "ready" | "uploading" | "uploaded" | "error";
}

export type RecordingSource = "screen" | "window" | "tab";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "error";

// ─── Workflow Types ──────────────────────────────────────────
export interface WorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  status: "completed" | "pending" | "failed";
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  metadata: {
    source: "OpenJarvis" | "Opus";
    version: string;
    executionTime: number; // ms
    model: string;
  };
  createdAt: string;
  updatedAt: string;
  recordingId?: string;
  tags: string[];
}

// ─── Comment Types ───────────────────────────────────────────
export interface SendCommentPayload {
  workflowId?: string; // Optional - uses hardcoded workflow ID if not provided
  comment: string;
  recordingId?: string;
}

export interface SendCommentResponse {
  success: boolean;
  message: string;
  commentId?: string;
  timestamp?: string;
  opusJobId?: string;
}

// ─── Opus API Types ──────────────────────────────────────────
export interface OpusReviewFeedback {
  date: string; // ISO date format: "2025-01-15"
  reviewer_id: string;
  feedback_text: string;
}

export interface OpusSessionMetadata {
  timestamp: string; // ISO datetime format: "2025-07-23T15:30"
  session_id: string;
  active_applications: string[];
}

export interface OpusScreenCapture {
  image_file: string; // filename or path
}

export interface OpusJobPayload {
  reviewFeedback?: OpusReviewFeedback;
  sessionMetadata?: OpusSessionMetadata;
  screenCaptures?: OpusScreenCapture[];
}

// ─── API Response Types ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

// ─── Dashboard Types ─────────────────────────────────────────
export interface DashboardStats {
  totalRecordings: number;
  totalWorkflows: number;
  commentsSent: number;
  totalDuration: number;
}

// ─── Navigation Types ────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
