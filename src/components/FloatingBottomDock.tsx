"use client";

import React from "react";
import { DashboardTab, SheetStatus, UserProfile } from "@/types";
import { 
  Layers, 
  FlaskConical, 
  Printer, 
  BarChart3, 
  ShieldCheck, 
  Users
} from "lucide-react";

interface FloatingBottomDockProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenPdf: () => void;
  qcSampleCount?: number;
  sheetStatus: SheetStatus;
  currentUser: UserProfile;
  unacknowledgedAlertsCount?: number;
}

export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  activeTab,
  onTabChange,
  onOpenPdf,
  qcSampleCount = 54,
  sheetStatus,
  currentUser,
  unacknowledgedAlertsCount = 0,
}) => {
  const isAdmin = currentUser?.role === "admin";
  const isSupervisorOrAdmin = 
    currentUser?.role === "supervisor" || 
    currentUser?.role === "admin" || 
    currentUser?.role === "manager_qa";

  return (
    <aside 
      aria-label="Bottom Navigation Dock"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {/* Dock Capsule with Luxury Industrial Glassmorphism & Specular Rim */}
      <nav 
        role="tablist"
        aria-label="Dashboard Views"
        className="glass-panel flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-[#080C14]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.7),0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-black/[0.03] dark:ring-amber-500/[0.06] [transform-style:preserve-3d]"
      >
        {/* Tab 1: Bleaching Process Log */}
        <button
          type="button"
          role="tab"
          id="tab-bleaching"
          aria-selected={activeTab === 'bleaching'}
          onClick={() => onTabChange('bleaching')}
          className={`dock-pill-btn group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'bleaching'
              ? 'btn-premium-amber text-white shadow-[0_4px_16px_rgba(217,119,6,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap font-display">Bleaching Log</span>

          {sheetStatus === 'InProgress' && (
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
          )}
        </button>

        {/* Tab 2: QC Management */}
        <button
          type="button"
          role="tab"
          id="tab-qc"
          aria-selected={activeTab === 'qc'}
          onClick={() => onTabChange('qc')}
          className={`dock-pill-btn group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'qc'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5'
          }`}
        >
          <FlaskConical className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap font-display">QC Lab</span>

          <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full font-bold ml-0.5 transition-colors ${
            activeTab === 'qc'
              ? 'bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900'
              : 'bg-zinc-200/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}>
            {qcSampleCount}
          </span>
        </button>

        {/* Tab 3: Reports & Analytics */}
        <button
          type="button"
          role="tab"
          id="tab-reports"
          aria-selected={activeTab === 'reports'}
          onClick={() => onTabChange('reports')}
          className={`dock-pill-btn group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap font-display">Reports</span>
        </button>

        {/* Tab 4: Supervisor Hub */}
        {isSupervisorOrAdmin && (
          <button
            type="button"
            role="tab"
            id="tab-supervisor"
            aria-selected={activeTab === 'supervisor'}
            onClick={() => onTabChange('supervisor')}
            className={`dock-pill-btn group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
              activeTab === 'supervisor'
                ? 'btn-premium-emerald text-white shadow-[0_4px_16px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="whitespace-nowrap font-display">Supervisor</span>

            {unacknowledgedAlertsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold font-mono animate-pulse shadow-sm">
                {unacknowledgedAlertsCount}
              </span>
            )}
          </button>
        )}

        {/* Tab 5: Admin User Management */}
        {isAdmin && (
          <button
            type="button"
            role="tab"
            id="tab-users"
            aria-selected={activeTab === 'users'}
            onClick={() => onTabChange('users')}
            className={`dock-pill-btn group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="whitespace-nowrap font-display">Users</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1 shrink-0" />

        {/* Quick Action: PDF Export */}
        <button
          type="button"
          onClick={onOpenPdf}
          className="dock-pill-btn group p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5 shrink-0 cursor-pointer transition-all duration-200"
          title="Preview & Print Official A4 PDF"
          aria-label="Print Official PDF"
        >
          <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </nav>
    </aside>
  );
};
