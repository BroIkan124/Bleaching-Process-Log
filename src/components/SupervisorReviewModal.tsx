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

  if (!isOpen) return null;

  // Count out of spec slots
  const outOfSpecSlots = sheet.entries.filter(e => e.out_of_spec && e.out_of_spec.length > 0);
  const completedSlots = sheet.entries.filter(e => e.is_saved).length;

  const handleApprove = () => {
    setError(null);
    onApprove(reviewNote);
    onClose();
  };

  const handleReturn = () => {
    if (!reviewNote.trim()) {
      setError("Please enter review notes/reasons before returning sheet for technician action.");
      return;
    }
    setError(null);
    onReturn(reviewNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Supervisor Quality Review &amp; Approval
              </h3>
              <p className="text-xs text-slate-500">
                Log Sheet Compliance Review RF-FR-003 Rev 03
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-tactile p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 font-medium block">Total Slots Filled</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {completedSlots} / 24
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${
              outOfSpecSlots.length > 0 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}>
              <span className="text-[11px] font-medium block">Out-of-Spec Readings</span>
              <span className="text-lg font-bold font-mono">
                {outOfSpecSlots.length} Slots
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 font-medium block">Reviewer</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block mt-1">
                {currentUser.name}
              </span>
            </div>
          </div>

          {/* Out of spec deviations list */}
          {outOfSpecSlots.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Process Deviations List:</span>
              </div>
              <div className="divide-y divide-rose-200 dark:divide-rose-900/50 max-h-36 overflow-y-auto">
                {outOfSpecSlots.map((s) => (
                  <div key={s.id} className="py-1.5 text-xs flex justify-between gap-2">
                    <span className="font-mono font-bold text-rose-800 dark:text-rose-200">{s.time_label} Hrs:</span>
                    <span className="text-rose-700 dark:text-rose-300 flex-1 truncate">{s.out_of_spec.map(f => f.message).join('; ')}</span>
                    <span className="font-mono text-slate-500 italic truncate max-w-[150px]">{s.remarks || 'No remarks!'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supervisor note textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Supervisor Assessment &amp; Notes
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="Enter quality review remarks or corrective instructions for the technician..."
            />
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="btn-tactile btn-premium-glass px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
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
