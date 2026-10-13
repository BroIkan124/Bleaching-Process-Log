"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogEntry, UserProfile, OutOfSpecFlag } from "@/types";
import { NIAGARA_FILTERS, BLEACHER_LEVELS } from "@/lib/constants";
import { validateReadingSpecs } from "@/lib/utils";
import { 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Thermometer,
  Gauge,
  Lock,
  Unlock,
  Droplets,
  Sliders,
  Activity,
  FlaskConical,
  Filter
} from "lucide-react";
import { evaluateSlotAccess } from "@/lib/realtimeTimeline";
import { GliderRadioGroup } from "./GliderRadioGroup";
import { AnimatedCheckbox } from "./AnimatedCheckbox";

interface SlotEntryDrawerProps {
  entry: LogEntry;
  canEdit: boolean;
  currentUser: UserProfile;
  onSave: (updated: LogEntry) => void;
  onClose: () => void;
  onNavigateSlot: (direction: -1 | 1) => void;
  isFirstSlot: boolean;
  isLastSlot: boolean;
  activeCurrentHourIndex?: number;
  isSupervisorOverride?: boolean;
  onToggleSupervisorOverride?: (slotIndex: number) => void;
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
  activeCurrentHourIndex = 0,
  isSupervisorOverride = false,
  onToggleSupervisorOverride,
}) => {
  // Local form state
  const [formData, setFormData] = useState<LogEntry>({ ...entry });
  const [outOfSpecFlags, setOutOfSpecFlags] = useState<OutOfSpecFlag[]>(entry.out_of_spec || []);
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => {
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);
    };
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

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

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

  const access = evaluateSlotAccess(
    entry.slot_index,
    activeCurrentHourIndex,
    isSupervisorOverride,
    currentUser.role
  );
  const isEditable = canEdit && access.isEditable;

  if (!isMounted) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md transition-opacity duration-240 ${
        isMounted && !isClosing ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#0B1120] shadow-[0_24px_80px_rgba(0,0,0,0.45)] dark:shadow-[0_32px_120px_rgba(0,0,0,0.9)] flex flex-col rounded-3xl border border-zinc-200/90 dark:border-white/10 overflow-hidden transform transition-all duration-240 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMounted && !isClosing ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Top Header Navigation */}
        <div className="px-6 py-4 border-b border-zinc-200/90 dark:border-white/10 flex items-center justify-between bg-zinc-50/80 dark:bg-black/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-base shadow-sm ${
              hasOutOfSpec 
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                : formData.is_saved
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}>
              {formData.time_label}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Slot Hourly Entry: {formData.time_label} Hrs
                </h3>
                <span className="text-xs text-zinc-500 font-medium">
                  · {formData.shift === 1 ? 'Shift 1 (Morning)' : formData.shift === 2 ? 'Shift 2 (Afternoon)' : 'Shift 3 (Night)'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Timestamp: {new Date(formData.actual_timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })}
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

        {/* Realtime Access Rule Banner (if slot is locked or overridden) */}
        {access.status === 'past_locked' && !isSupervisorOverride && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/25 flex items-start justify-between gap-3 text-xs backdrop-blur-sm shrink-0">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5 shadow-2xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 font-display text-xs">
                  Entry Window Closed (Slot Locked):
                </span>
                <p className="text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed text-xs">
                  {access.reasonMessage}
                </p>
              </div>
            </div>
            {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && onToggleSupervisorOverride && (
              <button
                type="button"
                onClick={() => onToggleSupervisorOverride(entry.slot_index)}
                className="btn-tactile px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm hover:bg-amber-600 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock (Override)</span>
              </button>
            )}
          </div>
        )}

        {access.status === 'future_locked' && !isSupervisorOverride && (
          <div className="px-6 py-2.5 bg-zinc-500/10 border-b border-zinc-500/20 flex items-start gap-2.5 text-xs backdrop-blur-sm shrink-0">
            <div className="p-1 rounded-lg bg-zinc-500/20 text-zinc-400 shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 font-display text-xs">
                Future Slot Not Yet Reached:
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed text-xs">
                {access.reasonMessage}
              </p>
            </div>
          </div>
        )}

        {isSupervisorOverride && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/25 flex items-center justify-between gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold font-display text-xs">
                Supervisor Override Active: Slot entry is unlocked for on-duty operators.
              </span>
            </div>
            {onToggleSupervisorOverride && (
              <button
                type="button"
                onClick={() => onToggleSupervisorOverride(entry.slot_index)}
                className="text-xs underline font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
              >
                Re-Lock Slot
              </button>
            )}
          </div>
        )}

        {/* 2-Column Balanced Form Body */}
        <form onSubmit={handleSaveClick} className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column (7 cols): Process Operations & Telemetry */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Operating Flow & Chemical Dosing */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-display">
                  <Droplets className="w-3.5 h-3.5 text-amber-500" />
                  <span>Process Feed & Chemical Dosing</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Flowrate MT/HR Set */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Flowrate (MT/HR)
                    </label>
                    <div 
                      className={`touch-target flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isEditable}
                        value={formData.flowrate_set ?? ''}
                        onChange={(e) => handleFieldChange('flowrate_set', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none disabled:opacity-60"
                        placeholder="e.g. 45.0"
                      />
                      <span className="text-[11px] text-zinc-400 font-mono">MT/HR</span>
                    </div>
                  </div>

                  {/* Acid Dosage OK */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Acid Dosage
                    </label>
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => handleFieldChange('acid_dosage_ok', !formData.acid_dosage_ok)}
                      className={`btn-tactile touch-target w-full rounded-xl border flex items-center justify-center gap-2.5 font-semibold text-xs select-none transition-all ${
                        !isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        formData.acid_dosage_ok
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      <AnimatedCheckbox 
                        checked={Boolean(formData.acid_dosage_ok)} 
                        disabled={!isEditable} 
                        color="emerald" 
                        size="sm" 
                      />
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
                      disabled={!isEditable}
                      onClick={() => handleFieldChange('earth_dosage_ok', !formData.earth_dosage_ok)}
                      className={`btn-tactile touch-target w-full rounded-xl border flex items-center justify-center gap-2.5 font-semibold text-xs select-none transition-all ${
                        !isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        formData.earth_dosage_ok
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      <AnimatedCheckbox 
                        checked={Boolean(formData.earth_dosage_ok)} 
                        disabled={!isEditable} 
                        color="emerald" 
                        size="sm" 
                      />
                      <span>{formData.earth_dosage_ok ? "Dosage OK (√)" : "Not Dosed"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Critical Telemetry (HE Temp & Vacuum) with 3D Specular Depth */}
              <div className="telemetry-card p-4 rounded-2xl bg-zinc-50/90 dark:bg-black/35 border border-zinc-200/90 dark:border-white/10 shadow-inner space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-display">
                  <Sliders className="w-3.5 h-3.5 text-sky-500" />
                  <span>Bleaching Vessel Telemetry</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* HE Temp */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
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
                      className={`touch-target flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : isHeTempOutOfSpec
                            ? 'bg-rose-500/10 border-rose-500/60 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                            : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isEditable}
                        value={formData.he_temp_c ?? ''}
                        onChange={(e) => handleFieldChange('he_temp_c', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none disabled:opacity-60"
                        placeholder="e.g. 105.0"
                      />
                      <span className="font-mono text-xs font-semibold text-zinc-400">°C</span>
                    </div>
                    {isHeTempOutOfSpec && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        Out of range! Must be 70.0 - 115.0 °C.
                      </p>
                    )}
                  </div>

                  {/* Bleacher Vacuum */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-display">
                        <Gauge className="w-3.5 h-3.5 text-sky-500" />
                        <span>Bleacher Vacuum (mmHg)</span>
                        {isVacOutOfSpec && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      </label>
                      <span className="text-[11px] font-mono font-medium text-zinc-500">
                        Spec: Min. 600
                      </span>
                    </div>
                    <div
                      className={`touch-target flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : isVacOutOfSpec
                            ? 'bg-rose-500/10 border-rose-500/60 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                            : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="1"
                        disabled={!isEditable}
                        value={formData.vacuum_mmhg ?? ''}
                        onChange={(e) => handleFieldChange('vacuum_mmhg', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none disabled:opacity-60"
                        placeholder="e.g. 640"
                      />
                      <span className="font-mono text-xs font-semibold text-zinc-400">mmHg</span>
                    </div>
                    {isVacOutOfSpec && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        Too low! Min 600.0 mmHg.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Level & Niagara Filtration */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-display">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Vessel Level & Niagara Filtration</span>
                </div>
                
                {/* Row 1: Bleacher Level & Change Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Bleacher Level Toggle (L / H) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Bleacher Level
                    </label>
                    <GliderRadioGroup
                      disabled={!isEditable}
                      value={formData.bleacher_level || 'L'}
                      onChange={(lvl) => handleFieldChange('bleacher_level', lvl)}
                      themeColor="amber"
                      size="sm"
                      variant="rounded"
                      equalWidth
                      className="w-full"
                      options={BLEACHER_LEVELS.map((lvl) => ({
                        value: lvl,
                        label: `Level ${lvl}`,
                      }))}
                    />
                  </div>

                  {/* Changing Filter Time */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Filter Change Time
                    </label>
                    <div className={`touch-target flex items-center px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 ${
                      !isEditable ? 'bg-zinc-100 dark:bg-zinc-900 opacity-60 cursor-not-allowed' : 'bg-white dark:bg-white/5'
                    }`}>
                      <input
                        type="text"
                        readOnly={!isEditable}
                        disabled={!isEditable}
                        value={formData.filter_change_time ?? ''}
                        onChange={(e) => handleFieldChange('filter_change_time', e.target.value)}
                        className="w-full bg-transparent font-mono text-sm text-zinc-900 dark:text-white focus:outline-none disabled:opacity-60"
                        placeholder="HH:mm (e.g. 14:30)"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Niagara Filter Selector (N60-1..4) full width */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Niagara Filter (1 of 4 Active)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">Selected: {formData.niagara_filter || 'N60-1'}</span>
                  </div>
                  <GliderRadioGroup
                    disabled={!isEditable}
                    value={formData.niagara_filter || 'N60-1'}
                    onChange={(nf) => handleFieldChange('niagara_filter', nf)}
                    themeColor="amber"
                    size="sm"
                    variant="rounded"
                    equalWidth
                    className="w-full"
                    options={NIAGARA_FILTERS.map((nf) => ({
                      value: nf,
                      label: nf,
                    }))}
                  />
                </div>
              </div>

            </div>

            {/* Right Column (5 cols): Lab Quality, Out-of-Spec Warning & Remarks */}
            <div className="lg:col-span-5 space-y-4 flex flex-col h-full justify-between">
              
              {/* 4. Laboratory Quality Telemetry */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-display">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                  <span>Laboratory Quality Checks</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Quality FFA % */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      FFA (%)
                    </label>
                    <div 
                      className={`touch-target flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="0.001"
                        disabled={!isEditable}
                        value={formData.ffa_pct ?? ''}
                        onChange={(e) => handleFieldChange('ffa_pct', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none disabled:opacity-60"
                        placeholder="0.045"
                      />
                      <span className="text-[11px] text-zinc-400 font-mono">%</span>
                    </div>
                  </div>

                  {/* Quality Colour Red (R) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Colour (R)
                    </label>
                    <div 
                      className={`touch-target flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isEditable}
                        value={formData.colour_r ?? ''}
                        onChange={(e) => handleFieldChange('colour_r', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-rose-600 dark:text-rose-400 focus:outline-none disabled:opacity-60"
                        placeholder="2.1"
                      />
                      <span className="text-[11px] text-rose-500 font-bold font-mono">R</span>
                    </div>
                  </div>

                  {/* Quality Colour Yellow (Y) */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Colour (Y)
                    </label>
                    <div 
                      className={`touch-target flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all ${
                        !isEditable 
                          ? 'cursor-not-allowed opacity-60 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                          : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
                      }`}
                    >
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isEditable}
                        value={formData.colour_y ?? ''}
                        onChange={(e) => handleFieldChange('colour_y', parseFloat(e.target.value) || null)}
                        className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-amber-600 dark:text-amber-400 focus:outline-none disabled:opacity-60"
                        placeholder="18.0"
                      />
                      <span className="text-[11px] text-amber-500 font-bold font-mono">Y</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Process Out-of-Spec Warning Notice */}
              {hasOutOfSpec && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs backdrop-blur-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-bold font-display text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Process Out-of-Spec Alert</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium">
                    {outOfSpecFlags.map((flag, idx) => (
                      <li key={idx}>{flag.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6. Operator Remarks */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 space-y-2 flex-1 flex flex-col min-h-[140px]">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold flex items-center gap-1.5 font-display ${
                    hasOutOfSpec ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    <span>Operator Remarks</span>
                    {hasOutOfSpec && <span className="text-rose-500 font-bold">* (Mandatory)</span>}
                  </label>
                  <span className="text-[11px] text-zinc-500">Action taken / notes</span>
                </div>
                <textarea
                  rows={4}
                  readOnly={!isEditable}
                  disabled={!isEditable}
                  value={formData.remarks || ''}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                  className={`w-full flex-1 p-3 rounded-xl border text-xs transition-all focus:outline-none disabled:opacity-60 resize-none ${
                    !isEditable ? 'cursor-not-allowed bg-zinc-100 dark:bg-zinc-900' : ''
                  } ${
                    hasOutOfSpec && (!formData.remarks || formData.remarks.trim() === '')
                      ? 'border-rose-500/80 bg-rose-500/10 text-zinc-900 dark:text-white ring-2 ring-rose-500/30'
                      : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                  placeholder={hasOutOfSpec ? "State cause of deviation and corrective action taken (e.g., steam valve adjusted)..." : "Optional remarks..."}
                />
                {remarksError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{remarksError}</span>
                  </p>
                )}
              </div>

            </div>

          </div>
        </form>

        {/* Bottom Dialog Actions Bar */}
        <div className="px-6 py-4 border-t border-zinc-200/90 dark:border-white/10 bg-zinc-50/90 dark:bg-[#0A0F1C]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
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
              className="btn-tactile btn-premium-glass px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all"
            >
              {isEditable ? "Cancel" : "Close (Review Mode)"}
            </button>
            {isEditable ? (
              <button
                type="button"
                onClick={handleSaveClick}
                className="btn-premium-amber touch-target px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer group"
              >
                <Save className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Save Slot ({formData.time_label} Hrs)</span>
              </button>
            ) : (
              <div
                className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-not-allowed border border-zinc-300 dark:border-zinc-700/60 shadow-inner"
              >
                <Lock className="w-4 h-4 text-zinc-400" />
                <span>Slot Locked (Window Closed)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
