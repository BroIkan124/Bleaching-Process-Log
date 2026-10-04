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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" /> Out of Spec Alert
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" /> Attention Required
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Completed / In-Spec
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-3 h-3" /> Info
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
      {/* 1. Header Bar with Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Supervisor Monitoring &amp; Audit Hub (Live Supervisor Monitor)
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Monitor process entries, out-of-spec deviations, QC laboratory results, and real-time shift verification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenReviewModal}
            className="btn-premium-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer group shrink-0"
          >
            <ShieldCheck className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Review &amp; Approve Sheet</span>
          </button>

          <button
            onClick={onOpenPdfModal}
            className="btn-tactile btn-premium-glass flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer group shrink-0"
          >
            <FileText className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
            <span>Preview PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Live Shift Health Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shift 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Shift 1 (0800 – 1500)
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500">
              {Math.round((s1Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(s1Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Staff: <strong className="text-zinc-800 dark:text-zinc-200">Ahmad Razif</strong></span>
            <span className="font-mono">{s1Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Shift 2 (1600 – 2300)
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              {Math.round((s2Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-zinc-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(s2Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Staff: <strong className="text-zinc-800 dark:text-zinc-200">Mohd Danial</strong></span>
            <span className="font-mono">{s2Completed} / 8 Hours Logged</span>
          </div>
        </div>

        {/* Shift 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Shift 3 (2400 – 0700)
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              {Math.round((s3Completed / 8) * 100)}%
            </span>
          </div>

          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-zinc-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(s3Completed / 8) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Staff: <strong className="text-zinc-800 dark:text-zinc-200">K. Subramaniam</strong></span>
            <span className="font-mono">{s3Completed} / 8 Hours Logged</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail, hourly slot, staff name, or alert type..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
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
            className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="Bleaching Log">Bleaching Log (RF-FR-003)</option>
            <option value="QC Lab">QC Lab (RF-FR-001)</option>
            <option value="Operating Parameters">Operating Parameters</option>
          </select>
        </div>
      </div>

      {/* 4. Live Activity Timeline List */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Audit Trail &amp; Recent Updates
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {filteredEvents.length} Events
            </span>
          </div>

          {pendingAlertCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {pendingAlertCount} Requires Supervisor Acknowledgment
            </span>
          )}
        </div>

        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
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
                      ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                      : evt.severity === "warning"
                      ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                      : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
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
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
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
