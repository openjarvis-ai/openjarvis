"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, Inbox } from "lucide-react";

// ─── Stat Card ───────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("card-elevated p-5 group hover:shadow-medium transition-shadow duration-200", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-surface-900 dark:text-surface-100">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">{trend}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-surface-400" />
      </div>
      <h3 className="text-base font-semibold text-surface-700 dark:text-surface-300">{title}</h3>
      <p className="mt-1.5 text-sm text-surface-400 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className={cn("animate-spin text-brand-600", sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-surface-200/60 dark:bg-surface-800/60",
        className
      )}
    />
  );
}
