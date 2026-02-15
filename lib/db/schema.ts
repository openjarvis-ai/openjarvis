import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

// Workflows table
export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(), // "OpenJarvis" | "Opus"
  version: text("version").notNull(),
  executionTime: integer("execution_time").notNull(), // ms
  model: text("model").notNull(),
  recordingId: text("recording_id"),
  tags: text("tags").notNull(), // JSON array
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Workflow steps table
export const workflowSteps = sqliteTable("workflow_steps", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // "completed" | "pending" | "failed"
});

// Recordings table (metadata only; actual video files stored elsewhere)
export const recordings = sqliteTable("recordings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // seconds
  size: integer("size").notNull(), // bytes
  status: text("status").notNull(), // "ready" | "uploading" | "uploaded" | "error"
  createdAt: text("created_at").notNull(),
});

// Comments sent to Opus
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull(),
  comment: text("comment").notNull(),
  recordingId: text("recording_id"),
  createdAt: text("created_at").notNull(),
});

export type WorkflowRow = typeof workflows.$inferSelect;
export type WorkflowStepRow = typeof workflowSteps.$inferSelect;
export type RecordingRow = typeof recordings.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
