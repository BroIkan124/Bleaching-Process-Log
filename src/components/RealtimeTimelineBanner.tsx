"use client";

import React from "react";
import { Clock, ShieldCheck, Unlock, Activity, Lock } from "lucide-react";
import { RealtimeClockState, getHourForSlotIndex } from "@/lib/realtimeTimeline";

interface RealtimeTimelineBannerProps {
  clockState: RealtimeClockState;
  supervisorUnlockedCount?: number;
  userRole?: string;
  isSupervisor?: boolean;
}

export const RealtimeTimelineBanner: React.FC<RealtimeTimelineBannerProps> = ({
  clockState,
  supervisorUnlockedCount = 0,
}) => {
  const currentSlotHour = getHourForSlotIndex(clockState.slotIndex);
  const formattedSlotHour = `${String(currentSlotHour).padStart(2, "0")}:00`;
  const nextHour = (currentSlotHour + 1) % 24;
  const formattedNextHour = `${String(nextHour).padStart(2, "0")}:00`;

  return (
    <div className="glass-panel p-4 rounded-2xl mb-4 border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)] transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Live Real-Time Clock & Active Slot Beacon */}
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
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white tabular-nums">
                {clockState.formattedTime}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                Active Slot: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{clockState.slotLabel} Hrs</strong> ({formattedSlotHour} – {formattedNextHour})
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Current real-time slot (<strong className="text-amber-600 dark:text-amber-400 font-medium">{clockState.slotLabel} Hrs</strong>) is open for operator logging.</span>
            </p>
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Shift {clockState.shiftNumber} Refinery Operations</span>
          </div>

          {supervisorUnlockedCount > 0 && (
            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <Unlock className="w-4 h-4" />
              <span>{supervisorUnlockedCount} Supervisor Override{supervisorUnlockedCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeTimelineBanner;
