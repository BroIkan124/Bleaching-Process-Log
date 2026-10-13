"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogSheet, UserProfile } from "@/types";
import { 
  UserCheck, 
  X, 
  Sparkles, 
  Clock, 
  RotateCcw, 
  ShieldCheck, 
  UserX, 
  CheckCircle2,
  Users,
  Info
} from "lucide-react";
import { getShiftDutyTechnician, ShiftDutyTechnicianInfo } from "@/lib/workflowPipeline";

interface ShiftRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftNum: 1 | 2 | 3;
  sheet: LogSheet;
  allUsers: UserProfile[];
  onSaveRoster: (updates: Partial<LogSheet>) => void;
}

export const ShiftRosterModal: React.FC<ShiftRosterModalProps> = ({
  isOpen,
  onClose,
  shiftNum,
  sheet,
  allUsers,
  onSaveRoster,
}) => {
  const [assignmentMode, setAssignmentMode] = useState<"registered" | "custom" | "auto">("registered");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const currentInfo: ShiftDutyTechnicianInfo = getShiftDutyTechnician(sheet, shiftNum);

  const shiftLabel = 
    shiftNum === 1 
      ? "Shift 1 (Morning · 0800 - 1500)" 
      : shiftNum === 2 
      ? "Shift 2 (Afternoon · 1600 - 2300)" 
      : "Shift 3 (Night · 2400 - 0700)";

  // Filter and prioritize technicians
  const technicians = allUsers.filter(u => u.role === "technician");
  const otherUsers = allUsers.filter(u => u.role !== "technician");

  // Sync state whenever modal opens or shift changes
  useEffect(() => {
    if (!isOpen) return;

    const shiftDefault = technicians.find(t => t.shift === shiftNum);
    const defaultUserId = shiftDefault ? shiftDefault.id : technicians[0]?.id || "";

    if (currentInfo.source === "manual") {
      const matchedUser = allUsers.find(
        u => u.id === currentInfo.id || u.name.toLowerCase() === (currentInfo.name || "").toLowerCase()
      );
      if (matchedUser) {
        setAssignmentMode("registered");
        setSelectedUserId(matchedUser.id);
        setCustomName("");
      } else {
        setAssignmentMode("custom");
        setCustomName(currentInfo.name || "");
        setSelectedUserId(defaultUserId);
      }
    } else {
      // Auto-detect or pending check-in
      setAssignmentMode("auto");
      const matchedUser = allUsers.find(
        u => u.name.toLowerCase() === (currentInfo.name || "").toLowerCase()
      );
      setSelectedUserId(matchedUser ? matchedUser.id : defaultUserId);
      setCustomName("");
    }
  }, [isOpen, shiftNum, sheet]);

  if (!isOpen || !mounted) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  };

  const handleApply = () => {
    const fieldId = shiftNum === 1 ? "tech_s1" : shiftNum === 2 ? "tech_s2" : "tech_s3";
    const fieldName = shiftNum === 1 ? "tech_s1_name" : shiftNum === 2 ? "tech_s2_name" : "tech_s3_name";
    const fieldManual = shiftNum === 1 ? "tech_s1_manual" : shiftNum === 2 ? "tech_s2_manual" : "tech_s3_manual";

    if (assignmentMode === "auto") {
      // Clear manual override flag and explicit names so dynamic detection takes over
      onSaveRoster({
        [fieldId]: null,
        [fieldName]: null,
        [fieldManual]: false,
      });
      handleSmoothClose();
      return;
    }

    if (assignmentMode === "registered") {
      const user = allUsers.find(u => u.id === selectedUserId);
      if (user) {
        onSaveRoster({
          [fieldId]: user.id,
          [fieldName]: user.name,
          [fieldManual]: true,
        });
      }
      handleSmoothClose();
      return;
    }

    if (assignmentMode === "custom") {
      const trimmed = customName.trim();
      if (trimmed) {
        onSaveRoster({
          [fieldId]: `relief-${Date.now()}`,
          [fieldName]: trimmed,
          [fieldManual]: true,
        });
      }
      handleSmoothClose();
      return;
    }
  };

  const handleClearToPending = () => {
    const fieldId = shiftNum === 1 ? "tech_s1" : shiftNum === 2 ? "tech_s2" : "tech_s3";
    const fieldName = shiftNum === 1 ? "tech_s1_name" : shiftNum === 2 ? "tech_s2_name" : "tech_s3_name";
    const fieldManual = shiftNum === 1 ? "tech_s1_manual" : shiftNum === 2 ? "tech_s2_manual" : "tech_s3_manual";

    onSaveRoster({
      [fieldId]: null,
      [fieldName]: null,
      [fieldManual]: false,
    });
    handleSmoothClose();
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-200 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                Shift Duty Technician Roster
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {shiftLabel}
              </p>
            </div>
          </div>
          <button 
            onClick={handleSmoothClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Current Live State Card */}
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.03] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-display">
                Current Duty Status
              </span>
              {currentInfo.source === "auto" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  <Sparkles className="w-3 h-3" /> Auto-Detected
                </span>
              )}
              {currentInfo.source === "manual" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                  <ShieldCheck className="w-3 h-3" /> Assigned Roster
                </span>
              )}
              {currentInfo.source === "pending" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-mono">
                  <Clock className="w-3 h-3" /> Awaiting Check-in
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  {currentInfo.name || "No Technician Checked-In"}
                </p>
                <p className="text-xs text-zinc-500">
                  {currentInfo.source === "auto" 
                    ? "Recorded from active hourly logs in this shift" 
                    : currentInfo.source === "manual" 
                    ? "Assigned via shift roster management" 
                    : "Shift has not started yet or no entries logged"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {currentInfo.loggedSlotsCount} / 8 Hrs
                </span>
                <p className="text-[10px] text-zinc-400">Logged Slots</p>
              </div>
            </div>
          </div>

          {/* Roster Assignment Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-display flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Assignment Method</span>
            </label>

            {/* Option 1: Registered Plant Staff */}
            <div 
              onClick={() => setAssignmentMode("registered")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                assignmentMode === "registered"
                  ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === "registered"}
                  onChange={() => setAssignmentMode("registered")}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Assign Registered Staff / Technician
                </span>
              </div>
              
              {assignmentMode === "registered" && (
                <div className="ml-6 space-y-2 pt-1 animate-fade-in">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  >
                    <optgroup label="Shift Technicians">
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Shift {t.shift} · {t.department})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Supervisors & QC Chemists">
                      {otherUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.toUpperCase()} · {u.department})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    Fixes the technician name on the shift card and official compliance report.
                  </p>
                </div>
              )}
            </div>

            {/* Option 2: Custom Name / Relief Operator */}
            <div 
              onClick={() => setAssignmentMode("custom")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                assignmentMode === "custom"
                  ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === "custom"}
                  onChange={() => setAssignmentMode("custom")}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Custom Relief Operator / Contractor
                </span>
              </div>

              {assignmentMode === "custom" && (
                <div className="ml-6 space-y-2 pt-1 animate-fade-in">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Mohd Faiz (Relief Tech) / Contract Reliever"
                    className="w-full text-xs font-medium rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Useful for temporary coverage, relief operators, or non-registered contractors.
                  </p>
                </div>
              )}
            </div>

            {/* Option 3: Smart Auto-Detection */}
            <div 
              onClick={() => setAssignmentMode("auto")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                assignmentMode === "auto"
                  ? "border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10 ring-1 ring-blue-500/30"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === "auto"}
                  onChange={() => setAssignmentMode("auto")}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Auto-Detect from Active Entry Logging</span>
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    The duty technician is automatically assigned to whoever logs the slots in this shift. If no slots are logged, it shows "Awaiting Check-in".
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <span>
              <strong>Smart Hybrid System:</strong> Shifts without any logged slots and without manual roster assignments will display as <em>Awaiting Check-in</em> to prevent premature or inaccurate audit trails.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={handleClearToPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Mark as Unassigned</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSmoothClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Roster</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

