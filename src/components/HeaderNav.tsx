"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserProfile, SheetStatus, DashboardTab, PlantNotification } from "@/types";
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
  RefreshCw,
  Calendar,
  Volume2,
  VolumeX,
  Bell,
  X,
  CheckCheck,
  ExternalLink,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  HelpCircle
} from "lucide-react";
import { DEFAULT_AVATAR } from "@/components/WorkstationSettingsModal";

interface HeaderNavProps {
  sheetStatus: SheetStatus;
  currentRole: UserProfile;
  allUsers: UserProfile[];
  onRoleChange: (user: UserProfile) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isOffline: boolean;
  onOpenPdf: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
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
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  isToday?: boolean;
  isAudioEnabled?: boolean;
  onToggleAudio?: () => void;
  notifications?: PlantNotification[];
  onClearNotifications?: () => void;
  onNotificationClick?: (notification: PlantNotification) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  sheetStatus,
  currentRole,
  isDark,
  onToggleDark,
  isOffline,
  onOpenPdf,
  onOpenSettings,
  onOpenHelp,
  onSubmitSheet,
  onOpenReview,
  currentShift,
  activeTab,
  onLogout,
  clockState,
  isSyncing = false,
  onManualSync,
  selectedDate,
  onDateChange,
  isToday = true,
  isAudioEnabled = false,
  onToggleAudio,
  notifications = [],
  onClearNotifications,
  onNotificationClick,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusBadge = () => {
    switch (sheetStatus) {
      case "Draft":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Draft
          </span>
        );
      case "InProgress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>In Progress</span>
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Submitted</span>
          </span>
        );
      case "Returned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Returned</span>
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Approved</span>
          </span>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case "bleaching":
        return "Bleaching Process Log";
      case "qc":
        return "QC Management";
      case "reports":
        return "Reports & Analytics";
      case "supervisor":
        return "Supervisor Hub";
      case "users":
        return "User Management";
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#080C14]/95 backdrop-blur-xl">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Section */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold shrink-0 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-white">
                Lam Soon Edible Oils
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:inline">
                {getSectionTitle()}
              </span>
              {activeTab === "bleaching" && getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Center: Shift, Realtime Clock & Active Slot Telemetry */}
        <div className="hidden md:flex items-center gap-2.5 bg-zinc-100/90 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs shadow-2xs whitespace-nowrap select-none">
          {clockState ? (
            <>
              {/* Live Real-time Clock */}
              <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Time:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {clockState.formattedTime}
                </span>
              </div>

              <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-700 shrink-0" />

              {/* Active Slot & Shift */}
              <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                <span>Slot <strong className="text-amber-600 dark:text-amber-400 font-bold">{clockState.slotTimeLabel}</strong></span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                  Shift {clockState.shift} ({clockState.shift === 1 ? 'Morning' : clockState.shift === 2 ? 'Afternoon' : 'Night'})
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Shift:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {currentShift === 1 ? 'Shift 1 (Morning)' : currentShift === 2 ? 'Shift 2 (Afternoon)' : 'Shift 3 (Night)'}
              </span>
            </div>
          )}

          {/* Interactive Date & Calendar Archive Picker */}
          {selectedDate && (
            <>
              <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-700 shrink-0" />
              <div className="relative flex items-center gap-1.5 font-medium whitespace-nowrap group">
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:text-amber-400 transition-colors pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange?.(e.target.value)}
                  title="Select date to view process log archive"
                  aria-label="Process Log Date"
                  className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none cursor-pointer border-none p-0 tracking-tight [color-scheme:light_dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                />
                {!isToday && onDateChange && (
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      onDateChange(todayStr);
                    }}
                    title="Return to today's live shift"
                    className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-2xs"
                  >
                    Live
                  </button>
                )}
              </div>
            </>
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

          {/* User Identity Chip - Synced with Settings Avatar */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/90 pl-1.5 pr-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-left select-none transition-all hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer group"
            title={`Active User: ${currentRole.name} (${currentRole.role}) - Click to customize workstation & profile`}
          >
            {currentRole.avatar_url || DEFAULT_AVATAR ? (
              <img
                src={currentRole.avatar_url || DEFAULT_AVATAR}
                alt={currentRole.name}
                className="h-6 w-6 rounded-lg object-cover shrink-0 shadow-2xs border border-amber-500/40 ring-1 ring-amber-500/20 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {currentRole.name.slice(0, 2)}
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[120px] truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                {currentRole.name}
              </span>
              <span className="block text-xs font-mono text-zinc-500 capitalize leading-none mt-0.5">
                {currentRole.role.replace("_", " ")}
              </span>
            </div>
          </button>

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

          {/* Notification Center Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="btn-tactile btn-premium-glass p-2 rounded-xl text-zinc-600 dark:text-zinc-300 relative cursor-pointer group"
              title="Plant Broadcast Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white font-mono text-xs font-bold items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-white font-display">
                      Plant Broadcast Feed
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                      {notifications.length}
                    </span>
                  </div>
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      type="button"
                      onClick={() => onClearNotifications()}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      No notifications yet. Operating normally.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onNotificationClick) onNotificationClick(item);
                          setIsNotificationOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          item.type === "alert"
                            ? "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15"
                            : item.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"
                            : item.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                            : "bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-white/10 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            item.type === "alert" ? "text-rose-600 dark:text-rose-400" :
                            item.type === "warning" ? "text-amber-600 dark:text-amber-400" :
                            item.type === "success" ? "text-emerald-600 dark:text-emerald-400" :
                            "text-sky-600 dark:text-sky-400"
                          }`}>
                            {item.source}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help & SOP Support Shortcut */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="btn-tactile btn-premium-glass p-2 rounded-xl text-zinc-500 hover:text-emerald-500 dark:text-zinc-400 dark:hover:text-emerald-400 cursor-pointer group"
              title="Help & SOP Support (24-Hour Refinery Ops)"
              aria-label="Help and Support"
            >
              <HelpCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
          )}

          {/* Plant Workstation Settings Shortcut */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="btn-tactile btn-premium-glass p-2 rounded-xl text-zinc-500 hover:text-sky-500 dark:text-zinc-400 dark:hover:text-sky-400 cursor-pointer group"
              title="Plant Workstation Settings & Preferences"
              aria-label="Workstation Settings"
            >
              <Settings className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45" />
            </button>
          )}

          {/* Industrial Audible Chime Toggle Button */}
          {onToggleAudio && (
            <button
              type="button"
              onClick={onToggleAudio}
              className={`btn-tactile p-2 rounded-xl border transition-all cursor-pointer group ${
                isAudioEnabled
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-2xs"
                  : "btn-premium-glass text-zinc-500 dark:text-zinc-400"
              }`}
              title={isAudioEnabled ? "Audible Industrial Chime: Active (Click to Mute)" : "Audible Industrial Chime: Muted (Click to Enable)"}
              aria-label="Toggle Industrial Chime"
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
          )}

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

