"use client";

import React from "react";
import { LogEntry } from "@/types";
import { SHIFTS } from "@/lib/constants";
import { AlertTriangle, Clock } from "lucide-react";

interface SlotRailProps {
  entries: LogEntry[];
  selectedSlotIndex: number;
  onSelectSlot: (index: number) => void;
  activeCurrentHourIndex: number;
}

export const SlotRail: React.FC<SlotRailProps> = ({
  entries,
  selectedSlotIndex,
  onSelectSlot,
  activeCurrentHourIndex,
}) => {
  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl mb-5 shadow-sm">
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-zinc-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 block leading-tight">
              24-Hour Continuous Plant Timeline Rail
            </span>
            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline mt-0.5 block leading-none">
              Form RF-FR-003 · Click any hourly slot to log or review parameters
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span>In-Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
            <span>Out of Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Current Hour</span>
          </div>
        </div>
      </div>

      {/* Shifts Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SHIFTS.map((shift, sIdx) => {
          const shiftBorderClass = sIdx === 0 
            ? "border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.04]"
            : sIdx === 1 
              ? "border-sky-500/20 bg-sky-500/[0.03] dark:bg-sky-500/[0.04]"
              : "border-purple-500/20 bg-purple-500/[0.03] dark:bg-purple-500/[0.04]";

          return (
            <div 
              key={shift.id} 
              className={`p-3 rounded-xl border ${shiftBorderClass} transition-all`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mb-2.5 px-1">
                <span className="tracking-tight">{shift.name}</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-300 text-xs bg-white/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold">{shift.hours}</span>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {shift.slots.map((slotIdx) => {
                  const entry = entries[slotIdx];
                  if (!entry) return null;

                  const isSelected = selectedSlotIndex === slotIdx;
                  const isCurrent = activeCurrentHourIndex === slotIdx;
                  const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
                  const isDone = entry.is_saved;

                  let stateClass = "bg-white dark:bg-[#0D1424] border-zinc-200/90 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20";

                  if (hasOutOfSpec) {
                    stateClass = "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)]";
                  } else if (isDone) {
                    stateClass = "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                  }

                  if (isSelected) {
                    stateClass = "ring-2 ring-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.35)] z-10 font-extrabold bg-amber-500/15 dark:bg-amber-500/25 border-amber-500 text-zinc-900 dark:text-amber-300";
                  }

                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => onSelectSlot(slotIdx)}
                      className={`slot-tile-btn h-11 rounded-lg flex flex-col items-center justify-center p-0.5 border text-center select-none relative cursor-pointer ${stateClass}`}
                      title={`Slot ${entry.time_label} (${shift.name}) - ${hasOutOfSpec ? 'Out of Spec Alert' : isDone ? 'Saved' : 'Not Logged'}`}
                    >
                      <span className="font-mono text-xs leading-tight font-extrabold">
                        {entry.time_label}
                      </span>

                      <div className="mt-0.5 h-3 flex items-center justify-center">
                        {hasOutOfSpec ? (
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                        ) : isDone ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" />
                        ) : null}
                      </div>

                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
