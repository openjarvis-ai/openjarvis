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
  workflowId: string;
  comment: string;
  recordingId?: string;
}

export interface SendCommentResponse {
  success: boolean;
  message: string;
  commentId?: string;
  timestamp?: string;
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
