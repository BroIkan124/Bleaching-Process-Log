"use client";

import React from "react";
import { LogEntry, UserProfile } from "@/types";
import { 
  Check, 
  AlertTriangle, 
  Edit3, 
  Eye, 
  Clock, 
  CheckCircle2
} from "lucide-react";

interface HourlyTableGridProps {
  entries: LogEntry[];
  currentShift: 1 | 2 | 3;
  currentUser: UserProfile;
  isLocked: boolean;
  onSelectSlot: (slotIndex: number) => void;
  selectedSlotIndex: number;
}

export const HourlyTableGrid: React.FC<HourlyTableGridProps> = ({
  entries,
  currentShift,
  currentUser,
  isLocked,
  onSelectSlot,
  selectedSlotIndex,
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
            <p className="text-[11px] text-zinc-500 font-medium">
              Complete 24-Hour Continuous Telemetry · Click any row for fast slot entry &amp; parameter validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">In-Spec</span>
          </span>
          <span className="flex items-center gap-1.5 ml-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Out of Spec</span>
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* Unified Sticky Glassmorphic Header */}
            <tr className="sticky top-0 z-20 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider select-none shadow-xs">
              <th className="py-3 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-20">Time (Hrs)</th>
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
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">FFA (%)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Red (R)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Yel (Y)</th>
              <th className="py-3 px-3 border-r border-zinc-200 dark:border-zinc-800 min-w-[200px]">Remarks</th>
              <th className="py-3 px-2 text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-sans">
            {entries.map((entry, idx) => {
              const isSelected = selectedSlotIndex === idx;
              const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
              const isTempOutOfSpec = typeof entry.he_temp_c === 'number' && (entry.he_temp_c < 70 || entry.he_temp_c > 115);
              const isVacOutOfSpec = typeof entry.vacuum_mmhg === 'number' && entry.vacuum_mmhg < 600;
              const isSaved = entry.is_saved;

              // Clean Shift Boundary Headers
              const isShift1Start = idx === 0;
              const isShift2Start = idx === 8;
              const isShift3Start = idx === 16;

              return (
                <React.Fragment key={entry.id}>
                  {/* Shift Divider Banners */}
                  {isShift1Start && (
                    <tr className="bg-amber-500/[0.06] dark:bg-amber-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-amber-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">SHIFT 1 (0800 - 1500 HRS)</span> - On-Duty Technician: <strong className="text-zinc-900 dark:text-white">Ahmad Razif</strong>
                      </td>
                    </tr>
                  )}
                  {isShift2Start && (
                    <tr className="bg-sky-500/[0.06] dark:bg-sky-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-sky-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">SHIFT 2 (1600 - 2300 HRS)</span> - On-Duty Technician: <strong className="text-zinc-900 dark:text-white">Mohd Danial</strong>
                      </td>
                    </tr>
                  )}
                  {isShift3Start && (
                    <tr className="bg-purple-500/[0.06] dark:bg-purple-500/[0.08] text-zinc-800 dark:text-zinc-200 border-y border-purple-500/20 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <td colSpan={14} className="py-2 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">SHIFT 3 (2400 - 0700 HRS)</span> - On-Duty Technician: <strong className="text-zinc-900 dark:text-white">K. Subramaniam</strong>
                      </td>
                    </tr>
                  )}

                  {/* Main Hourly Slot Row */}
                  <tr
                    onClick={() => onSelectSlot(idx)}
                    className={`cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-amber-500/15 dark:bg-amber-500/20 border-l-4 border-l-amber-500 font-semibold shadow-[inset_4px_0_0_rgba(245,158,11,1),0_2px_12px_rgba(245,158,11,0.1)]"
                        : hasOutOfSpec
                        ? "bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border-l-4 border-l-transparent shadow-[inset_4px_0_0_rgba(239,68,68,1),0_0_12px_rgba(239,68,68,0.2)]"
                        : isSaved
                        ? "bg-white/80 dark:bg-[#0D1424]/80 hover:bg-zinc-50 dark:hover:bg-white/[0.03] border-l-4 border-l-transparent"
                        : "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/70 dark:hover:bg-white/[0.02] border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Time */}
                    <td className="py-2.5 px-3 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{entry.time_label}</span>
                        {hasOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />}
                      </div>
                    </td>

                    {/* Flowrate */}
                    <td className="py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums text-zinc-800 dark:text-zinc-200 font-semibold">
                      {typeof entry.flowrate_set === 'number' ? entry.flowrate_set.toFixed(1) : "-"}
                    </td>

                    {/* Acid */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                      {entry.acid_dosage_ok ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-2xs">
                          √
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                      )}
                    </td>

                    {/* HE Temp */}
                    <td className={`py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold ${
                      isTempOutOfSpec
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/40"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isTempOutOfSpec && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />}
                        <span>{typeof entry.he_temp_c === 'number' ? `${entry.he_temp_c.toFixed(1)}°` : "-"}</span>
                      </div>
                    </td>

                    {/* Earth */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                      {entry.earth_dosage_ok ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-2xs">
                          √
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                      )}
                    </td>

                    {/* Level */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-bold">
                      {entry.bleacher_level ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] shadow-2xs font-mono font-bold ${
                          entry.bleacher_level === 'H'
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700"
                        }`}>
                          {entry.bleacher_level}
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                      )}
                    </td>

                    {/* Vacuum */}
                    <td className={`py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold ${
                      isVacOutOfSpec
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/40"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isVacOutOfSpec && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />}
                        <span>{typeof entry.vacuum_mmhg === 'number' ? entry.vacuum_mmhg.toFixed(1) : "-"}</span>
                      </div>
                    </td>

                    {/* Filter */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300 font-medium font-mono text-[11px]">
                      {entry.niagara_filter || "-"}
                    </td>

                    {/* Change Time */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono text-zinc-500 text-[11px]">
                      {entry.filter_change_time || "-"}
                    </td>

                    {/* FFA */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold">
                      {typeof entry.ffa_pct === 'number' ? entry.ffa_pct.toFixed(3) : "-"}
                    </td>

                    {/* Red */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold">
                      {typeof entry.colour_r === 'number' ? entry.colour_r.toFixed(1) : "-"}
                    </td>

                    {/* Yellow */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-semibold">
                      {typeof entry.colour_y === 'number' ? entry.colour_y.toFixed(1) : "-"}
                    </td>

                    {/* Remarks */}
                    <td className="py-2.5 px-3 border-r border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-300 truncate max-w-[220px]">
                      {entry.remarks || <span className="text-zinc-400 dark:text-zinc-600 italic">No remarks</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSlot(idx);
                        }}
                        className="btn-tactile table-action-btn px-3 py-1 rounded-lg text-xs font-bold border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.06] hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:border-amber-500 dark:hover:text-white shadow-2xs cursor-pointer inline-flex items-center gap-1.5 group"
                      >
                        {isSaved ? (
                          <Eye className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors" />
                        )}
                        <span>{isSaved ? "Review" : "Log"}</span>
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
