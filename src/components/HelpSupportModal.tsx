"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  X, 
  BookOpen, 
  FileText, 
  PhoneCall, 
  Activity, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  Radio, 
  Building2, 
  AlertTriangle,
  Info
} from "lucide-react";
import { UserProfile } from "@/types";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
}

export default function HelpSupportModal({ isOpen, onClose, currentUser }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState<'sop' | 'specs' | 'directory' | 'diagnostics'>('sop');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0A101D] dark:bg-[#0A101D] border border-[#1F2E43] rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E43] bg-[#0E1726]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/15 border border-amber-600/30 text-amber-500 shadow-inner">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="help-modal-title" className="text-base font-bold text-white tracking-wide">
                  Refinery Support &amp; Knowledge Center
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lam Soon Edible Oils · Bleaching Line Digital Operations Manual, Specifications &amp; Plant Hotline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A283C] transition-all duration-200 ease-spring active:scale-90 cursor-pointer group"
            title="Close Modal"
            aria-label="Close"
          >
            <X className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#1F2E43] bg-[#080D18]/90 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sop')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 ease-spring active:scale-[0.97] cursor-pointer whitespace-nowrap group ${
              activeTab === 'sop'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg font-bold shadow-[inset_0_1px_0_rgba(245,158,11,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101927]'
            }`}
          >
            <BookOpen className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span>1. SOP &amp; Bleaching Workflow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 ease-spring active:scale-[0.97] cursor-pointer whitespace-nowrap group ${
              activeTab === 'specs'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg font-bold shadow-[inset_0_1px_0_rgba(245,158,11,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101927]'
            }`}
          >
            <FileText className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span>2. Quality Specs &amp; PORAM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 ease-spring active:scale-[0.97] cursor-pointer whitespace-nowrap group ${
              activeTab === 'directory'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg font-bold shadow-[inset_0_1px_0_rgba(245,158,11,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101927]'
            }`}
          >
            <PhoneCall className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span>3. Plant Control Room Hotline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 ease-spring active:scale-[0.97] cursor-pointer whitespace-nowrap group ${
              activeTab === 'diagnostics'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg font-bold shadow-[inset_0_1px_0_rgba(245,158,11,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101927]'
            }`}
          >
            <Activity className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span>4. System Diagnostics</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SOP & MODULE WORKFLOW */}
          {activeTab === 'sop' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-[#0E1726] border border-[#1F2E43] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>Nisshin Bleaching Process Operational Workflow (RF-FR-003 Rev 03)</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The digital system replaces manual paper logs on the plant floor. Technicians record physical process parameters hourly across 3 rotating 8-hour shifts. The system ensures immediate out-of-spec alert detection, automated shift handover traceability, and supervisory locking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Module 1 */}
                <div className="bg-[#0B1320] border border-[#1F2E43] hover:border-amber-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      OPERATIONS TECHNICIAN
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">FORM: RF-FR-003</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">1. Hourly Readings Entry &amp; Validation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Record hourly flowrate, bleacher vacuum (&ge; 600 mmHg), HE bleaching temp (100&ndash;115&deg;C), dosing (acid &amp; bleaching earth), and leaf filter cuts. Any out-of-spec value triggers an immediate alert and requires mandatory corrective remarks.
                  </p>
                  <div className="text-[11px] text-slate-300 bg-[#070C16] p-2.5 rounded-lg border border-[#172437] font-mono">
                    💡 Tip: Entries take under 45 seconds per hour with automatic data validation and tablet-friendly keyboards.
                  </div>
                </div>

                {/* Module 2 */}
                <div className="bg-[#0B1320] border border-[#1F2E43] hover:border-amber-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                      QC LABORATORY CHEMIST
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">STANDARD: PORAM</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">2. QC Verification &amp; Lovibond Color</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Chemist conducts bench testing on FFA% and Lovibond Color (5¼&quot; Cell Red/Yellow). Color readings matching or exceeding threshold (3.0 Red / 30 Yellow max) are flagged for bleaching earth dosage correction.
                  </p>
                  <div className="text-[11px] text-slate-300 bg-[#070C16] p-2.5 rounded-lg border border-[#172437] font-mono">
                    💡 Tip: QC samples synchronize across all shifts and link directly to daily production batches.
                  </div>
                </div>

                {/* Module 3 */}
                <div className="bg-[#0B1320] border border-[#1F2E43] hover:border-amber-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                      SHIFT SUPERVISOR
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ACTION: APPROVAL</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">3. Supervisor Monitoring &amp; Final Sign-Off</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Live stream monitors real-time parameter logs, out-of-spec incidents, and technician acknowledgments. Once slot 0700 completes 24 hours, supervisor reviews and locks the sheet permanently.
                  </p>
                  <div className="text-[11px] text-slate-300 bg-[#070C16] p-2.5 rounded-lg border border-[#172437] font-mono">
                    💡 Tip: Supervisor approvals seal the document and unlock official A4 landscape PDF export for audits.
                  </div>
                </div>

                {/* Module 4 */}
                <div className="bg-[#0B1320] border border-[#1F2E43] hover:border-amber-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                      SYSTEM ADMINISTRATOR
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ISO 9001 / HALAL</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">4. User Management &amp; Immutable Audit Trail</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Admins manage plant staff accounts, roles (Technician, Supervisor, QC Chemist, QA Manager, Admin), shift assignments, and monitor historical performance reports.
                  </p>
                  <div className="text-[11px] text-slate-300 bg-[#070C16] p-2.5 rounded-lg border border-[#172437] font-mono">
                    💡 Tip: Export daily reports to CSV or print the official A4 sheet with 100% fidelity to the physical form.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPECS & PORAM STANDARDS */}
          {activeTab === 'specs' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-[#0E1726] border border-[#1F2E43] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Bleaching Operating Limits &amp; Target Specifications (RF-FR-003 Rev 03)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[#1F2E43]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#080D18] text-slate-400 uppercase text-[10px] font-mono border-b border-[#1F2E43]">
                      <tr>
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3">Standard Operating Range</th>
                        <th className="py-2.5 px-3">Critical Threshold</th>
                        <th className="py-2.5 px-3">Corrective Engineering Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2E43]/60 font-mono">
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">Bleacher Vacuum Pressure</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">&ge; 600 mmHg</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">&lt; 600 mmHg (Low Vac)</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Inspect barometric condenser, motive steam and vacuum booster</td>
                      </tr>
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">HE Bleaching Temperature</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">100 &ndash; 115 &deg;C</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">&lt; 70 &deg;C or &gt; 115 &deg;C</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Regulate thermal oil/steam heat exchanger control valve</td>
                      </tr>
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">Flowrate Capacity</td>
                        <td className="py-2.5 px-3 text-slate-300">30.0 &ndash; 55.0 MT/HR</td>
                        <td className="py-2.5 px-3 text-amber-400">&gt; 55.0 MT/HR</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Adjust feed pump VFD and check downstream filter pressure drop</td>
                      </tr>
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">Phosphoric Acid Dose</td>
                        <td className="py-2.5 px-3 text-slate-300">0.030 &ndash; 0.080 %</td>
                        <td className="py-2.5 px-3 text-amber-400">Deviation &gt; &plusmn;0.015%</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Calibrate dosing stroke pump and check acid line strainer</td>
                      </tr>
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">Bleaching Earth (BE) Dose</td>
                        <td className="py-2.5 px-3 text-slate-300">0.50 &ndash; 1.80 %</td>
                        <td className="py-2.5 px-3 text-amber-400">Deviation &gt; &plusmn;0.25%</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Check gravimetric feeder screw and earth silo hopper level</td>
                      </tr>
                      <tr className="hover:bg-[#121D2C]">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">Lovibond Red / Yellow (Bleached Oil)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">&le; 3.0 R / &le; 30 Y</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">&gt; 3.0 Red</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">Increase BE dosage and check for leaf filter cloth leakage</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLANT DIRECTORY & HOTLINE */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-[#0E1726] border border-[#1F2E43] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                  <Radio className="h-4 w-4 text-amber-400" />
                  <span>Plant Communications &amp; Intercom Directory (Lam Soon Refinery)</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Use internal extension lines or handheld VHF two-way radios for immediate operational coordination or process escalation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B1320] border border-[#1F2E43] rounded-xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Central Control Room (CCR / DCS)</div>
                    <div className="text-xs text-slate-400 mt-0.5">Primary Plant Automation &amp; Bleaching Control</div>
                    <div className="mt-2 text-xs font-mono space-y-1">
                      <div className="text-sky-400">Intercom Ext: <span className="font-bold">201 / 202</span></div>
                      <div className="text-slate-300">VHF Radio: <span className="text-amber-400 font-bold">Channel 4 (Plant Ops)</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1320] border border-[#1F2E43] rounded-xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">QC Central Laboratory</div>
                    <div className="text-xs text-slate-400 mt-0.5">Sample Analytical Testing &amp; Batch Certification</div>
                    <div className="mt-2 text-xs font-mono space-y-1">
                      <div className="text-emerald-400">Intercom Ext: <span className="font-bold">108</span></div>
                      <div className="text-slate-300">Direct Line: <span className="text-slate-200">+603-3168-8000 (Ext 108)</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1320] border border-[#1F2E43] rounded-xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Emergency Health &amp; Safety (EHS)</div>
                    <div className="text-xs text-slate-400 mt-0.5">Oil Spill Containment, Fire Alarms &amp; Site Incidents</div>
                    <div className="mt-2 text-xs font-mono space-y-1">
                      <div className="text-rose-400 font-bold">Emergency: 999 / Ext. 911</div>
                      <div className="text-slate-300">Duty Safety Officer: <span className="text-slate-200">Ext 115</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1320] border border-[#1F2E43] rounded-xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Plant IT &amp; SCADA Engineering</div>
                    <div className="text-xs text-slate-400 mt-0.5">Database Infrastructure, Network &amp; Tablet Terminals</div>
                    <div className="mt-2 text-xs font-mono space-y-1">
                      <div className="text-purple-400">Intercom Ext: <span className="font-bold">305</span></div>
                      <div className="text-slate-300">Email: <span className="text-slate-200">plant-it@lamsoon.com.my</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shift Schedule Guide */}
              <div className="bg-[#080D18] p-4 rounded-xl border border-[#1F2E43]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>24-Hour Continuous Plant Shift Schedule</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#0E1726] border border-[#1F2E43]">
                    <div className="text-amber-400 font-bold">SHIFT 1 (Morning)</div>
                    <div className="text-slate-200 text-sm mt-0.5">08:00 &ndash; 15:00 MYT</div>
                    <div className="text-[10px] text-slate-400 mt-1">Slots: 0800 &ndash; 1500 (Idx 0&ndash;7)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E1726] border border-[#1F2E43]">
                    <div className="text-sky-400 font-bold">SHIFT 2 (Afternoon)</div>
                    <div className="text-slate-200 text-sm mt-0.5">16:00 &ndash; 23:00 MYT</div>
                    <div className="text-[10px] text-slate-400 mt-1">Slots: 1600 &ndash; 2300 (Idx 8&ndash;15)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E1726] border border-[#1F2E43]">
                    <div className="text-purple-400 font-bold">SHIFT 3 (Night)</div>
                    <div className="text-slate-200 text-sm mt-0.5">24:00 &ndash; 07:00 MYT</div>
                    <div className="text-[10px] text-slate-400 mt-1">Slots: 2400 &ndash; 0700 (Idx 16&ndash;23)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM STATUS & DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#0E1726] p-3.5 rounded-xl border border-[#1F2E43]">
                  <div className="text-slate-400 text-[10px] uppercase">Database Engine</div>
                  <div className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ONLINE</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">InsForge Postgres (ap-southeast)</div>
                </div>

                <div className="bg-[#0E1726] p-3.5 rounded-xl border border-[#1F2E43]">
                  <div className="text-slate-400 text-[10px] uppercase">Plant Timezone</div>
                  <div className="text-amber-400 font-bold text-sm mt-1">Asia/Kuala_Lumpur</div>
                  <div className="text-[10px] text-slate-400 mt-1">MYT (UTC +08:00)</div>
                </div>

                <div className="bg-[#0E1726] p-3.5 rounded-xl border border-[#1F2E43]">
                  <div className="text-slate-400 text-[10px] uppercase">Compliance Level</div>
                  <div className="text-purple-400 font-bold text-sm mt-1">ISO 9001:2015</div>
                  <div className="text-[10px] text-slate-400 mt-1">Halal Audit Trail Verified</div>
                </div>

                <div className="bg-[#0E1726] p-3.5 rounded-xl border border-[#1F2E43]">
                  <div className="text-slate-400 text-[10px] uppercase">Application Build</div>
                  <div className="text-white font-bold text-sm mt-1">v2.1 Production</div>
                  <div className="text-[10px] text-slate-400 mt-1">Next.js 15 + React 19</div>
                </div>
              </div>

              <div className="bg-[#0E1726] border border-[#1F2E43] rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>Authorized System Credentials</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Log in using your Staff Email, Username, or Employee ID (e.g. <span className="text-white font-mono font-bold">admin@lamsoon.com.my</span>, <span className="text-white font-mono font-bold">ADM001</span>, or <span className="text-white font-mono font-bold">OPR001</span>). Default password for registered station accounts is <span className="text-amber-400 font-mono font-bold">password123</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1F2E43] bg-[#0E1726]/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Info className="h-3.5 w-3.5 text-amber-500" />
            <span>Refinery Process Management System · Form RF-FR-003 Rev 03</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-4 py-1.5 rounded-lg bg-[#142032] hover:bg-[#1A283C] text-slate-200 font-mono text-xs border border-[#1F2E43] shadow-sm hover:border-slate-500/50 transition-all duration-200 ease-spring active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
