"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useState } from "react";

interface AppShellProps {
  user: { email?: string; full_name?: string } | null;
  children: React.ReactNode;
  dailyProgress: number;
  timezone: string;
}

export function AppShell({
  user,
  children,
  dailyProgress,
  timezone,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
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
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-y-auto overscroll-contain"
        >
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
