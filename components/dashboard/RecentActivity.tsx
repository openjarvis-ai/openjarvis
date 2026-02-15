"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import { Recording, Workflow } from "@/types";
import {
  Video,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  recordings: Recording[];
  workflows: Workflow[];
}

export function RecentActivity({ recordings, workflows }: RecentActivityProps) {
  // Combine and sort by date
  const activities = [
    ...recordings.map((r) => ({
      id: r.id,
      type: "recording" as const,
      title: r.name,
      subtitle: `Duration: ${formatDuration(r.duration)}`,
      date: r.createdAt,
      href: "/recorder",
    })),
    ...workflows.map((w) => ({
      id: w.id,
      type: "workflow" as const,
      title: w.title,
      subtitle: `${w.steps.length} steps · ${w.metadata.source}`,
      date: w.createdAt,
      href: "/workflows",
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 6);

  return (
    <div className="card-elevated">
      <div className="px-5 py-4 border-b border-surface-200/60 dark:border-surface-800/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
        {activities.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                item.type === "recording"
                  ? "bg-rose-100 dark:bg-rose-900/30"
                  : "bg-violet-100 dark:bg-violet-900/30"
              )}
            >
              {item.type === "recording" ? (
                <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <GitBranch className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                {item.title}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">{item.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-surface-400">
                {formatRelativeTime(item.date)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-surface-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
