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
      {/* Dock Capsule with Industrial Matte Graphite Finish */}
      <nav 
        role="tablist"
        aria-label="Dashboard Views"
        className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5"
      >
        {/* Tab 1: Bleaching Process Log */}
        <button
          type="button"
          role="tab"
          id="tab-bleaching"
          aria-selected={activeTab === 'bleaching'}
          onClick={() => onTabChange('bleaching')}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 ${
            activeTab === 'bleaching'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Bleaching Log</span>

          {sheetStatus === 'InProgress' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping ml-0.5" />
          )}
        </button>

        {/* Tab 2: QC Management */}
        <button
          type="button"
          role="tab"
          id="tab-qc"
          aria-selected={activeTab === 'qc'}
          onClick={() => onTabChange('qc')}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 ${
            activeTab === 'qc'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">QC Lab</span>

          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
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
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 ${
            activeTab === 'reports'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
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
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 ${
              activeTab === 'supervisor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Supervisor</span>

            {unacknowledgedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse">
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
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Users</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-700/80 mx-1 shrink-0" />

        {/* Quick Action: PDF Export */}
        <button
          type="button"
          onClick={onOpenPdf}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Preview & Print Official A4 PDF"
          aria-label="Print Official PDF"
        >
          <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      </nav>
    </aside>
  );
};
