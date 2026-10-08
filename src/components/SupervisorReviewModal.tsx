"use client";

import React, { useState } from "react";
import { LogSheet, UserProfile } from "@/types";
import { 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  Lock, 
  X, 
  CheckCircle2, 
  FileText,
  Calendar,
  UserCheck
} from "lucide-react";

interface SupervisorReviewModalProps {
  sheet: LogSheet;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (reviewNote: string) => void;
  onReturn: (reviewNote: string) => void;
}

export const SupervisorReviewModal: React.FC<SupervisorReviewModalProps> = ({
  sheet,
  currentUser,
  isOpen,
  onClose,
  onApprove,
  onReturn,
}) => {
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Count out of spec slots
  const outOfSpecSlots = sheet.entries.filter(e => e.out_of_spec && e.out_of_spec.length > 0);
  const completedSlots = sheet.entries.filter(e => e.is_saved).length;

  const handleApprove = () => {
    setError(null);
    onApprove(reviewNote);
    handleSmoothClose();
  };

  const handleReturn = () => {
    if (!reviewNote.trim()) {
      setError("Please enter review notes/reasons before returning sheet for technician action.");
      return;
    }
    setError(null);
    onReturn(reviewNote);
    handleSmoothClose();
  };

  return (
    <div 
      className={`modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200 ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`modal-card-animate w-full max-w-2xl bg-white dark:bg-[#0A0F1C] rounded-3xl border border-zinc-200/90 dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh] [transform-style:preserve-3d] ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Header with 3D Specular Highlight */}
        <div className="px-6 py-4 border-b border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Supervisor Quality Review &amp; Approval
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Log Sheet Compliance Review RF-FR-003 Rev 03
              </p>
            </div>
          </div>
          <button 
            onClick={handleSmoothClose} 
            className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group transition-all"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="telemetry-card p-3 rounded-xl">
              <span className="text-[11px] text-zinc-500 font-semibold block font-display">Total Slots Filled</span>
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
                {completedSlots} / 24
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${
              outOfSpecSlots.length > 0 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
            }`}>
              <span className="text-[11px] font-semibold block font-display">Out-of-Spec Readings</span>
              <span className="text-lg font-bold font-mono mt-0.5 block tabular-nums">
                {outOfSpecSlots.length} Slots
              </span>
            </div>

            <div className="telemetry-card p-3 rounded-xl">
              <span className="text-[11px] text-zinc-500 font-semibold block font-display">Reviewer</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-1 font-mono">
                {currentUser.name}
              </span>
            </div>
          </div>

          {/* Out of spec deviations list */}
          {outOfSpecSlots.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-xs font-display">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Process Deviations List:</span>
              </div>
              <div className="divide-y divide-rose-500/20 max-h-36 overflow-y-auto font-mono text-xs">
                {outOfSpecSlots.map((s) => (
                  <div key={s.id} className="py-2 text-xs flex justify-between items-center gap-2">
                    <span className="font-bold text-rose-800 dark:text-rose-200 shrink-0">{s.time_label} Hrs:</span>
                    <span className="text-rose-700 dark:text-rose-300 flex-1 truncate">{s.out_of_spec.map(f => f.message).join('; ')}</span>
                    <span className="text-zinc-500 italic truncate max-w-[150px]">{s.remarks || 'No remarks!'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supervisor note textarea */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 font-display">
              Supervisor Assessment &amp; Notes
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none transition-all"
              placeholder="Enter quality review remarks or corrective instructions for the technician..."
            />
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 flex items-center justify-between gap-3">
          <button
            onClick={handleSmoothClose}
            className="btn-tactile px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReturn}
              className="btn-tactile px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer group"
            >
              <RotateCcw className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-45" />
              <span>Return with Comment</span>
            </button>

            <button
              onClick={handleApprove}
              className="btn-premium-emerald px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer group"
            >
              <Lock className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Approve &amp; Lock Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
