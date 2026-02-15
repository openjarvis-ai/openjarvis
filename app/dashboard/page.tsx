"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/SharedUI";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { mockDashboardStats, mockRecordings, mockWorkflows } from "@/lib/mock-data";
import { formatDuration } from "@/lib/utils";
import { Video, GitBranch, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const stats = mockDashboardStats;

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
      <RecentActivity
        recordings={mockRecordings}
        workflows={mockWorkflows}
      />
    </>
  );
}
