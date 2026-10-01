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
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm overflow-hidden mb-8">
      {/* Table Header Bar */}
      <div className="px-5 py-3.5 bg-zinc-50/70 dark:bg-[#141517] border-b border-zinc-200/70 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Borang Log Proses Pelunturan (RF-FR-003 Rev 03)
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              24 Slot Jam Lengkap · Klik mana-mana baris untuk mengisi entri pantas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>In-Spec</span>
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-2" />
          <span>Luar Had</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* Unified Clean Header */}
            <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-20">Jam (Hrs)</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800">Flow (MT/HR)</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Dos Asid</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400">
                Suhu HE (°C)
              </th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Dos BE</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Paras</th>
              <th className="py-3 px-3 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                Vakum (mmHg)
              </th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Niagara</th>
              <th className="py-3 px-2 text-center border-r border-zinc-200 dark:border-zinc-800">Tukar</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">FFA (%)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Red (R)</th>
              <th className="py-3 px-2 text-right border-r border-zinc-200 dark:border-zinc-800">Yel (Y)</th>
              <th className="py-3 px-3 border-r border-zinc-200 dark:border-zinc-800 min-w-[200px]">Catatan / Remarks</th>
              <th className="py-3 px-2 text-center w-24">Tindakan</th>
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
                    <tr className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-y border-zinc-200 dark:border-zinc-800 select-none">
                      <td colSpan={14} className="py-1.5 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-amber-600 dark:text-amber-400">SYIF 1 (0800 – 1500 HRS)</span> · Juruteknik Bertugas: <strong className="text-zinc-900 dark:text-white">Ahmad Razif</strong>
                      </td>
                    </tr>
                  )}
                  {isShift2Start && (
                    <tr className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-y border-zinc-200 dark:border-zinc-800 select-none">
                      <td colSpan={14} className="py-1.5 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-zinc-500">SYIF 2 (1600 – 2300 HRS)</span> · Juruteknik Bertugas: <strong className="text-zinc-900 dark:text-white">Mohd Danial</strong>
                      </td>
                    </tr>
                  )}
                  {isShift3Start && (
                    <tr className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-y border-zinc-200 dark:border-zinc-800 select-none">
                      <td colSpan={14} className="py-1.5 px-4 font-bold text-[11px] tracking-wide">
                        <span className="text-zinc-500">SYIF 3 (2400 – 0700 HRS)</span> · Juruteknik Bertugas: <strong className="text-zinc-900 dark:text-white">K. Subramaniam</strong>
                      </td>
                    </tr>
                  )}

                  {/* Main Hourly Slot Row */}
                  <tr
                    onClick={() => onSelectSlot(idx)}
                    className={`cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-amber-500/15 dark:bg-amber-500/20 font-medium"
                        : hasOutOfSpec
                        ? "bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40"
                        : isSaved
                        ? "bg-white dark:bg-[#18181B] hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        : "bg-zinc-50/40 dark:bg-zinc-900/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Time */}
                    <td className="py-2.5 px-3 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{entry.time_label}</span>
                        {hasOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      </div>
                    </td>

                    {/* Flowrate */}
                    <td className="py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums text-zinc-800 dark:text-zinc-200 font-semibold">
                      {typeof entry.flowrate_set === 'number' ? entry.flowrate_set.toFixed(1) : "-"}
                    </td>

                    {/* Acid */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                      {entry.acid_dosage_ok ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                          √
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                      )}
                    </td>

                    {/* HE Temp */}
                    <td className={`py-2.5 px-3 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums font-bold ${
                      isTempOutOfSpec
                        ? "bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      {typeof entry.he_temp_c === 'number' ? `${entry.he_temp_c.toFixed(1)}°` : "-"}
                    </td>

                    {/* Earth */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70">
                      {entry.earth_dosage_ok ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                          √
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">-</span>
                      )}
                    </td>

                    {/* Level */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-bold">
                      {entry.bleacher_level ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          entry.bleacher_level === 'H'
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
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
                        ? "bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      {typeof entry.vacuum_mmhg === 'number' ? entry.vacuum_mmhg.toFixed(1) : "-"}
                    </td>

                    {/* Filter */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300 font-medium">
                      {entry.niagara_filter || "-"}
                    </td>

                    {/* Change Time */}
                    <td className="py-2.5 px-2 text-center border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono text-zinc-500">
                      {entry.filter_change_time || "-"}
                    </td>

                    {/* FFA */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums">
                      {typeof entry.ffa_pct === 'number' ? entry.ffa_pct.toFixed(3) : "-"}
                    </td>

                    {/* Red */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums">
                      {typeof entry.colour_r === 'number' ? entry.colour_r.toFixed(1) : "-"}
                    </td>

                    {/* Yellow */}
                    <td className="py-2.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800/70 font-mono tabular-nums">
                      {typeof entry.colour_y === 'number' ? entry.colour_y.toFixed(1) : "-"}
                    </td>

                    {/* Remarks */}
                    <td className="py-2.5 px-3 border-r border-zinc-200/70 dark:border-zinc-800/70 text-zinc-600 dark:text-zinc-300 truncate max-w-[220px]">
                      {entry.remarks || <span className="text-zinc-400 dark:text-zinc-600 italic">Tiada catatan khas</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSlot(idx);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors shadow-2xs"
                      >
                        {isSaved ? "Semak" : "Isi"}
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
