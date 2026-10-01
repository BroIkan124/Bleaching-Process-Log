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
    <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm mb-5">
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Garis Masa Operasi 24-Jam (Timeline Rail)
          </span>
          <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
            · Klik mana-mana slot jam untuk mengisi atau melihat log
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In-Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Luar Had</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full ring-2 ring-amber-500 bg-amber-400" />
            <span className="text-amber-600 dark:text-amber-400 font-bold">Jam Semasa</span>
          </div>
        </div>
      </div>

      {/* Shifts Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SHIFTS.map((shift) => (
          <div 
            key={shift.id} 
            className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-2 px-1">
              <span>{shift.name}</span>
              <span className="font-mono text-zinc-500">{shift.hours}</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {shift.slots.map((slotIdx) => {
                const entry = entries[slotIdx];
                if (!entry) return null;

                const isSelected = selectedSlotIndex === slotIdx;
                const isCurrent = activeCurrentHourIndex === slotIdx;
                const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
                const isDone = entry.is_saved;

                let stateClass = "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400";

                if (hasOutOfSpec) {
                  stateClass = "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold";
                } else if (isDone) {
                  stateClass = "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium";
                }

                if (isSelected) {
                  stateClass += " ring-2 ring-amber-500 shadow-sm scale-105 z-10 font-bold text-zinc-900 dark:text-white";
                }

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => onSelectSlot(slotIdx)}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center p-0.5 border transition-all text-center select-none relative ${stateClass}`}
                    title={`Slot ${entry.time_label} (${shift.name}) - ${hasOutOfSpec ? 'Amaran Luar Had' : isDone ? 'Disimpan' : 'Belum Diisi'}`}
                  >
                    <span className="font-mono text-[11px] leading-tight font-bold">
                      {entry.time_label}
                    </span>

                    <div className="mt-0.5 h-3 flex items-center justify-center">
                      {hasOutOfSpec ? (
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                      ) : isDone ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ) : null}
                    </div>

                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
