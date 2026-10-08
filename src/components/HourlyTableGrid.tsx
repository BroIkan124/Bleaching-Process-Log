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
  Unlock 
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
}

export const HourlyTableGrid: React.FC<HourlyTableGridProps> = ({
  entries,
  currentUser,
  onSelectSlot,
  selectedSlotIndex,
  activeCurrentHourIndex,
  supervisorUnlockedSlots = [],
  userRole,
}) => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)]">
      {/* Table Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-zinc-50 via-zinc-100/80 to-zinc-50 dark:from-[#0E1626] dark:via-[#121A30] dark:to-[#0E1626] border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Bleaching Process Log Sheet (RF-FR-003 Rev 03)
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Complete 24-Hour Continuous Telemetry · Real-Time Access Window Verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400">Active Slot (Open)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Locked (Past / Upcoming)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">In-Spec</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Out of Spec</span>
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* Unified Sticky Header */}
            <tr className="sticky top-0 z-20 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider select-none shadow-xs">
              <th className="py-3 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-24">Time (Hrs)</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800">Flow (MT/HR)</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Acid Dose</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400">
                HE Temp (°C)
              </th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">BE Dose</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Level</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                Vacuum (mmHg)
              </th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Niagara</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Filter Cut</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800 text-sky-600 dark:text-sky-400">FFA (%)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400">Red (R)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Yel (Y)</th>
              <th className="py-3 px-3 border-r border-zinc-200 dark:border-zinc-800 min-w-[200px]">Remarks</th>
              <th className="py-3 px-3 text-center w-32">Status / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-sans">
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
                  {/* Shift Divider Banners */}
                  {isShift1Start && (
                    <tr className="bg-amber-500/[0.06] dark:bg-amber-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-amber-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2.5 px-4 font-bold text-xs tracking-wide">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">SHIFT 1 (0800 - 1500 HRS)</span> - On-Duty Operations
                      </td>
                    </tr>
                  )}
                  {isShift2Start && (
                    <tr className="bg-sky-500/[0.06] dark:bg-sky-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-sky-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2.5 px-4 font-bold text-xs tracking-wide">
                        <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">SHIFT 2 (1600 - 2300 HRS)</span> - On-Duty Operations
                      </td>
                    </tr>
                  )}
                  {isShift3Start && (
                    <tr className="bg-purple-500/[0.06] dark:bg-purple-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-purple-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2.5 px-4 font-bold text-xs tracking-wide">
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">SHIFT 3 (2400 - 0700 HRS)</span> - On-Duty Operations
                      </td>
                    </tr>
                  )}

                  <tr
                      key={entry.id}
                      onClick={() => {
                        if (isAccessible) onSelectSlot(idx);
                      }}
                      className={`transition-colors duration-150 select-none ${
                        isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                      } ${
                        isCurrent
                          ? "bg-amber-500/[0.08] dark:bg-amber-500/[0.12] font-semibold"
                          : isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/20"
                            : access.status === 'future_locked'
                              ? "opacity-50 bg-zinc-50/40 dark:bg-zinc-900/20"
                              : "hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Time Label */}
                      <td className="py-2.5 px-3 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono font-extrabold text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrent && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                          <span>{entry.time_label}</span>
                          {!isAccessible && (
                            <Lock className="w-2.5 h-2.5 text-zinc-400 inline ml-0.5" />
                          )}
                        </div>
                      </td>

                      {/* Flow */}
                      <td className="py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold">
                        {typeof entry.flowrate_set === 'number' ? entry.flowrate_set.toFixed(1) : "-"}
                      </td>

                      {/* Acid Dose */}
                      <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                        {entry.acid_dosage_ok ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto stroke-[2.5]" />
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">-</span>
                        )}
                      </td>

                      {/* HE Temp */}
                      <td className={`py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold ${
                        isTempOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10" : "text-zinc-900 dark:text-zinc-100"
                      }`}>
                        {typeof entry.he_temp_c === 'number' ? entry.he_temp_c.toFixed(1) : "-"}
                      </td>

                      {/* BE Dose */}
                      <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                        {entry.earth_dosage_ok ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto stroke-[2.5]" />
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Level */}
                      <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono font-semibold">
                        {entry.bleacher_level || "-"}
                      </td>

                      {/* Vacuum */}
                      <td className={`py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold ${
                        isVacOutOfSpec ? "text-rose-600 dark:text-rose-400 bg-rose-500/10" : "text-zinc-900 dark:text-zinc-100"
                      }`}>
                        {typeof entry.vacuum_mmhg === 'number' ? entry.vacuum_mmhg : "-"}
                      </td>

                      {/* Niagara */}
                      <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono font-medium">
                        {entry.niagara_filter || "-"}
                      </td>

                      {/* Filter Cut */}
                      <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono text-xs">
                        {entry.filter_change_time || "-"}
                      </td>

                      {/* FFA */}
                      <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                        {typeof entry.ffa_pct === 'number' ? entry.ffa_pct.toFixed(3) : "-"}
                      </td>

                      {/* Red */}
                      <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                        {typeof entry.colour_r === 'number' ? entry.colour_r.toFixed(1) : "-"}
                      </td>

                      {/* Yellow */}
                      <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold">
                        {typeof entry.colour_y === 'number' ? entry.colour_y.toFixed(1) : "-"}
                      </td>

                      {/* Remarks */}
                      <td className="py-2.5 px-3 border-r border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-300 truncate max-w-[220px]">
                        {entry.remarks || <span className="text-zinc-400 dark:text-zinc-600 italic">No remarks recorded</span>}
                      </td>

                      {/* Actions / Real-time Status */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={!isAccessible}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAccessible) onSelectSlot(idx);
                          }}
                          className={`btn-tactile table-action-btn px-2.5 py-1 rounded-lg text-xs font-bold border transition-all inline-flex items-center gap-1.5 shadow-2xs ${
                            isCurrent
                              ? "bg-amber-500 text-white border-amber-500 shadow-[0_2px_12px_rgba(245,158,11,0.4)] hover:bg-amber-600 cursor-pointer"
                              : isSupervisorOverride
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white cursor-pointer"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200/80 dark:border-zinc-800 cursor-not-allowed opacity-75"
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5 text-white" />
                              <span>Log Entry</span>
                            </>
                          ) : isSupervisorOverride ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Override</span>
                            </>
                          ) : isSaved ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Locked (Saved)</span>
                            </>
                          ) : access.status === 'past_locked' ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Locked (Past)</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Locked (Pending)</span>
                            </>
                          )}
                        </button>
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
