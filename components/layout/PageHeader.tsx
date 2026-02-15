"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-display font-medium tracking-tight text-surface-900 dark:text-surface-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-surface-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
