"use client";

import React, { useState } from "react";
import { LogSheet, SupervisorUpdateEvent, UserProfile, SampleReport } from "@/types";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FlaskConical, 
  Bell, 
  Filter, 
  Check, 
  ArrowUpRight, 
  FileText, 
  Sliders, 
  TrendingUp, 
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  MessageSquare,
  Lock,
  Unlock,
  Sparkles,
  BarChart3,
  Activity,
  UserCheck,
  Download,
  RotateCcw,
  Calendar,
  User,
  Tag,
  FilterX
} from "lucide-react";
import { RadioSelect } from "./RadioSelect";
import { calculatePipelineMetrics, getShiftDutyTechnician } from "@/lib/workflowPipeline";
import { evaluateSlotAccess, getSlotTimeLabel } from "@/lib/realtimeTimeline";
import { ShiftRosterModal } from "./ShiftRosterModal";

interface SupervisorMonitoringViewProps {
  currentUser: UserProfile;
  sheet: LogSheet;
  events: SupervisorUpdateEvent[];
  onAcknowledgeEvent: (eventId: string, acknowledgedBy: string) => void;
  onOpenReviewModal: () => void;
  onOpenPdfModal: () => void;
  qcReports?: SampleReport[];
  onUnlockSlot?: (slotIndex: number) => void;
  supervisorUnlockedSlots?: number[];
  activeCurrentHourIndex?: number;
  allUsers?: UserProfile[];
  onUpdateShiftTechnician?: (updates: Partial<LogSheet>) => void;
}

export const SupervisorMonitoringView: React.FC<SupervisorMonitoringViewProps> = ({
  currentUser,
  sheet,
  events,
  onAcknowledgeEvent,
  onOpenReviewModal,
  onOpenPdfModal,
  qcReports = [],
  onUnlockSlot,
  supervisorUnlockedSlots = [],
  activeCurrentHourIndex = 1,
  allUsers = [],
  onUpdateShiftTechnician,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [quickFilter, setQuickFilter] = useState<"ALL" | "signoff" | "alert" | "warning" | "routine">("ALL");
  const [rosterModalShift, setRosterModalShift] = useState<1 | 2 | 3 | null>(null);

  const pipelineMetrics = calculatePipelineMetrics(sheet, qcReports);

  // Shift metrics calculation
  const s1Slots = sheet.entries.slice(0, 8);
  const s2Slots = sheet.entries.slice(8, 16);
  const s3Slots = sheet.entries.slice(16, 24);

  const s1Completed = s1Slots.filter((e) => e.is_saved).length;
  const s2Completed = s2Slots.filter((e) => e.is_saved).length;
  const s3Completed = s3Slots.filter((e) => e.is_saved).length;

  // Shift duty technicians (Option 3: Smart Hybrid)
  const techS1 = getShiftDutyTechnician(sheet, 1);
  const techS2 = getShiftDutyTechnician(sheet, 2);
  const techS3 = getShiftDutyTechnician(sheet, 3);

  // Executive Audit Telemetry Counts
  const totalEventsCount = events.length;
  const alertEventsCount = events.filter((e) => e.severity === "alert").length;
  const warningEventsCount = events.filter((e) => e.severity === "warning").length;
  const pendingAlertCount = events.filter((e) => e.requires_acknowledgment && !e.acknowledged).length;
  const routineEventsCount = events.filter((e) => e.severity === "info" || e.severity === "success").length;
  const verifiedCount = events.filter(
    (e) => e.acknowledged || (!e.requires_acknowledgment && (e.severity === "success" || e.severity === "info"))
  ).length;

  // Filter events
  const filteredEvents = events.filter((e) => {
    // 1. Quick filter pill condition
    if (quickFilter === "signoff" && (!e.requires_acknowledgment || e.acknowledged)) {
      return false;
    }
    if (quickFilter === "alert" && e.severity !== "alert") {
      return false;
    }
    if (quickFilter === "warning" && e.severity !== "warning") {
      return false;
    }
    if (quickFilter === "routine" && e.severity !== "info" && e.severity !== "success") {
      return false;
    }

    // 2. Dropdown severity condition
    const matchesSeverity = filterSeverity === "ALL" || e.severity === filterSeverity;

    // 3. Dropdown source condition
    const matchesSource = filterSource === "ALL" || e.source === filterSource;

    // 4. Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesSeverity && matchesSource;

    const matchesSearch =
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.author_name.toLowerCase().includes(q) ||
      (e.author_role && e.author_role.toLowerCase().includes(q)) ||
      (e.slot_time && e.slot_time.toLowerCase().includes(q)) ||
      (e.lot_no && e.lot_no.toLowerCase().includes(q)) ||
      (e.source && e.source.toLowerCase().includes(q));

    return matchesSeverity && matchesSource && matchesSearch;
  });

  const handleResetFilters = () => {
    setQuickFilter("ALL");
    setFilterSeverity("ALL");
    setFilterSource("ALL");
    setSearchQuery("");
  };

  const isFilteringActive =
    quickFilter !== "ALL" || filterSeverity !== "ALL" || filterSource !== "ALL" || searchQuery.trim().length > 0;

  // Export audit trail to CSV
  const handleExportAuditCsv = () => {
    if (!filteredEvents.length) return;
    const headers = [
      "Timestamp",
      "Source Form",
      "Severity Level",
      "Event Title",
      "Detailed Log Description",
      "Recorded By",
      "Role",
      "Shift",
      "Slot Time",
      "Lot Number",
      "Requires Supervisor Sign-Off",
      "Status",
      "Supervisor Signer",
      "Sign-Off Timestamp"
    ];

    const rows = filteredEvents.map((e) => [
      `"${e.timestamp}"`,
      `"${e.source}"`,
      `"${e.severity.toUpperCase()}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.author_name || '').replace(/"/g, '""')}"`,
      `"${e.author_role || ''}"`,
      `"${e.shift ? `Shift ${e.shift}` : ''}"`,
      `"${e.slot_time ? `Slot ${e.slot_time} Hrs` : ''}"`,
      `"${e.lot_no ? `Lot ${e.lot_no}` : ''}"`,
      `"${e.requires_acknowledgment ? 'YES' : 'NO'}"`,
      `"${e.acknowledged ? 'ACKNOWLEDGED' : e.requires_acknowledgment ? 'PENDING_SIGNOFF' : 'AUTO_AUDIT'}"`,
      `"${(e.acknowledged_by || '').replace(/"/g, '""')}"`,
      `"${e.acknowledged_at || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Trail_${sheet.sheet_date || new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatAuditTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { datePart: "", timePart: isoString };
      const datePart = d.toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const timePart = d.toLocaleTimeString("en-MY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      return { datePart, timePart };
    } catch {
      return { datePart: "", timePart: isoString };
    }
  };

  const getSourceBadge = (source: SupervisorUpdateEvent["source"]) => {
    switch (source) {
      case "Bleaching Log":
        return {
          icon: <Layers className="w-3.5 h-3.5 text-amber-500" />,
          label: "RF-FR-003 Bleaching",
          className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
        };
      case "QC Lab":
        return {
          icon: <FlaskConical className="w-3.5 h-3.5 text-sky-500" />,
          label: "RF-FR-001 QC Lab",
          className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
        };
      case "Operating Parameters":
        return {
          icon: <Sliders className="w-3.5 h-3.5 text-purple-500" />,
          label: "Process Parameters",
          className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
        };
      case "Supervisor Monitoring":
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
          label: "Supervisor Hub",
          className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-zinc-400" />,
          label: "System Auto-Audit",
          className: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25",
        };
    }
  };

  const getSeverityBadge = (severity: SupervisorUpdateEvent["severity"]) => {
    switch (severity) {
      case "alert":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <AlertCircle className="w-3 h-3" /> Out of Spec · Critical
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Attention Required
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Verified / In-Spec
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <Clock className="w-3 h-3" /> Routine Info
          </span>
        );
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "supervisor":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "manager_qa":
      case "chemist":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "technician":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "admin":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30";
    }
  };

  const getCardStyle = (evt: SupervisorUpdateEvent) => {
    if (evt.requires_acknowledgment && !evt.acknowledged) {
      return "border-l-4 border-l-rose-500 bg-rose-500/[0.04] dark:bg-rose-950/20 border-rose-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.12)]";
    }
    if (evt.severity === "alert") {
      return "border-l-4 border-l-rose-500 bg-rose-500/[0.03] dark:bg-rose-950/20 border-rose-500/30 shadow-xs";
    }
    if (evt.severity === "warning") {
      return "border-l-4 border-l-amber-500 bg-amber-500/[0.03] dark:bg-amber-950/20 border-amber-500/30 shadow-xs";
    }
    if (evt.severity === "success") {
      return "border-l-4 border-l-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-950/20 border-emerald-500/30 shadow-xs";
    }
    return "border-l-4 border-l-blue-500/60 bg-white/80 dark:bg-white/[0.03] border-zinc-200/90 dark:border-white/10 shadow-xs";
  };

  return (
    <div className="space-y-6 [transform-style:preserve-3d]">
      {/* 1. Header Bar with Luxury Glassmorphism & 3D Specular Highlight */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-md border border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Supervisor Monitoring &amp; Audit Hub
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Monitor process entries, out-of-spec deviations, QC laboratory results, and real-time shift verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenReviewModal}
            className="btn-premium-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer group shrink-0"
          >
            <ShieldCheck className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Review &amp; Approve Sheet</span>
          </button>

          <button
            onClick={onOpenPdfModal}
            className="btn-tactile btn-premium-glass flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer group shrink-0 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
            <span>Preview PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Live Shift Health Progress Cards with 3D Depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shift 1 */}
        <div className="telemetry-card p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Shift 1 (Morning) · 0800-1500
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500">
              {Math.round((s1Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200/90 dark:bg-white/10 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${(s1Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Technician:</span>
              {techS1.isPending ? (
                <span className="inline-flex items-center gap-1 text-zinc-400 italic font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-400" /> Awaiting Check-in
                </span>
              ) : (
                <strong className="text-zinc-800 dark:text-zinc-200">{techS1.name}</strong>
              )}
              {techS1.source === "auto" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Auto
                </span>
              )}
              {techS1.source === "manual" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                  Roster
                </span>
              )}
              <button
                type="button"
                onClick={() => setRosterModalShift(1)}
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                title="Assign or change Shift 1 roster technician"
              >
                <UserCheck className="w-3 h-3" />
                <span>Assign</span>
              </button>
            </div>
            <span className="font-mono font-bold">{s1Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="telemetry-card p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${s2Completed > 0 ? "bg-emerald-500" : "bg-zinc-400"}`} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Shift 2 (Afternoon) · 1600-2300
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              {Math.round((s2Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200/90 dark:bg-white/10 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
            <div 
              className="bg-zinc-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(s2Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Technician:</span>
              {techS2.isPending ? (
                <span className="inline-flex items-center gap-1 text-zinc-400 italic font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-400" /> Awaiting Check-in
                </span>
              ) : (
                <strong className="text-zinc-800 dark:text-zinc-200">{techS2.name}</strong>
              )}
              {techS2.source === "auto" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Auto
                </span>
              )}
              {techS2.source === "manual" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                  Roster
                </span>
              )}
              <button
                type="button"
                onClick={() => setRosterModalShift(2)}
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                title="Assign or change Shift 2 roster technician"
              >
                <UserCheck className="w-3 h-3" />
                <span>Assign</span>
              </button>
            </div>
            <span className="font-mono font-bold">{s2Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 3 */}
        <div className="telemetry-card p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${s3Completed > 0 ? "bg-emerald-500" : "bg-zinc-400"}`} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Shift 3 (Night) · 2400-0700
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              {Math.round((s3Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200/90 dark:bg-white/10 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
            <div 
              className="bg-zinc-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(s3Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Technician:</span>
              {techS3.isPending ? (
                <span className="inline-flex items-center gap-1 text-zinc-400 italic font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-400" /> Awaiting Check-in
                </span>
              ) : (
                <strong className="text-zinc-800 dark:text-zinc-200">{techS3.name}</strong>
              )}
              {techS3.source === "auto" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Auto
                </span>
              )}
              {techS3.source === "manual" && (
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                  Roster
                </span>
              )}
              <button
                type="button"
                onClick={() => setRosterModalShift(3)}
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                title="Assign or change Shift 3 roster technician"
              >
                <UserCheck className="w-3 h-3" />
                <span>Assign</span>
              </button>
            </div>
            <span className="font-mono font-bold">{s3Completed} / 8 Hours Logged</span>
          </div>
        </div>
      </div>

      {/* 3. Executive Telemetry Row for Audit Trail */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Audit Records */}
        <button
          type="button"
          onClick={() => setQuickFilter("ALL")}
          className={`telemetry-card text-left p-4 rounded-2xl border transition-all cursor-pointer group ${
            quickFilter === "ALL" 
              ? "ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30" 
              : "hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-zinc-500">
              Total Audit Log
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
              {totalEventsCount}
            </span>
            <span className="text-xs text-zinc-500 font-medium">records</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Full event trail across systems</p>
        </button>

        {/* Critical Out-of-Spec */}
        <button
          type="button"
          onClick={() => setQuickFilter("alert")}
          className={`telemetry-card text-left p-4 rounded-2xl border transition-all cursor-pointer group ${
            quickFilter === "alert" 
              ? "ring-2 ring-rose-500/50 bg-rose-50/60 dark:bg-rose-950/30 border-rose-500/40" 
              : alertEventsCount > 0 
              ? "bg-rose-500/[0.04] dark:bg-rose-950/20 border-rose-500/30" 
              : "hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Critical Out-of-Spec
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {alertEventsCount}
            </span>
            <span className="text-xs text-rose-500 font-medium">alerts</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Critical parameter breaches</p>
        </button>

        {/* Pending Supervisor Sign-Off */}
        <button
          type="button"
          onClick={() => setQuickFilter("signoff")}
          className={`telemetry-card text-left p-4 rounded-2xl border transition-all cursor-pointer group ${
            quickFilter === "signoff" 
              ? "ring-2 ring-amber-500/50 bg-amber-50/60 dark:bg-amber-950/30 border-amber-500/40" 
              : pendingAlertCount > 0 
              ? "bg-amber-500/[0.05] dark:bg-amber-950/20 border-amber-500/40" 
              : "hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Sign-Off
            </span>
            <span className={`p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${pendingAlertCount > 0 ? 'animate-pulse' : ''}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {pendingAlertCount}
            </span>
            <span className="text-xs text-amber-500 font-medium">pending</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Requires supervisor signature</p>
        </button>

        {/* Verified Compliance */}
        <button
          type="button"
          onClick={() => setQuickFilter("routine")}
          className={`telemetry-card text-left p-4 rounded-2xl border transition-all cursor-pointer group ${
            quickFilter === "routine" 
              ? "ring-2 ring-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/40" 
              : "hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified &amp; Routine
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {routineEventsCount}
            </span>
            <span className="text-xs text-emerald-500 font-medium">compliant</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Logged without deviations</p>
        </button>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 shadow-sm border border-zinc-200/90 dark:border-white/10">
        {/* Row 1: Quick Filter Pills & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-white/5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setQuickFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quickFilter === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              All Logs ({totalEventsCount})
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter("signoff")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                quickFilter === "signoff"
                  ? "bg-amber-600 text-white shadow-sm"
                  : pendingAlertCount > 0
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              {pendingAlertCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              Requires Sign-off ({pendingAlertCount})
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter("alert")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                quickFilter === "alert"
                  ? "bg-rose-600 text-white shadow-sm"
                  : alertEventsCount > 0
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              Critical Alerts ({alertEventsCount})
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter("warning")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quickFilter === "warning"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              Warnings ({warningEventsCount})
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter("routine")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quickFilter === "routine"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              Routine &amp; Verified ({routineEventsCount})
            </button>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            {isFilteringActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear all search queries and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportAuditCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white/10 text-white dark:text-zinc-200 hover:bg-zinc-800 dark:hover:bg-white/20 transition-all cursor-pointer shadow-xs shrink-0"
              title="Download filtered audit trail as CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Input and Secondary Dropdowns */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, author, hourly slot (e.g. 1000), lot number, or keyword..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs p-1"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48 sm:w-52">
              <RadioSelect
                value={filterSeverity}
                onChange={(val) => setFilterSeverity(val)}
                options={[
                  { value: "ALL", label: "All Severities" },
                  { value: "alert", label: "Alert (Critical)" },
                  { value: "warning", label: "Warning (Attention)" },
                  { value: "success", label: "Success (In-Spec)" },
                  { value: "info", label: "Routine Info" },
                ]}
                icon={<Filter className="w-3.5 h-3.5 text-zinc-400" />}
                size="sm"
              />
            </div>

            <div className="w-52 sm:w-56">
              <RadioSelect
                value={filterSource}
                onChange={(val) => setFilterSource(val)}
                options={[
                  { value: "ALL", label: "All Form Sources" },
                  { value: "Bleaching Log", label: "Bleaching Log (RF-FR-003)" },
                  { value: "QC Lab", label: "QC Lab (RF-FR-001)" },
                  { value: "Operating Parameters", label: "Operating Parameters" },
                  { value: "Supervisor Monitoring", label: "Supervisor Hub" },
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Activity Timeline List */}
      <div className="glass-panel rounded-2xl shadow-sm p-5 space-y-4 border border-zinc-200/90 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Audit Trail &amp; Recent Updates
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
              {filteredEvents.length} Events Showing
            </span>
          </div>

          {pendingAlertCount > 0 && (
            <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>{pendingAlertCount} Requires Supervisor Sign-Off</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                <FilterX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                No Audit Records Found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No activity records matched your active filter or search criteria.
              </p>
              {isFilteringActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer mt-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const { datePart, timePart } = formatAuditTimestamp(evt.timestamp);
              const sourceBadge = getSourceBadge(evt.source);
              const roleBadge = getRoleBadge(evt.author_role);
              const cardClass = getCardStyle(evt);

              return (
                <div
                  key={evt.id}
                  className={`telemetry-card p-4 sm:p-4.5 rounded-xl border transition-all ${cardClass}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3.5">
                    {/* Left: Icon, Main Info, Metadata */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Source Icon Box */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 shadow-xs shrink-0 mt-0.5">
                        {sourceBadge.icon}
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Row 1: Badges & Timestamp */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Form Source Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${sourceBadge.className}`}>
                            {sourceBadge.label}
                          </span>

                          {/* Severity Badge */}
                          {getSeverityBadge(evt.severity)}

                          {/* Timestamp Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{datePart ? `${datePart} · ${timePart}` : timePart}</span>
                          </span>
                        </div>

                        {/* Row 2: Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {evt.title}
                        </h3>

                        {/* Row 3: Description */}
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-lg border border-black/[0.04] dark:border-white/[0.04]">
                          {evt.description}
                        </p>

                        {/* Row 4: Chips Bar (Author, Role, Shift, Slot, Lot) */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium pt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 text-[11px]">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>Recorded by: <strong className="text-zinc-800 dark:text-zinc-200">{evt.author_name}</strong></span>
                            {evt.author_role && (
                              <span className={`ml-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold border capitalize ${roleBadge}`}>
                                {evt.author_role.replace('_', ' ')}
                              </span>
                            )}
                          </span>

                          {evt.shift && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 text-[11px] font-medium">
                              <span>Shift {evt.shift}</span>
                            </span>
                          )}

                          {evt.slot_time && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-mono font-bold">
                              <span>Slot {evt.slot_time} Hrs</span>
                            </span>
                          )}

                          {evt.lot_no && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[11px] font-mono font-bold">
                              <Tag className="w-3 h-3" />
                              <span>Lot {evt.lot_no}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Supervisor Sign-off & Verification */}
                    <div className="shrink-0 flex lg:flex-col items-end justify-between lg:justify-start gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-200/60 dark:border-white/5">
                      {evt.requires_acknowledgment ? (
                        evt.acknowledged ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-[11px] leading-tight">Supervisor Verified</span>
                              <span className="text-[10px] text-zinc-500 font-mono font-normal leading-tight">
                                Signed by {evt.acknowledged_by || currentUser.name}
                                {evt.acknowledged_at && ` at ${new Date(evt.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-display">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Action Required
                            </span>
                            <button
                              type="button"
                              onClick={() => onAcknowledgeEvent(evt.id, currentUser.name)}
                              className="btn-premium-amber flex items-center gap-2 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                            >
                              <Check className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                              <span>Sign Off &amp; Acknowledge</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-[10.5px] font-mono text-zinc-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                          <span>Tamper-evident Auto Audit</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Shift Roster Assignment Modal (Option 3: Smart Hybrid) */}
      {rosterModalShift !== null && (
        <ShiftRosterModal
          isOpen={true}
          onClose={() => setRosterModalShift(null)}
          shiftNum={rosterModalShift}
          sheet={sheet}
          allUsers={allUsers}
          onSaveRoster={(updates) => {
            if (onUpdateShiftTechnician) {
              onUpdateShiftTechnician(updates);
            }
          }}
        />
      )}
    </div>
  );
};
