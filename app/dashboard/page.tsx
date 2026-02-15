"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard, LoadingSpinner, EmptyState } from "@/components/ui/SharedUI";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { formatDuration } from "@/lib/utils";
import { Video, GitBranch, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import type { DashboardStats, Recording, Workflow } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Failed to fetch");
        if (json.success && json.data) {
          setStats(json.data.stats);
          setRecordings(json.data.recordings ?? []);
          setWorkflows(json.data.workflows ?? []);
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-surface-500">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description={error ?? "An unexpected error occurred."}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your recordings and workflows"
        actions={
          <Link href="/recorder" className="btn-primary">
            <Video className="w-4 h-4" />
            New Recording
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Recordings"
          value={stats.totalRecordings}
          icon={Video}
          trend="+2 this week"
        />
        <StatCard
          label="Workflows"
          value={stats.totalWorkflows}
          icon={GitBranch}
          trend="+1 today"
        />
        <StatCard
          label="Comments Sent"
          value={stats.commentsSent}
          icon={MessageSquare}
        />
        <StatCard
          label="Total Duration"
          value={formatDuration(stats.totalDuration)}
          icon={Clock}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity recordings={recordings} workflows={workflows} />
    </>
  );
}
