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
  Info
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-white dark:bg-[#18181B] shadow-2xl flex flex-col border-l border-slate-200 dark:border-zinc-800 overflow-hidden">
        {/* Top Drawer Navigation */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-base shadow-sm ${
              hasOutOfSpec 
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                : formData.is_saved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
            }`}>
              {formData.time_label}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  Slot Hourly Entry: {formData.time_label} Hrs
                </h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Shift {formData.shift}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Actual slot time: {new Date(formData.actual_timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigateSlot(-1)}
              disabled={isFirstSlot}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Previous Slot"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigateSlot(1)}
              disabled={isLastSlot}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Next Slot"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Out of spec alert banner */}
        {hasOutOfSpec && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Process Out-of-Spec Alert:</span>
              <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                {outOfSpecFlags.map((flag, idx) => (
                  <li key={idx}>{flag.message}</li>
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Flowrate (MT/HR Set)
              </label>
              <div 
                onClick={() => setActiveNumpadField('flowrate_set')}
                className={`touch-target flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer ${
                  activeNumpadField === 'flowrate_set'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.flowrate_set ?? ''}
                  onChange={(e) => handleFieldChange('flowrate_set', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. 45.0"
                />
                <span className="text-xs text-slate-400 font-mono">MT/HR</span>
              </div>
            </div>

            {/* Acid Dosage OK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acid Dosage
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleFieldChange('acid_dosage_ok', !formData.acid_dosage_ok)}
                className={`touch-target w-full rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all select-none ${
                  formData.acid_dosage_ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  formData.acid_dosage_ok ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                }`}>
                  {formData.acid_dosage_ok && <Check className="w-3.5 h-3.5" />}
                </div>
                <span>{formData.acid_dosage_ok ? "Dosage OK (√)" : "Not Dosed"}</span>
              </button>
            </div>

            {/* Earth Dosage OK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Earth Dosage
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleFieldChange('earth_dosage_ok', !formData.earth_dosage_ok)}
                className={`touch-target w-full rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all select-none ${
                  formData.earth_dosage_ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  formData.earth_dosage_ok ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                }`}>
                  {formData.earth_dosage_ok && <Check className="w-3.5 h-3.5" />}
                </div>
                <span>{formData.earth_dosage_ok ? "Dosage OK (√)" : "Not Dosed"}</span>
              </button>
            </div>
          </div>

          {/* Group 2: Critical Telemetry (HE Temp & Vacuum) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            {/* HE Temp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>HE Temp (°C)</span>
                  {isHeTempOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                </label>
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  Spec: 70–115 °C
                </span>
              </div>
              <div
                onClick={() => setActiveNumpadField('he_temp_c')}
                className={`touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  isHeTempOutOfSpec
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200 ring-2 ring-rose-400/30'
                    : activeNumpadField === 'he_temp_c'
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.he_temp_c ?? ''}
                  onChange={(e) => handleFieldChange('he_temp_c', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-xl font-bold tabular-nums focus:outline-none"
                  placeholder="e.g. 105.0"
                />
                <span className="font-mono text-sm font-semibold text-slate-400">°C</span>
              </div>
              {isHeTempOutOfSpec && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  Out of range! Must be between 70.0 and 115.0 °C.
                </p>
              )}
            </div>

            {/* Bleacher Vacuum */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Bleacher Vacuum (mmHg)</span>
                  {isVacOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                </label>
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  Spec: Min. 600 mmHg
                </span>
              </div>
              <div
                onClick={() => setActiveNumpadField('vacuum_mmhg')}
                className={`touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  isVacOutOfSpec
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200 ring-2 ring-rose-400/30'
                    : activeNumpadField === 'vacuum_mmhg'
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="1"
                  readOnly={!canEdit}
                  value={formData.vacuum_mmhg ?? ''}
                  onChange={(e) => handleFieldChange('vacuum_mmhg', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-xl font-bold tabular-nums focus:outline-none"
                  placeholder="e.g. 640"
                />
                <span className="font-mono text-sm font-semibold text-slate-400">mmHg</span>
              </div>
              {isVacOutOfSpec && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  Vacuum too low! Minimum required is 600.0 mmHg.
                </p>
              )}
            </div>
          </div>

          {/* Group 3: Segmented Controls (Bleacher Level & Niagara Filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bleacher Level Toggle (L / H) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bleacher Level (L / H)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BLEACHER_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleFieldChange('bleacher_level', lvl)}
                    className={`touch-target rounded-xl border font-bold text-base transition-all select-none ${
                      formData.bleacher_level === lvl
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Niagara Filter Selector (N60-1..4) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Niagara Filter (Select 1 of 4)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {NIAGARA_FILTERS.map((nf) => (
                  <button
                    key={nf}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleFieldChange('niagara_filter', nf)}
                    className={`touch-target rounded-xl border text-xs font-bold font-mono transition-all select-none ${
                      formData.niagara_filter === nf
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Filter Change Time
              </label>
              <div className="touch-target flex items-center px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                <input
                  type="text"
                  readOnly={!canEdit}
                  value={formData.filter_change_time ?? ''}
                  onChange={(e) => handleFieldChange('filter_change_time', e.target.value)}
                  className="w-full bg-transparent font-mono text-sm text-slate-900 dark:text-white focus:outline-none"
                  placeholder="HH:mm"
                />
              </div>
            </div>

            {/* Quality FFA % */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quality: FFA (%)
              </label>
              <div 
                onClick={() => setActiveNumpadField('ffa_pct')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer ${
                  activeNumpadField === 'ffa_pct'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="0.001"
                  readOnly={!canEdit}
                  value={formData.ffa_pct ?? ''}
                  onChange={(e) => handleFieldChange('ffa_pct', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  placeholder="0.045"
                />
              </div>
            </div>

            {/* Quality Colour Red (R) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Colour (R)
              </label>
              <div 
                onClick={() => setActiveNumpadField('colour_r')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer ${
                  activeNumpadField === 'colour_r'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.colour_r ?? ''}
                  onChange={(e) => handleFieldChange('colour_r', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  placeholder="2.1"
                />
              </div>
            </div>

            {/* Quality Colour Yellow (Y) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Colour (Y)
              </label>
              <div 
                onClick={() => setActiveNumpadField('colour_y')}
                className={`touch-target flex items-center px-3 rounded-xl border cursor-pointer ${
                  activeNumpadField === 'colour_y'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  readOnly={!canEdit}
                  value={formData.colour_y ?? ''}
                  onChange={(e) => handleFieldChange('colour_y', parseFloat(e.target.value) || null)}
                  className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  placeholder="18.0"
                />
              </div>
            </div>
          </div>

          {/* Group 5: Remarks (Mandatory on Out-of-Spec) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                hasOutOfSpec ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                <span>Remarks</span>
                {hasOutOfSpec && <span className="text-rose-600 font-bold">* (Mandatory due to out-of-spec)</span>}
              </label>
              <span className="text-[11px] text-slate-500">
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
                  ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-white ring-2 ring-rose-400/20'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
              }`}
              placeholder={hasOutOfSpec ? "State cause of process deviation and corrective action taken (e.g., steam valve adjusted)..." : "Optional remarks..."}
            />
            {remarksError && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {remarksError}
              </p>
            )}
          </div>

          {/* Optional Virtual Touch Numeric Keypad for fast tablet input */}
          {activeNumpadField && (
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <span>Fast Touch Numpad: Editing [{String(activeNumpadField)}]</span>
                <button
                  type="button"
                  onClick={() => setActiveNumpadField(null)}
                  className="text-amber-600 hover:underline"
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
                    className="touch-target bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-base font-bold shadow-sm active:scale-95 transition-transform flex items-center justify-center text-slate-800 dark:text-slate-200"
                  >
                    {btn === 'BACKSPACE' ? <Delete className="w-5 h-5 text-rose-600" /> : btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Bottom Drawer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {formData.is_saved ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved by {formData.entered_by_name || currentUser.name}
              </span>
            ) : (
              <span>Slot not yet saved</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canEdit}
              onClick={handleSaveClick}
              className="touch-target px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Slot ({formData.time_label} Hrs)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
