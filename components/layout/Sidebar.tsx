"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  GitBranch,
  Settings,
  ChevronLeft,
  Zap,
  Menu,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Recorder", href: "/recorder", icon: Video },
  { label: "Workflows", href: "/workflows", icon: GitBranch },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden btn-ghost p-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col",
          "glass-panel border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-5 border-b border-surface-200/60",
            "dark:border-surface-800/60"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-display text-lg font-medium tracking-tight truncate">
                OpenClaw
              </span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-surface-500 hover:bg-surface-100 hover:text-surface-700",
                  "dark:hover:bg-surface-800/60 dark:hover:text-surface-300",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon
                  className={cn("w-[18px] h-[18px] flex-shrink-0")}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex items-center justify-center p-3 border-t border-surface-200/60 dark:border-surface-800/60">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-ghost p-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>

      {/* Spacer so main content shifts */}
      <div
        className={cn(
          "hidden lg:block flex-shrink-0 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      />
    </>
  );
}
