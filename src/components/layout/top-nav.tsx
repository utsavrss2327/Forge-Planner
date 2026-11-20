"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface TopNavProps {
  user?: { email?: string; full_name?: string } | null;
  onMenuClick?: () => void;
  timezone: string;
  dailyProgress?: number; // 0-100
}

export function TopNav({ user, onMenuClick, dailyProgress = 0, timezone }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const today = new Intl.DateTimeFormat("en", { timeZone: timezone, weekday: "short", month: "short", day: "numeric" }).format(new Date());

  // SVG circular progress
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (dailyProgress / 100) * circumference;

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-elevated"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Date */}
      <div className="hidden sm:flex items-center gap-1.5 text-text-muted text-sm shrink-0">
        <span className="font-medium text-text-secondary">{today}</span>
      </div>

      {/* Search */}
      <form action="/learning" className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            name="q"
            aria-label="Search learning tracks and notes"
            type="search"
            placeholder="Search learning tracks and notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-elevated border-border-light"
          />
        </div>
      </form>

      {/* Right side controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Daily progress circle */}
        <div className="hidden sm:flex items-center gap-2 group cursor-default">
          <div className="relative" title={`Daily progress: ${dailyProgress}%`}>
            <svg width={size} height={size} className="rotate-[-90deg]">
              {/* Background track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-border)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-primary)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
          </div>
          <span className="text-xs text-text-muted hidden md:block">
            {dailyProgress}%
          </span>
        </div>

        {/* User avatar */}
        <Link href="/settings" aria-label="Open account settings"><Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar></Link>
      </div>
    </header>
  );
}
