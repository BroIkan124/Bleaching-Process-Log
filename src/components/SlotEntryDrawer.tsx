"use client";

import React, { useState, useEffect } from "react";
import { LogEntry, UserProfile, OutOfSpecFlag } from "@/types";
import { PROCESS_SPECS, NIAGARA_FILTERS, BLEACHER_LEVELS } from "@/lib/constants";
import { validateReadingSpecs } from "@/lib/utils";
import { 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Delete,
  Sparkles,
  Info,
  Layers,
  Thermometer,
  Gauge
} from "lucide-react";

interface SlotEntryDrawerProps {
  entry: LogEntry;
  canEdit: boolean;
  currentUser: UserProfile;
  onSave: (updated: LogEntry) => void;
  onClose: () => void;
  onNavigateSlot: (direction: -1 | 1) => void;
  isFirstSlot: boolean;
  isLastSlot: boolean;
}

export const SlotEntryDrawer: React.FC<SlotEntryDrawerProps> = ({
  entry,
  canEdit,
  currentUser,
  onSave,
  onClose,
  onNavigateSlot,
  isFirstSlot,
  isLastSlot,
}) => {
  // Local form state
  const [formData, setFormData] = useState<LogEntry>({ ...entry });
  const [outOfSpecFlags, setOutOfSpecFlags] = useState<OutOfSpecFlag[]>(entry.out_of_spec || []);
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [activeNumpadField, setActiveNumpadField] = useState<keyof LogEntry | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  };

  useEffect(() => {
    setFormData({ ...entry });
    setOutOfSpecFlags(entry.out_of_spec || []);
    setRemarksError(null);
  }, [entry]);

  // Real-time validation trigger
  const handleFieldChange = (field: keyof LogEntry, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Validate specs immediately
    const flags = validateReadingSpecs(updated);
    setOutOfSpecFlags(flags);

    if (flags.length > 0 && (!updated.remarks || updated.remarks.trim() === '')) {
      setRemarksError("Remarks are mandatory when parameters deviate from target spec.");
    } else {
      setRemarksError(null);
    }
  };

  // Virtual Keypad press handler
  const handleKeypadPress = (val: string) => {
    if (!activeNumpadField) return;
    const currentVal = formData[activeNumpadField] !== null && formData[activeNumpadField] !== undefined
      ? String(formData[activeNumpadField])
      : '';

    let newVal = currentVal;
    if (val === 'CLEAR') {
      newVal = '';
    } else if (val === 'BACKSPACE') {
      newVal = currentVal.slice(0, -1);
    } else if (val === '.') {
      if (!currentVal.includes('.')) {
        newVal = currentVal === '' ? '0.' : currentVal + '.';
      }
    } else {
      newVal = currentVal + val;
    }

    const numValue = newVal === '' ? null : parseFloat(newVal);
    handleFieldChange(activeNumpadField, numValue);
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const flags = validateReadingSpecs(formData);
    if (flags.length > 0 && (!formData.remarks || formData.remarks.trim() === '')) {
      setRemarksError("Mandatory Remarks: State reason for out-of-spec deviation and corrective action taken.");
      return;
    }

    const updatedToSave: LogEntry = {
      ...formData,
      out_of_spec: flags,
      entered_by: currentUser.id,
      entered_by_name: currentUser.name,
      entered_at: new Date().toISOString(),
      is_saved: true,
    };

    onSave(updatedToSave);
  };

  const hasOutOfSpec = outOfSpecFlags.length > 0;
  const isHeTempOutOfSpec = outOfSpecFlags.some(f => f.field === 'he_temp_c');
  const isVacOutOfSpec = outOfSpecFlags.some(f => f.field === 'vacuum_mmhg');

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-md transition-opacity duration-240 ${
        isMounted && !isClosing ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`w-full max-w-2xl h-full bg-white dark:bg-[#0A0F1C] shadow-[-20px_0_60px_rgba(0,0,0,0.35)] dark:shadow-[-28px_0_100px_rgba(0,0,0,0.85)] flex flex-col border-l border-zinc-200/90 dark:border-white/10 overflow-hidden transform transition-transform duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] [transform-style:preserve-3d] ${
          isMounted && !isClosing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Drawer Navigation with 3D Depth */}
        <div className="px-6 py-4 border-b border-zinc-200/90 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg [transform-style:preserve-3d] ${
              hasOutOfSpec 
                ? 'bg-gradient-to-br from-rose-500/20 to-rose-600/10 text-rose-700 dark:text-rose-300 border border-rose-500/40 shadow-[0_4px_16px_rgba(239,68,68,0.25)]'
                : formData.is_saved
                  ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-[0_4px_16px_rgba(16,185,129,0.25)]'
                  : 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-[0_4px_16px_rgba(245,158,11,0.25)]'
            }`}>
              {formData.time_label}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                  Slot Hourly Entry: {formData.time_label} Hrs
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-zinc-200/80 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5">
                  Shift {formData.shift}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Timestamp: {new Date(formData.actual_timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigateSlot(-1)}
              disabled={isFirstSlot}
              className="btn-tactile p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200/80 dark:border-white/10 disabled:opacity-30 cursor-pointer group transition-all"
              title="Previous Slot"
            >
              <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={() => onNavigateSlot(1)}
              disabled={isLastSlot}
              className="btn-tactile p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200/80 dark:border-white/10 disabled:opacity-30 cursor-pointer group transition-all"
              title="Next Slot"
            >
              <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            <div className="h-6 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />
            <button
              onClick={handleSmoothClose}
              className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group transition-all"
              title="Close Panel"
            >
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Out of spec alert banner */}
        {hasOutOfSpec && (
          <div className="px-6 py-3 bg-rose-500/10 border-b border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 backdrop-blur-sm">
            <div className="relative flex h-4 w-4 shrink-0 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <AlertTriangle className="relative inline-flex w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            </div>
            <div>
              <span className="font-bold font-display">Process Out-of-Spec Alert:</span>
              <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                {outOfSpecFlags.map((flag, idx) => (
                  <li key={idx} className="font-medium">{flag.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Form Body - Fast Touch Optimized */}
        <form onSubmit={handleSaveClick} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Group 1: Flowrate & Dosages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Flowrate MT/HR Set */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Flowrate (MT/HR Set)
              </label>
              <div 
                onClick={() => setActiveNumpadField('flowrate_set')}
                className={`touch-target flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  activeNumpadField === 'flowrate_set'
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.flowrate_set ?? ''}
                  onChange={(e) => handleFieldChange('flowrate_set', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="e.g. 45.0"
                />
                <span className="text-xs text-zinc-400 font-mono">MT/HR</span>
              </div>
            </div>

            {/* Acid Dosage OK */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Acid Dosage
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleFieldChange('acid_dosage_ok', !formData.acid_dosage_ok)}
                className={`btn-tactile touch-target w-full rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm select-none cursor-pointer group transition-all ${
                  formData.acid_dosage_ok
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-transform duration-150 group-active:scale-90 ${
                  formData.acid_dosage_ok ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'border-zinc-400 dark:border-zinc-600'
                }`}>
                  {formData.acid_dosage_ok && <Check className="w-3.5 h-3.5" />}
                </div>
                <span>{formData.acid_dosage_ok ? "Dosage OK (√)" : "Not Dosed"}</span>
              </button>
            </div>

            {/* Earth Dosage OK */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Earth Dosage
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleFieldChange('earth_dosage_ok', !formData.earth_dosage_ok)}
                className={`btn-tactile touch-target w-full rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm select-none cursor-pointer group transition-all ${
                  formData.earth_dosage_ok
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-transform duration-150 group-active:scale-90 ${
                  formData.earth_dosage_ok ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'border-zinc-400 dark:border-zinc-600'
                }`}>
                  {formData.earth_dosage_ok && <Check className="w-3.5 h-3.5" />}
                </div>
                <span>{formData.earth_dosage_ok ? "Dosage OK (√)" : "Not Dosed"}</span>
              </button>
            </div>
          </div>

          {/* Group 2: Critical Telemetry (HE Temp & Vacuum) with 3D Specular Depth */}
          <div className="telemetry-card grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-50/90 dark:bg-black/35 border border-zinc-200/90 dark:border-white/10 shadow-inner">
            {/* HE Temp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-display">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>HE Temp (°C)</span>
                  {isHeTempOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                </label>
                <span className="text-[11px] font-mono font-medium text-zinc-500">
                  Spec: 70-115 °C
                </span>
              </div>
              <div
                onClick={() => setActiveNumpadField('he_temp_c')}
                className={`touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  isHeTempOutOfSpec
                    ? 'bg-rose-500/10 border-rose-500/60 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                    : activeNumpadField === 'he_temp_c'
                      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                      : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.he_temp_c ?? ''}
                  onChange={(e) => handleFieldChange('he_temp_c', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="e.g. 105.0"
                />
                <span className="font-mono text-sm font-semibold text-zinc-400">°C</span>
              </div>
              {isHeTempOutOfSpec && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                  Out of range! Must be between 70.0 and 115.0 °C.
                </p>
              )}
            </div>

            {/* Bleacher Vacuum */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-display">
                  <Gauge className="w-3.5 h-3.5 text-sky-500" />
                  <span>Bleacher Vacuum (mmHg)</span>
                  {isVacOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                </label>
                <span className="text-[11px] font-mono font-medium text-zinc-500">
                  Spec: Min. 600 mmHg
                </span>
              </div>
              <div
                onClick={() => setActiveNumpadField('vacuum_mmhg')}
                className={`touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  isVacOutOfSpec
                    ? 'bg-rose-500/10 border-rose-500/60 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                    : activeNumpadField === 'vacuum_mmhg'
                      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                      : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="1"
                  readOnly={!canEdit}
                  value={formData.vacuum_mmhg ?? ''}
                  onChange={(e) => handleFieldChange('vacuum_mmhg', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-xl font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="e.g. 640"
                />
                <span className="font-mono text-sm font-semibold text-zinc-400">mmHg</span>
              </div>
              {isVacOutOfSpec && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                  Vacuum too low! Minimum required is 600.0 mmHg.
                </p>
              )}
            </div>
          </div>

          {/* Group 3: Segmented Controls (Bleacher Level & Niagara Filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bleacher Level Toggle (L / H) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Bleacher Level (L / H)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BLEACHER_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleFieldChange('bleacher_level', lvl)}
                    className={`btn-tactile touch-target rounded-xl border font-bold text-base select-none cursor-pointer transition-all ${
                      formData.bleacher_level === lvl
                        ? 'btn-premium-amber text-white shadow-md ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Niagara Filter Selector (N60-1..4) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Niagara Filter (Select 1 of 4)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {NIAGARA_FILTERS.map((nf) => (
                  <button
                    key={nf}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleFieldChange('niagara_filter', nf)}
                    className={`btn-tactile touch-target rounded-xl border text-xs font-bold font-mono select-none cursor-pointer transition-all ${
                      formData.niagara_filter === nf
                        ? 'btn-premium-amber text-white shadow-md ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {nf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group 4: Changing Filter Time & Quality (FFA & Colour) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Changing Filter Time */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Filter Change Time
              </label>
              <div className="touch-target flex items-center px-3 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5">
                <input
                  type="text"
                  readOnly={!canEdit}
                  value={formData.filter_change_time ?? ''}
                  onChange={(e) => handleFieldChange('filter_change_time', e.target.value)}
                  className="w-full bg-transparent font-mono text-sm text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="HH:mm"
                />
              </div>
            </div>

            {/* Quality FFA % */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Quality: FFA (%)
              </label>
              <div 
                onClick={() => setActiveNumpadField('ffa_pct')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer transition-all ${
                  activeNumpadField === 'ffa_pct'
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="0.001"
                  readOnly={!canEdit}
                  value={formData.ffa_pct ?? ''}
                  onChange={(e) => handleFieldChange('ffa_pct', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="0.045"
                />
              </div>
            </div>

            {/* Quality Colour Red (R) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Colour (R)
              </label>
              <div 
                onClick={() => setActiveNumpadField('colour_r')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer transition-all ${
                  activeNumpadField === 'colour_r'
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.colour_r ?? ''}
                  onChange={(e) => handleFieldChange('colour_r', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="2.1"
                />
              </div>
            </div>

            {/* Quality Colour Yellow (Y) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Colour (Y)
              </label>
              <div 
                onClick={() => setActiveNumpadField('colour_y')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer transition-all ${
                  activeNumpadField === 'colour_y'
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.colour_y ?? ''}
                  onChange={(e) => handleFieldChange('colour_y', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none"
                  placeholder="18.0"
                />
              </div>
            </div>
          </div>

          {/* Group 5: Remarks (Mandatory on Out-of-Spec) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 font-display ${
                hasOutOfSpec ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                <span>Operator Remarks</span>
                {hasOutOfSpec && <span className="text-rose-600 dark:text-rose-400 font-bold">* (Mandatory due to out-of-spec)</span>}
              </label>
              <span className="text-[11px] text-zinc-500">
                Action taken / plant changes notes
              </span>
            </div>
            <textarea
              rows={2}
              readOnly={!canEdit}
              value={formData.remarks || ''}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none ${
                hasOutOfSpec && (!formData.remarks || formData.remarks.trim() === '')
                  ? 'border-rose-500/80 bg-rose-500/10 text-zinc-900 dark:text-white ring-2 ring-rose-500/30'
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              }`}
              placeholder={hasOutOfSpec ? "State cause of process deviation and corrective action taken (e.g., steam valve adjusted)..." : "Optional remarks..."}
            />
            {remarksError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {remarksError}
              </p>
            )}
          </div>

          {/* Optional Virtual Touch Numeric Keypad for fast tablet input */}
          {activeNumpadField && (
            <div className="p-3.5 bg-zinc-100/90 dark:bg-black/35 rounded-2xl border border-zinc-200/90 dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2.5">
                <span className="font-mono">Fast Touch Numpad: Editing [{String(activeNumpadField)}]</span>
                <button
                  type="button"
                  onClick={() => setActiveNumpadField(null)}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleKeypadPress(btn)}
                    className="btn-tactile touch-target bg-white dark:bg-white/10 rounded-xl border border-zinc-200 dark:border-white/10 font-mono text-base font-bold shadow-xs flex items-center justify-center text-zinc-800 dark:text-zinc-200 cursor-pointer hover:border-amber-500 transition-all active:scale-95"
                  >
                    {btn === 'BACKSPACE' ? <Delete className="w-5 h-5 text-rose-500" /> : btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Bottom Drawer Actions with 3D Frosted Glass */}
        <div className="px-6 py-4 border-t border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] backdrop-blur-md flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {formData.is_saved ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <Check className="w-4 h-4 text-emerald-500" /> Saved by {formData.entered_by_name || currentUser.name}
              </span>
            ) : (
              <span className="font-mono text-zinc-400">Slot not yet saved</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSmoothClose}
              className="btn-tactile btn-premium-glass px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canEdit}
              onClick={handleSaveClick}
              className="btn-premium-amber touch-target px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer group"
            >
              <Save className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Save Slot ({formData.time_label} Hrs)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
