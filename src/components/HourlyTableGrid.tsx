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
  Send,
  RefreshCw,
  AlertCircle
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
  onDispatchRetest?: (slotIndex: number) => void;
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
  onDispatchRetest,
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
            <tr className="sticky top-0 z-20 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 text-xs sm:text-[13px] select-none">
              <th className="py-2 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[52px]">Time</th>
              <th className="py-2 px-1 text-right border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[50px]">Flow</th>
              <th className="py-2 px-0.5 text-center border-r border-zinc-200 dark:border-zinc-800 w-[3.5%] min-w-[34px]">Acid</th>
              <th className="py-2 px-1 text-right border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[52px]" title="Heat Exchanger Temperature (°C)">HE Temp</th>
              <th className="py-2 px-0.5 text-center border-r border-zinc-200 dark:border-zinc-800 w-[3.5%] min-w-[34px]" title="Bleaching Earth Dosage">BE Dose</th>
              <th className="py-2 px-0.5 text-center border-r border-zinc-200 dark:border-zinc-800 w-[3.5%] min-w-[34px]">Level</th>
              <th className="py-2 px-1 text-right border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[52px]" title="Vacuum (mmHg)">Vacuum</th>
              <th className="py-2 px-0.5 text-center border-r border-zinc-200 dark:border-zinc-800 w-[4%] min-w-[38px]">Niagara</th>
              <th className="py-2 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[48px]" title="Filter Change / Cut Time">Cut Time</th>
              <th className="py-2 px-1 text-right border-r border-zinc-200 dark:border-zinc-800 w-[5.5%] min-w-[48px]">FFA (%)</th>
              <th className="py-2 px-0.5 text-right border-r border-zinc-200 dark:border-zinc-800 w-[4%] min-w-[38px]">Red (R)</th>
              <th className="py-2 px-0.5 text-right border-r border-zinc-200 dark:border-zinc-800 w-[4%] min-w-[38px]">Yel (Y)</th>
              <th className="py-2 px-1.5 text-left border-r border-zinc-200 dark:border-zinc-800 w-[18%] min-w-[90px]">Remarks</th>
              <th className="py-2 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 w-[8.5%] min-w-[68px]">Status</th>
              <th className="py-2 px-1 text-center w-[16.5%] min-w-[100px]">QC Sample</th>
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
                    <tr className="bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-2.5 text-sm font-bold tracking-wide">
                        Shift 1 (Morning) — 08:00 to 15:00
                      </td>
                    </tr>
                  )}
                  {isShift2Start && (
                    <tr className="bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-2.5 text-sm font-bold tracking-wide">
                        Shift 2 (Afternoon) — 16:00 to 23:00
                      </td>
                    </tr>
                  )}
                  {isShift3Start && (
                    <tr className="bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-y border-zinc-200/80 dark:border-zinc-800/80 select-none">
                      <td colSpan={15} className="py-1 px-2.5 text-sm font-bold tracking-wide">
                        Shift 3 (Night) — 24:00 to 07:00
                      </td>
                    </tr>
                  )}

                  <tr
                      key={entry.id}
                      onClick={() => {
                        if (isAccessible) onSelectSlot(idx);
                      }}
                      tabIndex={isAccessible ? 0 : -1}
                      aria-current={isCurrent ? "time" : undefined}
                      aria-label={`Slot ${entry.time_label}${isCurrent ? " (current hour)" : ""}${isAccessible ? ", press Enter to open" : ", locked"}`}
                      onKeyDown={(e) => {
                        if (isAccessible && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onSelectSlot(idx);
                        }
                      }}
                      className={`transition-colors duration-100 select-none ${
                        isAccessible ? "cursor-pointer" : "cursor-default"
                      } focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                        isCurrent
                          ? "bg-amber-500/[0.14] dark:bg-amber-500/[0.16] font-semibold shadow-[inset_4px_0_0_0_#f59e0b]"
                          : isSelected
                            ? "bg-zinc-100/70 dark:bg-zinc-800/50"
                            : access.status === 'future_locked'
                              ? "bg-zinc-50/40 dark:bg-zinc-900/10"
                              : "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Time Label */}
                      <td className="py-1.5 px-1 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono font-bold text-sm whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                          <span>{entry.time_label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-xs font-bold leading-none">NOW</span>
                          )}
                          {!isAccessible && (
                            <Lock className="w-2.5 h-2.5 text-zinc-500 inline shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Flow */}
                      <td className="py-1.5 px-1 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {typeof entry.flowrate_set === 'number' ? entry.flowrate_set.toFixed(1) : "-"}
                      </td>

                      {/* Acid Dose */}
                      <td className="py-1.5 px-0.5 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {entry.acid_dosage_ok ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[2.5]" role="img" aria-label="OK" />
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">-</span>
                        )}
                      </td>

                      {/* HE Temp */}
                      <td className={`py-1.5 px-1 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm whitespace-nowrap ${
                        isTempOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold" : "text-zinc-800 dark:text-zinc-200"
                      }`}>
                        {isTempOutOfSpec && <AlertTriangle className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" aria-hidden="true" />}
                        {typeof entry.he_temp_c === 'number' ? entry.he_temp_c.toFixed(1) : "-"}
                        {isTempOutOfSpec && <span className="sr-only"> (out of spec)</span>}
                      </td>

                      {/* BE Dose */}
                      <td className="py-1.5 px-0.5 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {entry.earth_dosage_ok ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[2.5]" role="img" aria-label="OK" />
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Level */}
                      <td className="py-1.5 px-0.5 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {entry.bleacher_level || "-"}
                      </td>

                      {/* Vacuum */}
                      <td className={`py-1.5 px-1 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm whitespace-nowrap ${
                        isVacOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold" : "text-zinc-800 dark:text-zinc-200"
                      }`}>
                        {isVacOutOfSpec && <AlertTriangle className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" aria-hidden="true" />}
                        {typeof entry.vacuum_mmhg === 'number' ? entry.vacuum_mmhg : "-"}
                        {isVacOutOfSpec && <span className="sr-only"> (out of spec)</span>}
                      </td>

                      {/* Niagara */}
                      <td className="py-1.5 px-0.5 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {entry.niagara_filter || "-"}
                      </td>

                      {/* Filter Cut */}
                      <td className="py-1.5 px-1 text-center border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {entry.filter_change_time || "-"}
                      </td>

                      {/* FFA */}
                      <td className="py-1.5 px-1 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {typeof entry.ffa_pct === 'number' ? entry.ffa_pct.toFixed(3) : "-"}
                      </td>

                      {/* Red */}
                      <td className="py-1.5 px-0.5 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {typeof entry.colour_r === 'number' ? entry.colour_r.toFixed(1) : "-"}
                      </td>

                      {/* Yellow */}
                      <td className="py-1.5 px-0.5 text-right border-r border-zinc-200/50 dark:border-zinc-800/50 font-mono tabular-nums text-sm text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {typeof entry.colour_y === 'number' ? entry.colour_y.toFixed(1) : "-"}
                      </td>

                      {/* Remarks */}
                      <td 
                        className="py-1.5 px-1.5 border-r border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 text-sm truncate max-w-[120px]"
                        title={entry.remarks || ''}
                      >
                        {entry.remarks ? entry.remarks : <span className="text-zinc-400 dark:text-zinc-500">-</span>}
                      </td>

                      {/* Status / Log Action */}
                      <td className="py-1.5 px-1 text-center border-r border-zinc-200/50 dark:border-zinc-800/50">
                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSlot(idx);
                            }}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer transition-all inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
                          >
                            <Edit3 className="w-4 h-4 text-white" aria-hidden="true" />
                            <span>Log</span>
                          </button>
                        ) : isSupervisorOverride ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSlot(idx);
                            }}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white cursor-pointer transition-all inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Unlock className="w-4 h-4" aria-hidden="true" />
                            <span>Override</span>
                          </button>
                        ) : isSaved ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400 text-sm inline-flex items-center gap-1 whitespace-nowrap">
                            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>

                      {/* QC Sample Dispatch & Retest Workflow Button */}
                      <td className="py-1.5 px-1 text-center">
                        {isSaved ? (
                          entry.qc_status === 'rejected' ? (
                            <div className="flex items-center justify-center gap-1 flex-nowrap">
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
                                Rejected
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDispatchRetest) onDispatchRetest(idx);
                                }}
                                title={`QC Rejected (${entry.qc_last_rejection_reason || 'Off-spec'}). Click to dispatch Retest sample R${(entry.qc_retest_count || 0) + 1}`}
                                className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer transition-all active:scale-95 whitespace-nowrap motion-safe:animate-pulse"
                              >
                                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                                <span>Retest</span>
                              </button>
                            </div>
                          ) : entry.qc_status === 'retest_pending' ? (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 font-mono whitespace-nowrap shadow-2xs">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow text-amber-500" />
                              <span>Retest (R{entry.qc_retest_count || 1})</span>
                            </span>
                          ) : entry.qc_status === 'passed' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold inline-flex items-center gap-1 font-mono whitespace-nowrap">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Passed</span>
                            </span>
                          ) : entry.qc_sample_sent ? (
                            <span className="text-sky-600 dark:text-sky-400 text-sm font-semibold inline-flex items-center gap-1 font-mono whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDispatchToQc) onDispatchToQc(idx);
                              }}
                              title="Dispatch this slot sample to QC Management"
                              className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                            >
                              <Send className="w-4 h-4" aria-hidden="true" />
                              <span>Send QC</span>
                            </button>
                          )
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">-</span>
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
