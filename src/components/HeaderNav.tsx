"use client";

import React from "react";
import { UserProfile, SheetStatus, DashboardTab } from "@/types";
import { RealtimeClockState } from "@/lib/realtimeTimeline";
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
  LogOut,
  RefreshCw
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
  clockState?: RealtimeClockState;
  isSyncing?: boolean;
  onManualSync?: () => void;
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
  clockState,
  isSyncing = false,
  onManualSync,
}) => {
  const getStatusBadge = () => {
    switch (sheetStatus) {
      case "Draft":
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Draft
          </span>
        );
      case "InProgress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>In Progress</span>
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Submitted</span>
          </span>
        );
      case "Returned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Returned</span>
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Approved &amp; Locked</span>
          </span>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case "bleaching":
        return "Bleaching Process Log";
      case "qc":
        return "QC Management & Lab Tests";
      case "reports":
        return "Plant Performance Reports & Analytics";
      case "supervisor":
        return "Supervisor Live Monitoring & Audit Hub";
      case "users":
        return "User Management & Access Control";
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#080C14]/90 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Section */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-white shadow-[0_4px_24px_rgba(245,158,11,0.6)] font-bold shrink-0 border border-amber-400/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                Lam Soon Edible Oils
              </span>
              <span className="text-xs text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hidden md:inline">
                {getSectionTitle()}
              </span>
              {activeTab === "bleaching" && getStatusBadge()}
            </div>
            <p className="text-xs text-zinc-500 font-medium hidden lg:block">
              Nisshin Process Management System - Refinery Plant Control Line 1
            </p>
          </div>
        </div>

        {/* Center: Shift, Realtime Clock & Active Slot Telemetry */}
        <div className="hidden md:flex items-center gap-3 bg-zinc-100/95 dark:bg-zinc-900/90 shadow-inner px-3.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
          {clockState ? (
            <>
              {/* Live Real-time Clock */}
              <div className="flex items-center gap-2 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">Time:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {clockState.formattedTime}
                </span>
              </div>

              <div className="h-3.5 w-[1px] bg-zinc-300 dark:bg-zinc-700" />

              {/* Active Slot */}
              <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                <span>Slot <strong className="text-amber-600 dark:text-amber-400 font-semibold">{clockState.slotTimeLabel}</strong></span>
                <span className="text-zinc-400 dark:text-zinc-500 hidden lg:inline">
                  · {clockState.shiftLabel}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Shift:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Shift {currentShift} {currentShift === 1 ? '(08:00 - 15:00)' : currentShift === 2 ? '(16:00 - 23:00)' : '(24:00 - 07:00)'}
              </span>
            </div>
          )}

          {/* Cloud Synced UI hidden from frontend, background auto-sync active */}
          <div className="hidden">
            {isOffline ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold font-mono text-xs">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            ) : (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                title="InsForge Multi-Device Cloud Sync. Click to force refresh data from all devices."
                className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-xs hover:text-emerald-500 transition-colors cursor-pointer disabled:opacity-70"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span className="text-amber-500">Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Cloud Synced</span>
                  </>
                )}
              </button>
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
                className="btn-tactile btn-premium-glass flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer group"
                title="Export / Print Official A4 Format RF-FR-003"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden sm:inline">Print PDF</span>
              </button>

              {currentRole.role === 'technician' && sheetStatus === 'InProgress' && (
                <button
                  type="button"
                  onClick={onSubmitSheet}
                  className="btn-premium-amber flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer group"
                >
                  <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span>Submit Sheet</span>
                </button>
              )}

              {(currentRole.role === 'supervisor' || currentRole.role === 'admin') && sheetStatus === 'Submitted' && (
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="btn-premium-emerald flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer group"
                >
                  <ShieldCheck className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                  <span>Review &amp; Approve</span>
                </button>
              )}
            </>
          )}

          {/* User Identity Chip */}
          <div
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/90 pl-1.5 pr-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-left select-none transition-all hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title={`Active User: ${currentRole.name} (${currentRole.role})`}
          >
            <div className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
              {currentRole.name.slice(0, 2)}
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[120px] truncate">
                {currentRole.name}
              </span>
              <span className="block text-xs font-mono text-zinc-500 capitalize leading-none mt-0.5">
                {currentRole.role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={onLogout}
            className="btn-tactile flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 hover:shadow-xs cursor-pointer group"
            title="Sign out of active session"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            className="btn-tactile btn-premium-glass p-2 rounded-xl text-zinc-600 dark:text-zinc-300 cursor-pointer group"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

