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
      className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] animate-in slide-in-from-bottom-3 duration-200"
    >
      {/* Dock Capsule with Industrial Matte Graphite Finish & Specular Rim */}
      <nav 
        role="tablist"
        aria-label="Dashboard Views"
        className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-black/5 dark:ring-white/5"
      >
        {/* Tab 1: Bleaching Process Log */}
        <button
          type="button"
          role="tab"
          id="tab-bleaching"
          aria-selected={activeTab === 'bleaching'}
          onClick={() => onTabChange('bleaching')}
          className={`dock-pill-btn group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'bleaching'
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35),inset_0_1px_0_rgba(255,255,255,0.28)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap">Bleaching Log</span>

          {sheetStatus === 'InProgress' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-200 dark:bg-amber-300 animate-ping ml-0.5" />
          )}
        </button>

        {/* Tab 2: QC Management */}
        <button
          type="button"
          role="tab"
          id="tab-qc"
          aria-selected={activeTab === 'qc'}
          onClick={() => onTabChange('qc')}
          className={`dock-pill-btn group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'qc'
              ? 'bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
          }`}
        >
          <FlaskConical className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap">QC Lab</span>

          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-0.5 transition-colors ${
            activeTab === 'qc'
              ? 'bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
          className={`dock-pill-btn group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="whitespace-nowrap">Reports</span>
        </button>

        {/* Tab 4: Supervisor Hub */}
        {isSupervisorOrAdmin && (
          <button
            type="button"
            role="tab"
            id="tab-supervisor"
            aria-selected={activeTab === 'supervisor'}
            onClick={() => onTabChange('supervisor')}
            className={`dock-pill-btn group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
              activeTab === 'supervisor'
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.28)]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="whitespace-nowrap">Supervisor</span>

            {unacknowledgedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse shadow-xs">
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
            className={`dock-pill-btn group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold select-none shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[0_2px_8px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.28)]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="whitespace-nowrap">Users</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-700/80 mx-1 shrink-0" />

        {/* Quick Action: PDF Export */}
        <button
          type="button"
          onClick={onOpenPdf}
          className="dock-pill-btn group p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shrink-0 cursor-pointer"
          title="Preview & Print Official A4 PDF"
          aria-label="Print Official PDF"
        >
          <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </nav>
    </aside>
  );
};
