"use client";

import React from "react";
import { Clock, Unlock } from "lucide-react";
import { RealtimeClockState, getHourForSlotIndex } from "@/lib/realtimeTimeline";

interface RealtimeTimelineBannerProps {
  clockState: RealtimeClockState;
  simulatedHour: number | null;
  onSetSimulatedHour: (hour: number | null) => void;
  supervisorUnlockedCount?: number;
  userRole?: string;
  isSupervisor?: boolean;
}

export const RealtimeTimelineBanner: React.FC<RealtimeTimelineBannerProps> = ({
  clockState,
  simulatedHour,
  onSetSimulatedHour,
  supervisorUnlockedCount = 0,
  userRole,
  isSupervisor = false,
}) => {
  const currentSlotHour = getHourForSlotIndex(clockState.slotIndex);
  const formattedSlotHour = `${String(currentSlotHour).padStart(2, "0")}:00`;

  return (
    <div className="glass-panel p-4 rounded-2xl mb-4 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)] transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Live Clock & Active Slot Beacon */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="relative flex items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(245,158,11,0.5)] border border-amber-400/40">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-zinc-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                {clockState.formattedTime}
              </span>
              <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                {clockState.isSimulated ? "TEST SIMULATION" : "LIVE REAL-TIME"}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-display">
                Slot {clockState.slotLabel} ({formattedSlotHour}) ACTIVE
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Operational Access Policy:</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Only slot <strong className="text-amber-600 dark:text-amber-400 font-mono">{clockState.slotLabel}</strong> is open for data entry. Past slots are locked, future slots are pending.
              </span>
            </p>
          </div>
        </div>

        {/* Right: Quick Simulation Tester */}
        <div className="flex items-center gap-2 flex-wrap bg-zinc-100/90 dark:bg-black/40 p-2.5 rounded-xl border border-zinc-200/90 dark:border-white/10 shadow-inner">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1 font-display uppercase tracking-wider">
            Clock Simulation:
          </span>

          <button
            type="button"
            onClick={() => onSetSimulatedHour(null)}
            className={`btn-tactile px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              simulatedHour === null
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-white/5"
            }`}
          >
            🔴 Live Clock
          </button>

          <button
            type="button"
            onClick={() => onSetSimulatedHour(9)}
            className={`btn-tactile px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              simulatedHour === 9
                ? "bg-[#2F81F7] text-white shadow-xs"
                : "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-white/5"
            }`}
            title="Simulate 09:00 (Slot 0800 locked, Slot 0900 active)"
          >
            09:00 (Slot 0900)
          </button>

          <button
            type="button"
            onClick={() => onSetSimulatedHour(8)}
            className={`btn-tactile px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              simulatedHour === 8
                ? "bg-[#2F81F7] text-white shadow-xs"
                : "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-white/5"
            }`}
            title="Simulate 08:00 (Slot 0800 active, 0900+ locked)"
          >
            08:00 (Slot 0800)
          </button>

          <button
            type="button"
            onClick={() => onSetSimulatedHour(14)}
            className={`btn-tactile px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              simulatedHour === 14
                ? "bg-[#2F81F7] text-white shadow-xs"
                : "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-white/5"
            }`}
            title="Simulate 14:00 (Slot 1400 active, earlier slots locked)"
          >
            14:00 (Slot 1400)
          </button>

          {supervisorUnlockedCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Unlock className="w-3.5 h-3.5" /> {supervisorUnlockedCount} Overrides Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
