"use client";

import React from "react";
import { LogEntry, UserProfile } from "@/types";
import { 
  Check, 
  AlertTriangle, 
  Edit3, 
  Eye, 
  Clock, 
  Lock, 
  Unlock,
  Send
} from "lucide-react";
import { evaluateSlotAccess } from "@/lib/realtimeTimeline";

interface HourlyTableGridProps {
  entries: LogEntry[];
  currentShift: 1 | 2 | 3;
  currentUser: UserProfile;
  isLocked: boolean;
  onSelectSlot: (slotIndex: number) => void;
  selectedSlotIndex: number;
  activeCurrentHourIndex: number;
  supervisorUnlockedSlots?: number[];
  userRole?: string;
  onDispatchToQc?: (slotIndex: number) => void;
  showTimelineRail?: boolean;
  onToggleTimelineRail?: () => void;
}

export const HourlyTableGrid: React.FC<HourlyTableGridProps> = ({
  entries,
  currentUser,
  onSelectSlot,
  selectedSlotIndex,
  activeCurrentHourIndex,
  supervisorUnlockedSlots = [],
  userRole,
  onDispatchToQc,
  showTimelineRail,
  onToggleTimelineRail,
}) => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-8 shadow-sm border border-zinc-200/80 dark:border-white/10">
      {/* Table Header Bar */}
      <div className="px-4 sm:px-5 py-3 bg-zinc-50/90 dark:bg-[#0E1626]/90 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Bleaching Process Log Sheet
            </h2>
            <p className="text-xs text-zinc-500 font-normal">
              24-Hour Continuous Telemetry (RF-FR-003)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 flex-wrap">
          {/* 24h Timeline Rail Toggle */}
          {onToggleTimelineRail && (
            <button
              type="button"
              onClick={onToggleTimelineRail}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTimelineRail
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-xs"
                  : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/80"
              }`}
              title="Toggle visual 24-Hour Timeline Slot Rail"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{showTimelineRail ? "Hide Timeline Rail" : "Show 24h Timeline Rail"}</span>
            </button>
          )}

          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Locked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In-Spec</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Out of Spec</span>
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* Unified Sticky Header */}
            <tr className="sticky top-0 z-20 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[11px] select-none">
              <th className="py-2.5 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-24">Time (Hrs)</th>
              <th className="py-2.5 px-3 text-right border-r border-zinc-200 dark:border-zinc-800">Flow (MT/HR)</th>
              <th className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Acid Dose</th>
              <th className="py-2.5 px-3 text-right border-r border-zinc-200 dark:border-zinc-800">
                HE Temp (deg C)
              </th>
              <th className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">BE Dose</th>
              <th className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Level</th>
              <th className="py-2.5 px-3 text-right border-r border-zinc-200 dark:border-zinc-800">
                Vacuum (mmHg)
              </th>
              <th className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Niagara</th>
              <th className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Filter Cut</th>
              <th className="py-2.5 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">FFA (%)</th>
              <th className="py-2.5 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Red (R)</th>
              <th className="py-2.5 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Yel (Y)</th>
              <th className="py-2.5 px-3 border-r border-zinc-200 dark:border-zinc-800 min-w-[180px]">Remarks</th>
              <th className="py-2.5 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-28">Status</th>
              <th className="py-2.5 px-3 text-center w-32">QC Sample</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
            {entries.map((entry, idx) => {
              const isSelected = selectedSlotIndex === idx;
              const isCurrent = activeCurrentHourIndex === idx;
              const isSupervisorOverride = supervisorUnlockedSlots.includes(idx);
              const access = evaluateSlotAccess(idx, activeCurrentHourIndex, isSupervisorOverride, currentUser.role);

              const isTempOutOfSpec = typeof entry.he_temp_c === 'number' && (entry.he_temp_c < 70 || entry.he_temp_c > 115);
              const isVacOutOfSpec = typeof entry.vacuum_mmhg === 'number' && entry.vacuum_mmhg < 600;
              const isSaved = entry.is_saved;

              // Clean Shift Boundary Headers
              const isShift1Start = idx === 0;
              const isShift2Start = idx === 8;
              const isShift3Start = idx === 16;
              const isAccessible = isCurrent || isSupervisorOverride;

              return (
                <React.Fragment key={entry.id}>
                  {/* Subtle Shift Divider Lines */}
                  {isShift1Start && (
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-3 text-[11px] font-semibold">
                        Shift 1 (08:00 - 15:00)
                      </td>
                    </tr>
                  )}
                  {isShift2Start && (
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-3 text-[11px] font-semibold">
                        Shift 2 (16:00 - 23:00)
                      </td>
                    </tr>
                  )}
                  {isShift3Start && (
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-3 text-[11px] font-semibold">
                        Shift 3 (24:00 - 07:00)
                      </td>
                    </tr>
                  )}

                  <tr
                      key={entry.id}
                      onClick={() => {
                        if (isAccessible) onSelectSlot(idx);
                      }}
                      className={`transition-colors duration-100 select-none ${
                        isAccessible ? "cursor-pointer" : "cursor-default"
                      } ${
                        isCurrent
                          ? "bg-amber-500/[0.08] dark:bg-amber-500/[0.12] font-semibold"
                          : isSelected
                            ? "bg-zinc-100/70 dark:bg-zinc-800/50"
                            : access.status === 'future_locked'
                              ? "opacity-60 bg-zinc-50/20 dark:bg-zinc-900/10"
                              : "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Time Label */}
                      <td className="py-2 px-3 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono font-bold text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                          <span>{entry.time_label}</span>
                          {!isAccessible && (
                            <Lock className="w-2.5 h-2.5 text-zinc-400/80 inline ml-0.5" />
                          )}
                        </div>
                      </td>

                      {/* Flow */}
                      <td className="py-2 px-3 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                        {typeof entry.flowrate_set === 'number' ? entry.flowrate_set.toFixed(1) : "-"}
                      </td>

                      {/* Acid Dose */}
                      <td className="py-2 px-2 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {entry.acid_dosage_ok ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto stroke-[2.5]" />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>

                      {/* HE Temp */}
                      <td className={`py-2 px-3 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums ${
                        isTempOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold" : "text-zinc-800 dark:text-zinc-200"
                      }`}>
                        {typeof entry.he_temp_c === 'number' ? entry.he_temp_c.toFixed(1) : "-"}
                      </td>

                      {/* BE Dose */}
                      <td className="py-2 px-2 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {entry.earth_dosage_ok ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto stroke-[2.5]" />
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>

                      {/* Level */}
                      <td className="py-2 px-2 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-zinc-800 dark:text-zinc-200">
                        {entry.bleacher_level || "-"}
                      </td>

                      {/* Vacuum */}
                      <td className={`py-2 px-3 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums ${
                        isVacOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold" : "text-zinc-800 dark:text-zinc-200"
                      }`}>
                        {typeof entry.vacuum_mmhg === 'number' ? entry.vacuum_mmhg : "-"}
                      </td>

                      {/* Niagara */}
                      <td className="py-2 px-2 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-zinc-800 dark:text-zinc-200">
                        {entry.niagara_filter || "-"}
                      </td>

                      {/* Filter Cut */}
                      <td className="py-2 px-2 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                        {entry.filter_change_time || "-"}
                      </td>

                      {/* FFA */}
                      <td className="py-2 px-2 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                        {typeof entry.ffa_pct === 'number' ? entry.ffa_pct.toFixed(3) : "-"}
                      </td>

                      {/* Red */}
                      <td className="py-2 px-2 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                        {typeof entry.colour_r === 'number' ? entry.colour_r.toFixed(1) : "-"}
                      </td>

                      {/* Yellow */}
                      <td className="py-2 px-2 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                        {typeof entry.colour_y === 'number' ? entry.colour_y.toFixed(1) : "-"}
                      </td>

                      {/* Remarks */}
                      <td className="py-2 px-3 border-r border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 truncate max-w-[200px]">
                        {entry.remarks ? entry.remarks : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                      </td>

                      {/* Status / Log Action */}
                      <td className="py-2 px-3 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSlot(idx);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer transition-all inline-flex items-center gap-1 active:scale-95"
                          >
                            <Edit3 className="w-3 h-3 text-white" />
                            <span>Log Entry</span>
                          </button>
                        ) : isSupervisorOverride ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSlot(idx);
                            }}
                            className="px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Override</span>
                          </button>
                        ) : isSaved ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium inline-flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 text-xs inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>

                      {/* QC Sample Dispatch Button */}
                      <td className="py-2 px-3 text-center">
                        {isSaved ? (
                          entry.qc_sample_sent ? (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium inline-flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Sample Sent</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDispatchToQc) onDispatchToQc(idx);
                              }}
                              title="Hantar sampel slot ini ke QC Management"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer transition-all active:scale-95"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send to QC</span>
                            </button>
                          )
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>
                    </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
