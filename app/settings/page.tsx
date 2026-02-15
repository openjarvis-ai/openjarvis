"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, User, Bell, Shield, Palette, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account details and preferences",
    color: "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure when and how you receive alerts",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Manage API keys and authentication settings",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize theme, layout, and display options",
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("openjarvis-onboarding-dismissed");
              window.location.href = "/dashboard";
            } catch {
              window.location.href = "/dashboard";
            }
          }}
          className="btn-secondary"
        >
          <BookOpen className="w-4 h-4" />
          View onboarding again
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="card-elevated p-6 hover:shadow-medium transition-shadow duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200",
                  section.color
                )}
              >
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                  {section.title}
                </h3>
                <p className="text-xs text-surface-400 mt-1">
                  {section.description}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800">
              <p className="text-xs text-surface-300 italic">Coming soon</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
