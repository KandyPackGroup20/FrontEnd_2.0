"use client";

import React, { ReactNode } from "react";
import { DashboardSidebar, DashboardUser, NavItem } from "./DashboardSidebar";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface DashboardLayoutProps {
  children: ReactNode;
  activeKey?: string;
  onTabChange?: (key: string) => void;
  user?: DashboardUser | null;
  roleOverride?: string;
  hubName?: string;
  customNavItems?: NavItem[];
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  hideHeader?: boolean;
}

export default function DashboardLayout({
  children,
  activeKey,
  onTabChange,
  user,
  roleOverride,
  hubName,
  customNavItems,
  title,
  subtitle,
  actions,
  hideHeader = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5FAF7] text-slate-800">
      {/* ── DUAL-RAIL SIDEBAR (Fits device height on desktop, drawer on mobile) ── */}
      <DashboardSidebar
        user={user}
        activeKey={activeKey}
        onTabChange={onTabChange}
        roleOverride={roleOverride}
        hubName={hubName}
        customNavItems={customNavItems}
      />

      {/* ── MAIN CONTENT PANE (Independent vertical scroll) ── */}
      <div className="flex-1 min-w-0 h-screen overflow-y-auto relative flex flex-col pt-14 lg:pt-0">
        <GradientBlobs />

        {/* Optional Page Title Header */}
        {!hideHeader && title && (
          <header className="relative z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-md px-6 py-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
              )}
            </div>
          </header>
        )}

        {/* Page Inner Content */}
        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
