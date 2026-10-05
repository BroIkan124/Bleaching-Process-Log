"use client";

import React, { useState } from "react";
import { LogSheet, SupervisorUpdateEvent, UserProfile } from "@/types";
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
  MessageSquare
} from "lucide-react";

interface SupervisorMonitoringViewProps {
  currentUser: UserProfile;
  sheet: LogSheet;
  events: SupervisorUpdateEvent[];
  onAcknowledgeEvent: (eventId: string, acknowledgedBy: string) => void;
  onOpenReviewModal: () => void;
  onOpenPdfModal: () => void;
}

export const SupervisorMonitoringView: React.FC<SupervisorMonitoringViewProps> = ({
  currentUser,
  sheet,
  events,
  onAcknowledgeEvent,
  onOpenReviewModal,
  onOpenPdfModal,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <AlertCircle className="w-3 h-3 text-rose-500" /> Out of Spec Alert
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Attention Required
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed / In-Spec
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
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
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Luxury Glassmorphism Overview */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
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
            className="btn-tactile flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 cursor-pointer group shrink-0 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
            <span>Preview PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Live Shift Health Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shift 1 */}
        <div className="telemetry-card p-4 rounded-2xl space-y-3">
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

          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(s1Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">Ahmad Razif</strong></span>
            <span className="font-mono">{s1Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="telemetry-card p-4 rounded-2xl space-y-3">
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

          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-zinc-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(s2Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">Mohd Danial</strong></span>
            <span className="font-mono">{s2Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 3 */}
        <div className="telemetry-card p-4 rounded-2xl space-y-3">
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

          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-zinc-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(s3Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Technician: <strong className="text-zinc-800 dark:text-zinc-200">K. Subramaniam</strong></span>
            <span className="font-mono">{s3Completed} / 8 Hours Logged</span>
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
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="ALL">All Severity Levels</option>
              <option value="alert">Alert (Critical)</option>
              <option value="warning">Warning (Attention)</option>
              <option value="success">Success (In-Spec)</option>
              <option value="info">Info</option>
            </select>
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="Bleaching Log">Bleaching Log (RF-FR-003)</option>
            <option value="QC Lab">QC Lab (RF-FR-001)</option>
            <option value="Operating Parameters">Operating Parameters</option>
          </select>
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
                  className={`p-4 rounded-xl border transition-all ${
                    evt.severity === "alert"
                      ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30"
                      : evt.severity === "warning"
                      ? "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30"
                      : "bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10"
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
                          <span className="text-[11px] font-mono font-medium text-zinc-500">
                            {formattedTime}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-medium pt-1 flex-wrap">
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
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
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
                        <span className="text-[11px] text-zinc-400 font-mono">
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
