"use client";

import React from "react";
import { DashboardTab, SheetStatus, UserProfile } from "@/types";
import { 
  Layers, 
  FlaskConical, 
  Printer, 
  BarChart3, 
  ShieldCheck, 
  Users,
  Database,
  ChevronRight
} from "lucide-react";

interface SidebarNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenPdf: () => void;
  qcSampleCount?: number;
  sheetStatus: SheetStatus;
  currentUser: UserProfile;
  unacknowledgedAlertsCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  onOpenPdf,
  qcSampleCount = 0,
  sheetStatus,
  currentUser,
  unacknowledgedAlertsCount = 0,
}) => {
  const isAdmin = currentUser?.role === "admin";
  const isSupervisorOrAdmin = 
    currentUser?.role === "supervisor" || 
    currentUser?.role === "admin" || 
    currentUser?.role === "manager_qa";

  const navItems = [
    {
      id: 'bleaching' as DashboardTab,
      label: 'Bleaching Log',
      icon: Layers,
      badge: sheetStatus === 'InProgress' ? 'Live' : null,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      show: true,
    },
    {
      id: 'qc' as DashboardTab,
      label: 'QC Management',
      icon: FlaskConical,
      badge: qcSampleCount > 0 ? `${qcSampleCount}` : null,
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
      show: true,
    },
    {
      id: 'reports' as DashboardTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
      show: true,
    },
    {
      id: 'masterdata' as DashboardTab,
      label: 'Master Data',
      icon: Database,
      badge: null,
      show: true,
    },
    {
      id: 'supervisor' as DashboardTab,
      label: 'Supervisor Hub',
      icon: ShieldCheck,
      badge: unacknowledgedAlertsCount > 0 ? `${unacknowledgedAlertsCount}` : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      show: isSupervisorOrAdmin,
    },
    {
      id: 'users' as DashboardTab,
      label: 'User Management',
      icon: Users,
      badge: null,
      show: isAdmin,
    },
  ];

  return (
    <aside className="w-full md:w-56 lg:w-60 shrink-0 md:sticky md:top-[61px] md:h-[calc(100vh-61px)] flex flex-col justify-between p-3 bg-white/95 dark:bg-[#080C14]/95 border-b md:border-b-0 md:border-r border-zinc-200/80 dark:border-white/10 backdrop-blur-xl z-20 transition-all select-none">
      <div className="space-y-3">
        {/* Menu Section Header */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
            Menu
          </span>
        </div>

        {/* Navigation Item List */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer shrink-0 md:shrink ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform hidden md:block ${isActive ? 'text-amber-500 translate-x-0.5' : 'text-zinc-400/30 opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Quick Action: Print PDF */}
      <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 mt-2 md:mt-0">
        <button
          type="button"
          onClick={onOpenPdf}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs transition-all cursor-pointer group"
          title="Print Official RF-FR-003 PDF"
        >
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Print Form PDF</span>
          </div>
          <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            A4
          </span>
        </button>
      </div>
    </aside>
  );
};

