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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                {clockState.formattedTime}
              </span>
              <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE REAL-TIME (UTC+8)
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-display flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Active Slot: {clockState.slotLabel} Hrs ({formattedSlotHour} – {formattedNextHour})
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Strict Plant Time-Lock Policy:</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Only the current real-time slot (<strong className="text-amber-600 dark:text-amber-400 font-mono">{clockState.slotLabel} Hrs</strong>) is open for operator data logging. All past &amp; upcoming slots are strictly locked.
              </span>
            </p>
          </div>
        </div>

        {/* Right: Live Telemetry & Shift Synchronization Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-zinc-100/90 dark:bg-black/40 px-3.5 py-2 rounded-xl border border-zinc-200/90 dark:border-white/10 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                Shift {clockState.shiftNumber} Synchronized
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-none mt-0.5">
                Refinery Operations
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-100/90 dark:bg-black/40 px-3.5 py-2 rounded-xl border border-zinc-200/90 dark:border-white/10 shadow-inner">
            <Lock className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                Auto Time-Lock
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">
                Enforced (23 Slots Locked)
              </div>
            </div>
          </div>

          {supervisorUnlockedCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
              <Unlock className="w-4 h-4 text-emerald-500" />
              <span>{supervisorUnlockedCount} Supervisor Override{supervisorUnlockedCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeTimelineBanner;
