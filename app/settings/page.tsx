"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { User, Bell, Shield, Palette, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          Quick actions
        </h3>
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
          className={cn(
            "w-full sm:w-auto flex items-center gap-3 px-5 py-4 rounded-2xl",
            "bg-white dark:bg-surface-900 border-2 border-surface-200/80 dark:border-surface-700/80",
            "shadow-soft hover:shadow-medium hover:border-brand-200/60 dark:hover:border-brand-800/40",
            "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-surface-900 dark:text-surface-100">
              View onboarding again
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Replay the product tour on the dashboard
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 ml-auto shrink-0 transition-colors" />
        </button>
      </motion.div>

      <div>
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
          Preferences
        </h3>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {sections.map((section) => (
            <motion.div
              key={section.title}
              variants={item}
              className={cn(
                "relative p-6 rounded-2xl border-2 bg-white dark:bg-surface-900",
                "border-surface-200/80 dark:border-surface-700/80 shadow-soft",
                "hover:shadow-medium hover:scale-[1.02] hover:-translate-y-0.5",
                "transition-all duration-300 cursor-pointer group",
                "hover:border-surface-300/80 dark:hover:border-surface-600/80"
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    "group-hover:scale-105 transition-transform duration-300",
                    section.color
                  )}
                >
                  <section.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-surface-900 dark:text-surface-100 text-base">
                    {section.title}
                  </h4>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                    {section.description}
                  </p>
                  <span className="inline-flex mt-4 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
                    Coming soon
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
