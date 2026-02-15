import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
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
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
