"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

interface AppShellProps {
  user: { email?: string; full_name?: string } | null;
  children: React.ReactNode;
  dailyProgress: number;
  timezone: string;
}

export function AppShell({ user, children, dailyProgress, timezone }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sidebar
        user={user}
        isMobile
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopNav
          user={user}
          dailyProgress={dailyProgress}
          timezone={timezone}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
