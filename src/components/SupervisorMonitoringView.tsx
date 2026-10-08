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
  Activity
} from "lucide-react";
import { RadioSelect } from "./RadioSelect";
import { calculatePipelineMetrics } from "@/lib/workflowPipeline";
import { evaluateSlotAccess, getSlotTimeLabel } from "@/lib/realtimeTimeline";

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
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUnlockPanel, setShowUnlockPanel] = useState<boolean>(false);

  const pipelineMetrics = calculatePipelineMetrics(sheet, qcReports);

  // Shift metrics calculation
  const s1Slots = sheet.entries.slice(0, 8);
  const s2Slots = sheet.entries.slice(8, 16);
  const s3Slots = sheet.entries.slice(16, 24);

  const s1Completed = s1Slots.filter((e) => e.is_saved).length;
  const s2Completed = s2Slots.filter((e) => e.is_saved).length;
  const s3Completed = s3Slots.filter((e) => e.is_saved).length;

  const pendingAlertCount = events.filter((e) => e.requires_acknowledgment && !e.acknowledged).length;

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesSeverity = filterSeverity === "ALL" || e.severity === filterSeverity;
    const matchesSource = filterSource === "ALL" || e.source === filterSource;
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.slot_time && e.slot_time.includes(searchQuery));
    return matchesSeverity && matchesSource && matchesSearch;
  });

  const getSeverityBadge = (severity: SupervisorUpdateEvent['severity']) => {
    switch (severity) {
      case "alert":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <AlertCircle className="w-3 h-3 text-rose-500" /> Out of Spec Alert
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Attention Required
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed / In-Spec
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
            <Clock className="w-3 h-3 text-zinc-400" /> Info
          </span>
        );
    }
  };

  const getSourceIcon = (source: SupervisorUpdateEvent['source']) => {
    switch (source) {
      case "Bleaching Log":
        return <Layers className="w-4 h-4 text-amber-500" />;
      case "QC Lab":
        return <FlaskConical className="w-4 h-4 text-sky-500" />;
      case "Operating Parameters":
        return <Sliders className="w-4 h-4 text-purple-500" />;
      case "Supervisor Monitoring":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
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

      {/* 1.5 Pipeline Command Center (Bleaching Log -> QC Lab -> Reports -> Supervisor) */}
      <div className="glass-panel p-5 rounded-2xl shadow-lg border border-amber-500/25 dark:border-amber-500/20 bg-gradient-to-br from-zinc-50 via-amber-500/[0.03] to-zinc-50 dark:from-[#0B101E] dark:via-[#11172A] dark:to-[#0B101E]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Integrated Workflow Pipeline Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {pipelineMetrics.completionRatePercent}% Synchronized
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Bleaching Log &#10140; QC Lab &#10140; Reports &#10140; Supervisor Monitoring 100% synchronized in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnlockPanel(!showUnlockPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showUnlockPanel 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/15'
              }`}
            >
              {showUnlockPanel ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-amber-500" />}
              <span>{showUnlockPanel ? "Close Lock Controls" : "Operator Slot Lock Controls"}</span>
            </button>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Stage 1: Bleaching Log
                </span>
                <span className="font-mono text-xs font-bold">STAGE 1</span>
              </div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {pipelineMetrics.savedSlotsCount} / 24 Slots
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Process telemetry data recorded by duty operator.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
              <span>Active Slot: {getSlotTimeLabel(activeCurrentHourIndex)} Hrs</span>
              <span>🔒 Auto-Time Lock</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Stage 2: QC Lab
                </span>
                <span className="font-mono text-xs font-bold">STAGE 2</span>
              </div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {pipelineMetrics.qcDecidedSamples} Verified
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {pipelineMetrics.qcPendingSamples} samples undergoing lab testing (RF-FR-001).
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-sky-500/20 text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center justify-between">
              <span>Lab Results: Synchronized</span>
              <span>Colour &amp; FFA</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Stage 3: Reports
                </span>
                <span className="font-mono text-xs font-bold">STAGE 3</span>
              </div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {pipelineMetrics.reportsReadyCount} Processed Slots
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Yield calculation, deviation analysis &amp; audit exports.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-between">
              <span>Compliance: In-Spec</span>
              <span>RF-FR-003 Rev 03</span>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stage 4: Supervisor
                </span>
                <span className="font-mono text-xs font-bold">STAGE 4</span>
              </div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {sheet.status === 'Approved' ? 'Fully Approved' : 'Active Oversight'}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Form integrity verification and emergency slot release control.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
              <span>Status: {sheet.status}</span>
              <span>100% Authority</span>
            </div>
          </div>
        </div>

        {/* Emergency Slot Unlock Control Matrix */}
        {showUnlockPanel && (
          <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-white/10 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-zinc-900 dark:text-zinc-100 block">
                  Real-Time Slot Locking Policy:
                </strong>
                <p className="text-zinc-600 dark:text-zinc-300 mt-0.5 text-xs">
                  Operators are only permitted to enter data for active hourly slots (e.g., at 09:00 only the 09:00 slot is accessible).
                  Past time slots are automatically locked to safeguard audit integrity. In case of emergency retrospective logging,
                  supervisors can unlock any slot below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {sheet.entries.map((entry, idx) => {
                const isCurrent = idx === activeCurrentHourIndex;
                const isPast = idx < activeCurrentHourIndex;
                const isFuture = idx > activeCurrentHourIndex;
                const isOverride = supervisorUnlockedSlots.includes(idx);

                return (
                  <div
                    key={entry.time_label}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : isOverride
                          ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : isPast
                            ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50'
                            : 'border-zinc-200 dark:border-zinc-800/50 opacity-60'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.time_label} Hrs
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 font-medium">
                      {isCurrent ? (
                        <span className="text-emerald-500 font-bold">ACTIVE</span>
                      ) : isOverride ? (
                        <span className="text-amber-500 font-bold">UNLOCKED</span>
                      ) : isPast ? (
                        <span>LOCKED</span>
                      ) : (
                        <span>UPCOMING</span>
                      )}
                    </div>

                    {isPast && onUnlockSlot && (
                      <button
                        onClick={() => onUnlockSlot(idx)}
                        className={`mt-1.5 w-full py-1 px-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isOverride
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        {isOverride ? "Re-Lock Slot" : "Unlock Slot"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                Shift 1 (0800-1500)
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
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">Ahmad Razif</strong></span>
            <span className="font-mono font-bold">{s1Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="telemetry-card p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Shift 2 (1600-2300)
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
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">Mohd Danial</strong></span>
            <span className="font-mono font-bold">{s2Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 3 */}
        <div className="telemetry-card p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Shift 3 (2400-0700)
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
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">K. Subramaniam</strong></span>
            <span className="font-mono font-bold">{s3Completed} / 8 Hours Logged</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail, hourly slot, staff name, or alert type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-52">
            <RadioSelect
              value={filterSeverity}
              onChange={(val) => setFilterSeverity(val)}
              options={[
                { value: "ALL", label: "All Severity Levels" },
                { value: "alert", label: "Alert (Critical)" },
                { value: "warning", label: "Warning (Attention)" },
                { value: "success", label: "Success (In-Spec)" },
                { value: "info", label: "Info" },
              ]}
              icon={<Filter className="w-3.5 h-3.5 text-zinc-400" />}
              size="sm"
            />
          </div>

          <div className="w-56">
            <RadioSelect
              value={filterSource}
              onChange={(val) => setFilterSource(val)}
              options={[
                { value: "ALL", label: "All Sources" },
                { value: "Bleaching Log", label: "Bleaching Log (RF-FR-003)" },
                { value: "QC Lab", label: "QC Lab (RF-FR-001)" },
                { value: "Operating Parameters", label: "Operating Parameters" },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 4. Live Activity Timeline List */}
      <div className="glass-panel rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Audit Trail &amp; Recent Updates
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
              {filteredEvents.length} Events
            </span>
          </div>

          {pendingAlertCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              {pendingAlertCount} Requires Supervisor Acknowledgment
            </span>
          )}
        </div>

        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-mono text-xs">
              No activity found matching these filter criteria.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const formattedTime = new Date(evt.timestamp).toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div
                  key={evt.id}
                  className={`telemetry-card p-4 rounded-xl border transition-all ${
                    evt.severity === "alert"
                      ? "bg-rose-500/5 dark:bg-rose-950/25 border-rose-500/40 shadow-[0_4px_16px_rgba(239,68,68,0.15)]"
                      : evt.severity === "warning"
                      ? "bg-amber-500/5 dark:bg-amber-950/25 border-amber-500/40 shadow-[0_4px_16px_rgba(245,158,11,0.15)]"
                      : "bg-white/80 dark:bg-white/[0.04] border-zinc-200/90 dark:border-white/10 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 shadow-xs shrink-0">
                        {getSourceIcon(evt.source)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {evt.title}
                          </h3>
                          {getSeverityBadge(evt.severity)}
                          <span className="text-xs font-mono font-medium text-zinc-500">
                            {formattedTime}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium pt-1 flex-wrap">
                          <span>Recorded by: <strong className="text-zinc-800 dark:text-zinc-200">{evt.author_name}</strong> ({evt.author_role})</span>
                          {evt.shift && <span>· Shift {evt.shift}</span>}
                          {evt.slot_time && <span className="font-mono">· Slot {evt.slot_time} Hrs</span>}
                          {evt.lot_no && <span className="font-mono">· Lot {evt.lot_no}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Acknowledgment action for supervisors */}
                    <div className="shrink-0 flex sm:flex-col items-end justify-between gap-2 pt-2 sm:pt-0">
                      {evt.requires_acknowledgment ? (
                        evt.acknowledged ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledged ({evt.acknowledged_by || currentUser.name})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeEvent(evt.id, currentUser.name)}
                            className="btn-premium-amber flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer group"
                          >
                            <Check className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                            <span>Acknowledge Entry</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-zinc-400 font-mono">
                          Auto-Audit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
