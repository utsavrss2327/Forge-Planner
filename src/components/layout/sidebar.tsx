"use client";

import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Code2,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Map,
  RotateCcw,
  Settings,
  User,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Map,
  CalendarDays,
  BookOpen,
  FlaskConical,
  Code2,
  RotateCcw,
  BarChart3,
  Briefcase,
  Bot,
  Settings,
};

interface SidebarProps {
  user?: { email?: string; full_name?: string } | null;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  user,
  isOpen = true,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [logoutError, setLogoutError] = useState("");

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logoutAction();
    } catch {
      setLogoutError("Sign out failed. Please retry.");
    }
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-surface border-r border-border transition-all duration-300",
        collapsed && !isMobile ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-border shrink-0",
          collapsed && !isMobile ? "justify-center" : "justify-between",
        )}
      >
        {(!collapsed || isMobile) && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap
              className="h-5 w-5 text-primary shrink-0"
              fill="currentColor"
            />
            <span className="text-lg font-black tracking-tighter">
              FOR<span className="text-primary">GE</span>
            </span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Zap className="h-5 w-5 text-primary" fill="currentColor" />
        )}
        {isMobile && onClose && (
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            pathname === item.href ||
            (item.href !== "/planner" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-secondary hover:bg-elevated hover:text-text-primary",
                collapsed && !isMobile ? "justify-center px-2" : "",
              )}
              title={collapsed && !isMobile ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-secondary",
                )}
              />
              {(!collapsed || isMobile) && (
                <span className="truncate">{item.name}</span>
              )}
              {isActive && (!collapsed || isMobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div
        className={cn(
          "border-t border-border p-3 shrink-0",
          collapsed && !isMobile ? "flex justify-center" : "",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open user menu"
              className={cn(
                "flex items-center gap-3 w-full rounded-lg p-2 hover:bg-elevated transition-colors text-left",
                collapsed && !isMobile ? "justify-center w-auto" : "",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-error focus:text-error focus:bg-error/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {logoutError && (
          <p role="alert" className="p-2 text-xs text-primary">
            {logoutError}
          </p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div
          inert={!isOpen}
          aria-hidden={!isOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="w-64 h-full">{sidebarContent}</div>
        </div>
      </>
    );
  }

  return sidebarContent;
}
