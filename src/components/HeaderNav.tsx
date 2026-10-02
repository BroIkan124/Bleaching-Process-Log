"use client";

import React from "react";
import { UserProfile, SheetStatus, DashboardTab } from "@/types";
import { 
  Building2, 
  Clock, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Send, 
  Printer,
  LogOut
} from "lucide-react";

interface HeaderNavProps {
  sheetStatus: SheetStatus;
  currentRole: UserProfile;
  allUsers: UserProfile[];
  onRoleChange: (user: UserProfile) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isOffline: boolean;
  onOpenPdf: () => void;
  onSubmitSheet: () => void;
  onOpenReview: () => void;
  currentShift: 1 | 2 | 3;
  activeTab: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  qcSampleCount?: number;
  onLogout: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  sheetStatus,
  currentRole,
  isDark,
  onToggleDark,
  isOffline,
  onOpenPdf,
  onSubmitSheet,
  onOpenReview,
  currentShift,
  activeTab,
  onLogout,
}) => {
  const getStatusBadge = () => {
    switch (sheetStatus) {
      case "Draft":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Draft</span>;
      case "InProgress":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">In Progress</span>;
      case "Submitted":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">Submitted</span>;
      case "Returned":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700">Returned</span>;
      case "Approved":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">Approved</span>;
    }
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case "bleaching":
        return "Auto Bleaching Log (RF-FR-003 Rev 03)";
      case "qc":
        return "QC Management & Lab Tests (RF-FR-001)";
      case "reports":
        return "Plant Performance Reports & Analytics";
      case "supervisor":
        return "Supervisor Live Monitoring & Audit Hub";
      case "users":
        return "User Management & Access Control (Admin)";
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121316]/95 backdrop-blur shadow-2xs">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Section */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-sm font-display font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                Lam Soon Edible Oils
              </span>
              <span className="text-[10px] text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hidden md:inline">
                {getSectionTitle()}
              </span>
              {activeTab === "bleaching" && getStatusBadge()}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium hidden lg:block">
              Nisshin Process Management System · Refinery Plant Control
            </p>
          </div>
        </div>

        {/* Center: Shift & Telemetry Badge */}
        <div className="hidden md:flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-zinc-500">Shift:</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
              Shift {currentShift} {currentShift === 1 ? '(0800–1500)' : currentShift === 2 ? '(1600–2300)' : '(2400–0700)'}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700" />

          <div className="flex items-center gap-1.5">
            {isOffline ? (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <Wifi className="w-3.5 h-3.5" /> Synced
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, User Profile & Dark Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bleaching Specific Actions */}
          {activeTab === 'bleaching' && (
            <>
              <button
                type="button"
                onClick={onOpenPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Export / Print Official A4 Format RF-FR-003"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Print PDF</span>
              </button>

              {currentRole.role === 'technician' && sheetStatus === 'InProgress' && (
                <button
                  type="button"
                  onClick={onSubmitSheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Sheet</span>
                </button>
              )}

              {(currentRole.role === 'supervisor' || currentRole.role === 'admin') && sheetStatus === 'Submitted' && (
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review &amp; Approve</span>
                </button>
              )}
            </>
          )}

          {/* User Identity Chip */}
          <div
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/90 pl-1.5 pr-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-left select-none"
            title={`Active User: ${currentRole.name} (${currentRole.role})`}
          >
            <div className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
              {currentRole.name.slice(0, 2)}
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[120px] truncate">
                {currentRole.name}
              </span>
              <span className="block text-[10px] font-mono text-zinc-500 capitalize leading-none mt-0.5">
                {currentRole.role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-all hover:shadow-xs active:scale-95 cursor-pointer"
            title="Sign out of active session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
