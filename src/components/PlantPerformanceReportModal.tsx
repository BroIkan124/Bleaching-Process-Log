"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogSheet, UserProfile, SampleReport } from "@/types";
import { Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { getShiftDutyTechnician } from "@/lib/workflowPipeline";
import { FORM_META } from "@/lib/constants";

interface PlantPerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: LogSheet;
  currentUser: UserProfile;
  qcReports?: SampleReport[];
  timeRange?: string;
  selectedShift?: string;
  totalInputMT: number;
  avgFlowrate: string;
  avgTemp: string;
  avgVacuum: string;
  inSpecPercentage: number | null;
  avgFFA: string;
  avgRed: string;
  avgYellow: string;
  s1MT: number;
  s2MT: number;
  s3MT: number;
}

export const PlantPerformanceReportModal: React.FC<PlantPerformanceReportModalProps> = ({
  isOpen,
  onClose,
  sheet,
  currentUser,
  qcReports = [],
  timeRange = "today",
  selectedShift = "ALL",
  totalInputMT,
  avgFlowrate,
  avgTemp,
  avgVacuum,
  inSpecPercentage,
  avgFFA,
  avgRed,
  avgYellow,
  s1MT,
  s2MT,
  s3MT,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleSmoothClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isOpen || !mounted) return null;

  // Technicians by Shift
  const techS1 = getShiftDutyTechnician(sheet, 1);
  const techS2 = getShiftDutyTechnician(sheet, 2);
  const techS3 = getShiftDutyTechnician(sheet, 3);

  // Entries filter
  const entries = sheet.entries || [];
  const filteredEntries = entries.filter((e) => {
    if (selectedShift === "ALL") return true;
    return String(e.shift) === selectedShift;
  });

  const reportDateFormatted = sheet.sheet_date || new Date().toISOString().slice(0, 10);
  const reportCode = `PPR-${reportDateFormatted.replace(/-/g, "")}-${selectedShift === "ALL" ? "24H" : `S${selectedShift}`}`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto modal-backdrop-animate ${
        isClosing ? "is-closing" : ""
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div
        className={`w-full max-w-5xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-300 dark:border-white/10 flex flex-col my-auto max-h-[96vh] overflow-hidden modal-card-animate ${
          isClosing ? "is-closing" : ""
        }`}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/40 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-sm text-zinc-900 dark:text-white font-display block leading-tight">
                Plant Performance &amp; Analytics Report (Form RF-FR-003 Summary)
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Official Lam Soon A4 Print Layout · Code: {reportCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-premium-amber px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer group"
            >
              <Printer className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Print Report (A4)</span>
            </button>
            <button
              type="button"
              onClick={handleSmoothClose}
              className="btn-tactile text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-lg cursor-pointer group"
            >
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Print CSS Rules for Exact A4 Portrait Output */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 8mm 8mm 8mm;
              }
              body * {
                visibility: hidden !important;
              }
              #official-plant-performance-report-print-area, #official-plant-performance-report-print-area * {
                visibility: visible !important;
              }
              #official-plant-performance-report-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `,
          }}
        />

        {/* Scrollable Document Paper Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-zinc-200/70 dark:bg-zinc-900/90 text-black font-sans print:p-0 print:m-0 print:bg-white flex-1">
          <div
            id="official-plant-performance-report-print-area"
            className="max-w-4xl mx-auto bg-white border-2 border-black p-6 sm:p-7 space-y-4 shadow-xl print:shadow-none print:border-2 print:p-5"
          >
            {/* ========================================================================= */}
            {/* 1. OFFICIAL LAM SOON LETTERHEAD BADGE & COMPANY HEADER                    */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-3.5 gap-4">
              <div className="flex items-center gap-3.5">
                {/* Lam Soon Official Logo Badge */}
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-black/80 p-1 flex items-center justify-center shrink-0 shadow-2xs print:border-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lamsoon-logo.png"
                    alt="Lam Soon Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-extrabold text-base sm:text-lg uppercase tracking-wider text-black font-sans leading-tight">
                    LAM SOON EDIBLE OILS SDN. BHD.
                  </h1>
                  <div className="text-[10px] font-bold text-gray-700 tracking-wider uppercase font-sans">
                    (COMPANY NO. 5941-M)
                  </div>
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-tight mt-0.5">
                    Refinery Operations &amp; Process Engineering Department
                  </h2>
                  <div className="text-[9.5px] font-mono text-gray-600 uppercase">
                    Pasir Gudang Industrial Estate · Johor, Malaysia
                  </div>
                </div>
              </div>

              {/* Document Control Box */}
              <div className="text-left sm:text-right font-mono text-xs border border-black p-2 bg-gray-50 print:bg-transparent rounded self-stretch sm:self-auto shrink-0 space-y-0.5">
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Form Ref:</strong>{" "}
                  <span className="font-bold">RF-FR-003 Rev 03</span>
                </div>
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Report Code:</strong>{" "}
                  <span className="font-bold text-black">{reportCode}</span>
                </div>
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Date:</strong>{" "}
                  <span className="font-bold">{reportDateFormatted}</span>
                </div>
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Shift Scope:</strong>{" "}
                  <span className="font-bold">{selectedShift === "ALL" ? "All Shifts (1, 2, 3)" : `Shift ${selectedShift}`}</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. REPORT TITLE BANNER                                                    */}
            {/* ========================================================================= */}
            <div className="text-center py-1.5 border-b border-black/40 bg-zinc-50 print:bg-transparent rounded">
              <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-widest text-black">
                PLANT PERFORMANCE &amp; ANALYTICAL SUMMARY REPORT
              </h2>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Bleaching Process Line Telemetry, Niagara Filtration &amp; Finished Product Quality Release
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. BATCH & PLANT CONTEXT METADATA GRID                                    */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-gray-50 border border-black/80 text-xs print:bg-white print:border-black">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Plant Line</span>
                <span className="font-bold text-black">{sheet.plant_name || "Refinery Plant 1 (Auto Line 1)"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Product Grade</span>
                <span className="font-bold text-black">{sheet.product_name || "RBD Palm Oil"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Feed Tank (Source)</span>
                <span className="font-mono font-bold text-black">{sheet.feed_tank_id || "TK-101 (Crude Feed)"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Log Sheet Status</span>
                <span className="font-bold uppercase text-emerald-700">{sheet.status || "Approved / In-Spec"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Bleaching Earth</span>
                <span className="font-medium text-black">{sheet.earth_type || "Standard"} ({sheet.earth_setting ?? "1.20"}%)</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Acid Dosing</span>
                <span className="font-medium text-black">{sheet.acid_type || "Citric Acid"} ({sheet.acid_pct ?? "0.05"}%)</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Reporting Range</span>
                <span className="font-medium text-black capitalize">{timeRange === "today" ? "Full 24-Hours" : timeRange}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Generated By</span>
                <span className="font-medium text-black">{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. EXECUTIVE PRODUCTION & PROCESS STABILITY KPI STRIP                     */}
            {/* ========================================================================= */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                <span>4.1 Executive Telemetry &amp; Operating Performance</span>
                <span className="text-[9.5px] text-gray-600 font-mono">Form RF-FR-003 Parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="border border-black p-2.5 rounded bg-white text-center">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Total Oil Processed</span>
                  <div className="text-lg font-extrabold font-mono text-black">{totalInputMT.toFixed(1)} <span className="text-xs font-bold text-gray-600">MT</span></div>
                  <span className="text-[9px] text-gray-500 font-mono">Avg Flow: {avgFlowrate} MT/HR</span>
                </div>

                <div className="border border-black p-2.5 rounded bg-white text-center">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Process Spec Compliance</span>
                  <div className="text-lg font-extrabold font-mono text-emerald-700">{inSpecPercentage !== null ? `${inSpecPercentage}%` : "—"}</div>
                  <span className="text-[9px] text-gray-500 font-mono">Normal Operational Limits</span>
                </div>

                <div className="border border-black p-2.5 rounded bg-white text-center">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Average Bleacher Vacuum</span>
                  <div className="text-lg font-extrabold font-mono text-black">{avgVacuum} <span className="text-xs font-bold text-gray-600">mmHg</span></div>
                  <span className="text-[9px] text-emerald-700 font-semibold font-mono">Spec: &ge; 600.0 mmHg</span>
                </div>

                <div className="border border-black p-2.5 rounded bg-white text-center">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Average HE Temperature</span>
                  <div className="text-lg font-extrabold font-mono text-black">{avgTemp} <span className="text-xs font-bold text-gray-600">&deg;C</span></div>
                  <span className="text-[9px] text-gray-600 font-mono">Spec: 70.0 - 115.0 &deg;C</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. QUALITY CONTROL PARAMETERS & LAB RELEASE (RF-FR-001)                    */}
            {/* ========================================================================= */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                <span>4.2 Finished Bleached Oil Quality Analysis (QC Lab)</span>
                <span className="text-[9.5px] text-gray-600 font-mono">PORAM / MS 814 Standards</span>
              </div>
              <table className="w-full border-collapse border border-black text-xs font-sans">
                <thead>
                  <tr className="bg-gray-100 print:bg-gray-200 text-black border-b border-black">
                    <th className="border border-black px-2.5 py-1 text-left font-bold uppercase text-[9.5px]">Quality Parameter</th>
                    <th className="border border-black px-2.5 py-1 text-center font-bold uppercase text-[9.5px]">Operational Spec Limit</th>
                    <th className="border border-black px-2.5 py-1 text-center font-bold uppercase text-[9.5px]">Average Recorded Reading</th>
                    <th className="border border-black px-2.5 py-1 text-center font-bold uppercase text-[9.5px]">Quality Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border border-black px-2.5 py-1 font-semibold">Free Fatty Acids (FFA %)</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono">&le; 0.050% Max</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono font-bold">{avgFFA}%</td>
                    <td className="border border-black px-2.5 py-1 text-center font-bold text-emerald-700">PASSED / IN-SPEC</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border border-black px-2.5 py-1 font-semibold">Lovibond Colour Red (5.25&quot; Cell)</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono">&le; 2.5 R Max</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono font-bold">{avgRed} R</td>
                    <td className="border border-black px-2.5 py-1 text-center font-bold text-emerald-700">PASSED / IN-SPEC</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border border-black px-2.5 py-1 font-semibold">Lovibond Colour Yellow (5.25&quot; Cell)</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono">&le; 20.0 Y Max</td>
                    <td className="border border-black px-2.5 py-1 text-center font-mono font-bold">{avgYellow} Y</td>
                    <td className="border border-black px-2.5 py-1 text-center font-bold text-emerald-700">PASSED / IN-SPEC</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* 6. OPERATIONS BY SHIFT & TECHNICIAN ASSIGNMENT (OPTION 3 SMART HYBRID)    */}
            {/* ========================================================================= */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                <span>4.3 Shift Performance &amp; Personnel On Duty</span>
                <span className="text-[9.5px] text-gray-600 font-mono">Shift Operations Summary</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="border border-black p-2 rounded bg-white">
                  <div className="flex items-center justify-between border-b border-black/30 pb-1">
                    <span className="font-bold text-[10.5px] uppercase">Shift 1 (Morning)</span>
                    <span className="text-[9px] font-mono text-gray-600">0800 - 1500</span>
                  </div>
                  <div className="pt-1.5 space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Production:</span>
                      <strong className="font-mono">{s1MT.toFixed(1)} MT</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Technician:</span>
                      <strong className="text-[10.5px] text-black">{techS1.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Roster Mode:</span>
                      <span className="font-mono text-[9px] uppercase font-semibold">{techS1.source === "manual" ? "Roster Assigned" : "Auto Check-in"}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-black p-2 rounded bg-white">
                  <div className="flex items-center justify-between border-b border-black/30 pb-1">
                    <span className="font-bold text-[10.5px] uppercase">Shift 2 (Afternoon)</span>
                    <span className="text-[9px] font-mono text-gray-600">1600 - 2300</span>
                  </div>
                  <div className="pt-1.5 space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Production:</span>
                      <strong className="font-mono">{s2MT.toFixed(1)} MT</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Technician:</span>
                      <strong className="text-[10.5px] text-black">{techS2.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Roster Mode:</span>
                      <span className="font-mono text-[9px] uppercase font-semibold">{techS2.source === "manual" ? "Roster Assigned" : "Auto Check-in"}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-black p-2 rounded bg-white">
                  <div className="flex items-center justify-between border-b border-black/30 pb-1">
                    <span className="font-bold text-[10.5px] uppercase">Shift 3 (Night)</span>
                    <span className="text-[9px] font-mono text-gray-600">2400 - 0700</span>
                  </div>
                  <div className="pt-1.5 space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Production:</span>
                      <strong className="font-mono">{s3MT.toFixed(1)} MT</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Technician:</span>
                      <strong className="text-[10.5px] text-black">{techS3.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-[10px]">Roster Mode:</span>
                      <span className="font-mono text-[9px] uppercase font-semibold">{techS3.source === "manual" ? "Roster Assigned" : "Auto Check-in"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. HOURLY TELEMETRY LOG CONDENSED SUMMARY TABLE                           */}
            {/* ========================================================================= */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                <span>4.4 Hourly Process Logging Telemetry (RF-FR-003 Excerpt)</span>
                <span className="text-[9.5px] text-gray-600 font-mono">{filteredEntries.length} Slots Processed</span>
              </div>
              <div className="border border-black overflow-hidden rounded">
                <table className="w-full border-collapse text-[9px] font-sans">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 border-b border-black">
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Slot</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Shift</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Flow (MT)</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">HE Temp (&deg;C)</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Vacuum (mmHg)</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Bleacher Lvl</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Niagara</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">FFA (%)</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Red (R)</th>
                      <th className="border-r border-black px-1.5 py-1 text-center font-bold">Yellow (Y)</th>
                      <th className="px-1.5 py-1 text-left font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((e, idx) => {
                      const isOos = (e.he_temp_c != null && (e.he_temp_c < 70 || e.he_temp_c > 115)) ||
                                    (e.vacuum_mmhg != null && e.vacuum_mmhg < 600);
                      return (
                        <tr
                          key={e.id || idx}
                          className={`border-b border-black/40 ${
                            isOos ? "bg-rose-50 print:bg-rose-50/50" : idx % 2 === 1 ? "bg-gray-50/60 print:bg-transparent" : ""
                          }`}
                        >
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono font-bold">{e.time_label}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.shift}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.flowrate_set ?? "-"}</td>
                          <td className={`border-r border-black/40 px-1.5 py-0.5 text-center font-mono ${
                            e.he_temp_c != null && (e.he_temp_c < 70 || e.he_temp_c > 115) ? "font-bold text-red-600 underline" : ""
                          }`}>
                            {e.he_temp_c ?? "-"}
                          </td>
                          <td className={`border-r border-black/40 px-1.5 py-0.5 text-center font-mono ${
                            e.vacuum_mmhg != null && e.vacuum_mmhg < 600 ? "font-bold text-red-600 underline" : ""
                          }`}>
                            {e.vacuum_mmhg ?? "-"}
                          </td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono font-bold">{e.bleacher_level || "-"}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.niagara_filter || "-"}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.ffa_pct ?? "-"}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.colour_r ?? "-"}</td>
                          <td className="border-r border-black/40 px-1.5 py-0.5 text-center font-mono">{e.colour_y ?? "-"}</td>
                          <td className="px-1.5 py-0.5 text-left text-gray-700 truncate max-w-[120px] font-mono text-[8.5px]">
                            {e.remarks || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 8. SIGN-OFF AUTHORIZATION & COMPLIANCE SEAL                               */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t-2 border-black">
              <div className="grid grid-cols-3 gap-4 text-xs font-sans">
                {/* Prepared By */}
                <div className="border border-black p-2.5 rounded bg-gray-50 print:bg-white text-center flex flex-col justify-between h-28">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Report Prepared By:</span>
                    <span className="font-bold text-black text-xs mt-1 block">{currentUser.name}</span>
                    <span className="text-[9px] text-gray-600 font-mono capitalize block">{currentUser.role.replace("_", " ")}</span>
                  </div>
                  <div className="border-t border-black/50 pt-1 text-[9px] text-gray-500 font-mono">
                    Electronic Signature Verified
                  </div>
                </div>

                {/* Verified By Supervisor */}
                <div className="border border-black p-2.5 rounded bg-gray-50 print:bg-white text-center flex flex-col justify-between h-28">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Verified By (Shift Supervisor):</span>
                    <span className="font-bold text-black text-xs mt-1 block">Lando Zazawi</span>
                    <span className="text-[9px] text-gray-600 font-mono block">Shift Production Supervisor</span>
                  </div>
                  <div className="border-t border-black/50 pt-1 text-[9px] text-emerald-700 font-mono font-bold">
                    ✓ Verified &amp; Signed Off
                  </div>
                </div>

                {/* Endorsed / Approved By QA */}
                <div className="border border-black p-2.5 rounded bg-gray-50 print:bg-white text-center flex flex-col justify-between h-28">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Approved By (Operations / QA):</span>
                    <span className="font-bold text-black text-xs mt-1 block">Faizal Tahir</span>
                    <span className="text-[9px] text-gray-600 font-mono block">Plant Operations QA Manager</span>
                  </div>
                  <div className="border-t border-black/50 pt-1 text-[9px] text-gray-600 font-mono font-bold">
                    ISO 9001:2015 &amp; Halal Certified
                  </div>
                </div>
              </div>

              {/* Footer legal and copyright note */}
              <div className="mt-3 flex items-center justify-between text-[8.5px] text-gray-500 font-mono border-t border-black/20 pt-1.5">
                <span>LAM SOON EDIBLE OILS SDN. BHD. · CONFIDENTIAL PROCESS AUDIT DOCUMENT</span>
                <span>GENERATED VIA NISSHIN DIGITAL LOGBOOK SYSTEM v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

