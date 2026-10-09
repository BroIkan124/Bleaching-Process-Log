"use client";

import React from "react";
import { LogEntry } from "@/types";
import { SHIFTS } from "@/lib/constants";
import { AlertTriangle, Clock, Lock, Unlock, Check } from "lucide-react";
import { evaluateSlotAccess } from "@/lib/realtimeTimeline";

interface SlotRailProps {
  entries: LogEntry[];
  selectedSlotIndex: number;
  onSelectSlot: (index: number) => void;
  activeCurrentHourIndex: number;
  supervisorUnlockedSlots?: number[];
  userRole?: string;
}

export const SlotRail: React.FC<SlotRailProps> = ({
  entries,
  selectedSlotIndex,
  onSelectSlot,
  activeCurrentHourIndex,
  supervisorUnlockedSlots = [],
  userRole,
}) => {
  return (
    <div className="rounded-xl p-3.5 sm:p-4 mb-4 border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0B101D]/90 shadow-2xs">
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-zinc-200/60 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            24-Hour Continuous Timeline Rail
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Current Active Slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In-Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Out of Spec</span>
          </div>
        </div>
      </div>

      {/* Shifts Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SHIFTS.map((shift, sIdx) => {
          const shiftBorderClass = sIdx === 0 
            ? "border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.04]"
            : sIdx === 1 
              ? "border-sky-500/30 bg-sky-500/[0.03] dark:bg-sky-500/[0.04]"
              : "border-purple-500/30 bg-purple-500/[0.03] dark:bg-purple-500/[0.04]";

          return (
            <div 
              key={shift.id} 
              className={`p-3 rounded-xl border ${shiftBorderClass} shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mb-2.5 px-1">
                <span className="tracking-tight">{shift.name}</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-300 text-xs bg-white/80 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-bold">{shift.hours}</span>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {shift.slots.map((slotIdx) => {
                  const entry = entries[slotIdx];
                  if (!entry) return null;

                  const isSelected = selectedSlotIndex === slotIdx;
                  const isCurrent = activeCurrentHourIndex === slotIdx;
                  const isSupervisorOverride = supervisorUnlockedSlots.includes(slotIdx);
                  const access = evaluateSlotAccess(slotIdx, activeCurrentHourIndex, isSupervisorOverride, userRole);

                  const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
                  const isDone = entry.is_saved;

                  const isAccessible = isCurrent || isSupervisorOverride;
                  let stateClass = "bg-white dark:bg-[#0D1424] border-zinc-200/90 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300";

                  if (hasOutOfSpec) {
                    stateClass = "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold shadow-[0_0_16px_rgba(239,68,68,0.25)]";
                  } else if (isDone) {
                    stateClass = "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-[0_0_14px_rgba(16,185,129,0.2)]";
                  } else if (access.status === 'future_locked') {
                    stateClass = "bg-zinc-100/50 dark:bg-zinc-900/30 border-dashed border-zinc-300/70 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-50";
                  } else if (access.status === 'past_locked' && !isDone) {
                    stateClass = "bg-zinc-100/80 dark:bg-zinc-900/70 border-zinc-300 dark:border-zinc-800 text-zinc-400 opacity-60";
                  }

                  if (isCurrent) {
                    stateClass = "ring-2 ring-amber-500 shadow-[0_4px_24px_rgba(245,158,11,0.5),0_0_12px_rgba(245,158,11,0.3)] z-10 font-extrabold bg-amber-500/15 dark:bg-amber-500/25 border-amber-500 text-zinc-900 dark:text-amber-300 cursor-pointer animate-pulse-subtle";
                  } else if (isSupervisorOverride) {
                    stateClass = "ring-2 ring-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.4)] z-10 font-bold bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 cursor-pointer";
                  } else {
                    stateClass += " cursor-not-allowed hover:border-zinc-400/50";
                  }

                  if (isSelected && !isCurrent) {
                    stateClass += " ring-2 ring-[#2F81F7] border-[#2F81F7] z-10";
                  }

                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      disabled={!isAccessible}
                      onClick={() => onSelectSlot(slotIdx)}
                      className={`slot-tile-btn h-12 rounded-lg flex flex-col items-center justify-center p-0.5 border text-center select-none relative transition-all ${stateClass}`}
                      title={isAccessible 
                        ? `Slot ${entry.time_label} Hrs - ${isSupervisorOverride ? 'SUPERVISOR OVERRIDE' : 'ACTIVE REAL-TIME LOGGING'}`
                        : `Slot ${entry.time_label} Hrs - LOCKED (Only real-time active hour can be logged)`}
                    >
                      <span className="font-mono text-xs leading-tight font-extrabold flex items-center gap-0.5">
                        {entry.time_label}
                        {!isAccessible && <Lock className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />}
                      </span>

                      <div className="mt-0.5 h-3 flex items-center justify-center gap-0.5">
                        {hasOutOfSpec ? (
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                        ) : isDone ? (
                          <Check className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                        ) : access.status === 'past_locked' ? (
                          <Lock className="w-2.5 h-2.5 text-zinc-400" />
                        ) : access.status === 'future_locked' ? (
                          <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        ) : null}
                      </div>

                      {/* Current Live Beacon */}
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-950" />
                      )}

                      {/* Supervisor Override Tag */}
                      {isSupervisorOverride && (
                        <span className="absolute -bottom-1 -left-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                          <Unlock className="w-2.5 h-2.5" />
                        </span>
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
