import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";

export const metadata: Metadata = {
  title: "OpenJarvis",
  description:
    "Screen recording and workflow review platform powered by OpenJarvis and Opus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ToastProvider>
          <OnboardingOverlay />
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
