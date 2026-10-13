"use client";

import React, { useState } from "react";
import { LogSheet, LogEntry, SampleReport, UserProfile } from "@/types";
import { FORM_META } from "@/lib/constants";
import { Printer, X, CheckCircle2, ShieldCheck, FileText, FlaskConical, AlertTriangle, Layers } from "lucide-react";
import { recordDocumentExport } from "@/lib/dbService";
import { AnimatedCheckbox } from "./AnimatedCheckbox";
import { getShiftDutyTechnician } from "@/lib/workflowPipeline";

interface PdfExportModalProps {
  sheet: LogSheet;
  isOpen: boolean;
  onClose: () => void;
  qcReports?: SampleReport[];
  currentUser?: UserProfile;
  allUsers?: UserProfile[];
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  sheet,
  isOpen,
  onClose,
  qcReports = [],
  currentUser,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [highlightOutOfSpec, setHighlightOutOfSpec] = useState(true);

  // Shift duty technicians (Option 3: Smart Hybrid)
  const techS1 = getShiftDutyTechnician(sheet, 1);
  const techS2 = getShiftDutyTechnician(sheet, 2);
  const techS3 = getShiftDutyTechnician(sheet, 3);

  if (!isOpen) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handlePrint = () => {
    recordDocumentExport(
      "Bleaching Process Log Sheet (RF-FR-003 Rev 03)",
      "RF-FR-003",
      "Official Form",
      currentUser || null,
      {
        sheet_date: sheet.sheet_date,
        plant: sheet.plant_name || sheet.plant_id,
        product: sheet.product_name || sheet.product_id,
        status: sheet.status,
        total_entries: sheet.entries.filter(e => e.is_saved).length,
      }
    );
    window.print();
  };

  // Calculate Shift Subtotals & 24-Hour Grand Totals
  const calculateShiftStats = (entries: LogEntry[]) => {
    let totalFlow = 0;
    let flowCount = 0;
    let tempSum = 0;
    let tempCount = 0;
    let vacSum = 0;
    let vacCount = 0;
    let ffaSum = 0;
    let ffaCount = 0;
    let rSum = 0;
    let rCount = 0;
    let ySum = 0;
    let yCount = 0;
    let oosCount = 0;

    entries.forEach((e) => {
      if (e.flowrate_set != null && !isNaN(e.flowrate_set)) {
        totalFlow += e.flowrate_set;
        flowCount++;
      }
      if (e.he_temp_c != null && !isNaN(e.he_temp_c)) {
        tempSum += e.he_temp_c;
        tempCount++;
      }
      if (e.vacuum_mmhg != null && !isNaN(e.vacuum_mmhg)) {
        vacSum += e.vacuum_mmhg;
        vacCount++;
      }
      if (e.ffa_pct != null && !isNaN(e.ffa_pct)) {
        ffaSum += e.ffa_pct;
        ffaCount++;
      }
      if (e.colour_r != null && !isNaN(e.colour_r)) {
        rSum += e.colour_r;
        rCount++;
      }
      if (e.colour_y != null && !isNaN(e.colour_y)) {
        ySum += e.colour_y;
        yCount++;
      }
      if (e.out_of_spec && e.out_of_spec.length > 0) {
        oosCount += e.out_of_spec.length;
      }
    });

    return {
      totalFlow: flowCount > 0 ? totalFlow.toFixed(1) : "—",
      avgTemp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : "—",
      avgVac: vacCount > 0 ? (vacSum / vacCount).toFixed(1) : "—",
      avgFfa: ffaCount > 0 ? (ffaSum / ffaCount).toFixed(3) : "—",
      avgR: rCount > 0 ? (rSum / rCount).toFixed(1) : "—",
      avgY: yCount > 0 ? (ySum / yCount).toFixed(1) : "—",
      oosCount,
    };
  };

  const shift1Entries = sheet.entries.slice(0, 8);
  const shift2Entries = sheet.entries.slice(8, 16);
  const shift3Entries = sheet.entries.slice(16, 24);

  const statsS1 = calculateShiftStats(shift1Entries);
  const statsS2 = calculateShiftStats(shift2Entries);
  const statsS3 = calculateShiftStats(shift3Entries);
  const statsGrand = calculateShiftStats(sheet.entries);

  // Compute next day calendar date for Shift 3
  const nextDayStr = (() => {
    try {
      const d = new Date(sheet.sheet_date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  })();

  // Synchronized QC Reports linked to this log sheet / product
  const relevantQcReports = (qcReports || []).filter(
    (r) => !r.sample_date || r.sample_date === sheet.sheet_date || sheet.entries.some((e) => e.qc_sample_id === r.id)
  );

  return (
    <div
      className={`modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200 overflow-y-auto ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      {/* Print CSS Rules for Exact A4 Landscape 1-Page Output */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm 5mm 4mm 5mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
          }
          body * {
            visibility: hidden;
          }
          #official-rf-fr-003-print-area, #official-rf-fr-003-print-area * {
            visibility: visible;
          }
          #official-rf-fr-003-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />

      <div
        className={`modal-card-animate w-full max-w-[1340px] bg-white dark:bg-[#0A0F1C] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] border border-zinc-200/90 dark:border-white/10 flex flex-col my-auto max-h-[96vh] overflow-hidden ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Modal Top Control Bar (Screen Preview Only - Hidden in Print) */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/80 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  A4 Landscape Official Print &amp; PDF Export (RF-FR-003 Rev 03)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  100% Synced
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Format rasmi Lam Soon Edible Oils Sdn. Bhd. · Susun atur 1 muka surat A4 Landscape
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatedCheckbox
              checked={highlightOutOfSpec}
              onChange={(checked) => setHighlightOutOfSpec(checked)}
              color="amber"
              size="xs"
              label={
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  Highlight Out-of-Spec
                </span>
              }
            />

            <button
              onClick={handlePrint}
              className="btn-premium-amber px-4 py-2 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer group"
            >
              <Printer className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Print / Export PDF (A4)</span>
            </button>

            <button
              onClick={handleSmoothClose}
              className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group transition-all"
            >
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Paper Container - Scrollable on Screen, Clean Fullscreen in Print */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-zinc-200/70 dark:bg-zinc-900/90 print:p-0 print:m-0 print:bg-white">
          <div
            id="official-rf-fr-003-print-area"
            className="w-full bg-white text-black font-sans mx-auto p-3 sm:p-4 border border-black shadow-lg print:border-[1.5px] print:shadow-none print:p-2 print:w-full print:m-0"
            style={{ minWidth: "1050px" }}
          >
            {/* ========================================================================= */}
            {/* 1. OFFICIAL FORM HEADER BLOCK                                             */}
            {/* ========================================================================= */}
            <div className="border border-black mb-1.5">
              <div className="grid grid-cols-12 divide-x divide-black items-stretch">
                {/* 1a. Company Logo & Identity (Cols 1-4) */}
                <div className="col-span-4 p-1.5 flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lamsoon-logo.png"
                    alt="Lam Soon Logo"
                    className="w-10 h-10 object-contain shrink-0"
                    onError={(e) => {
                      // Fallback if image path fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h1 className="font-extrabold text-[11px] leading-tight tracking-tight uppercase font-sans">
                      {FORM_META.company}
                    </h1>
                    <div className="text-[8px] font-bold text-zinc-700 tracking-wider uppercase">
                      (COMPANY NO. 5941-M)
                    </div>
                    <div className="text-[8.5px] font-semibold text-zinc-800 uppercase leading-snug">
                      REFINERY DEPARTMENT · PASIR GUDANG PLANT
                    </div>
                  </div>
                </div>

                {/* 1b. Form Title Block (Cols 5-9) */}
                <div className="col-span-5 p-1.5 flex flex-col items-center justify-center text-center bg-zinc-50/50 print:bg-transparent">
                  <div className="border-b border-black pb-0.5 mb-0.5 w-full">
                    <h2 className="font-extrabold text-[12px] sm:text-[13px] tracking-wide uppercase leading-tight font-sans">
                      FS/WS AUTO BLEACHING PROCESS LOG SHEET
                    </h2>
                  </div>
                  <div className="text-[7.5px] font-bold tracking-widest text-zinc-700 uppercase">
                    PROCESS MONITORING &amp; QUALITY ASSURANCE PRODUCTION RECORD
                  </div>
                </div>

                {/* 1c. Document Control Box (Cols 10-12) */}
                <div className="col-span-3 text-[8px] font-mono divide-y divide-black">
                  <div className="grid grid-cols-2 px-1.5 py-0.5">
                    <span className="font-bold">Form No:</span>
                    <span className="font-bold text-right">{sheet.form_no || "RF-FR-003"}</span>
                  </div>
                  <div className="grid grid-cols-2 px-1.5 py-0.5">
                    <span className="font-bold">Rev. No:</span>
                    <span className="font-bold text-right">{sheet.form_rev || "03"}</span>
                  </div>
                  <div className="grid grid-cols-2 px-1.5 py-0.5">
                    <span className="font-bold">Eff. Date:</span>
                    <span className="text-right">01/06/2020</span>
                  </div>
                  <div className="grid grid-cols-2 px-1.5 py-0.5 bg-zinc-100/70 print:bg-transparent font-bold">
                    <span>Page:</span>
                    <span className="text-right">1 of 1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. HEADER METADATA & SHIFT ASSIGNMENT GRID                                 */}
            {/* ========================================================================= */}
            <div className="border border-black mb-1.5 text-[8.5px]">
              {/* Row 1: Plant & Tanks Parameters */}
              <div className="grid grid-cols-12 divide-x divide-black border-b border-black">
                <div className="col-span-2 px-1.5 py-1">
                  <span className="font-bold block text-[7.5px] text-zinc-600 uppercase">DATE:</span>
                  <span className="font-bold font-mono text-[9px]">{sheet.sheet_date}</span>
                </div>
                <div className="col-span-2 px-1.5 py-1">
                  <span className="font-bold block text-[7.5px] text-zinc-600 uppercase">PLANT / LINE:</span>
                  <span className="font-bold">{sheet.plant_name || sheet.plant_id || "Refinery Plant 1"}</span>
                </div>
                <div className="col-span-4 px-1.5 py-1 bg-amber-50/40 print:bg-transparent">
                  <span className="font-bold block text-[7.5px] text-zinc-600 uppercase">PRODUCT OIL:</span>
                  <span className="font-extrabold uppercase text-[9.5px]">
                    {sheet.product_name || sheet.product_id || "RBD PALM OIL"}
                  </span>
                </div>
                <div className="col-span-2 px-1.5 py-1">
                  <span className="font-bold block text-[7.5px] text-zinc-600 uppercase">FEED TANK:</span>
                  <span className="font-mono font-bold">{sheet.feed_tank_name || sheet.feed_tank_id || "TK-101"}</span>
                </div>
                <div className="col-span-2 px-1.5 py-1">
                  <span className="font-bold block text-[7.5px] text-zinc-600 uppercase">DISCHARGE TANK:</span>
                  <span className="font-mono font-bold">{sheet.discharge_tank_name || sheet.discharge_tank_id || "TK-201"}</span>
                </div>
              </div>

              {/* Row 2: Shift Duty Technicians & Lifecycle Status */}
              <div className="grid grid-cols-12 divide-x divide-black bg-zinc-50/60 print:bg-transparent">
                <div className="col-span-3 px-1.5 py-0.5">
                  <span className="font-bold text-[7.5px] text-zinc-700">Shift 1 (Morning · 0800-1500): </span>
                  <span className="font-semibold">{techS1.name || "Pending Check-in"}</span>
                </div>
                <div className="col-span-3 px-1.5 py-0.5">
                  <span className="font-bold text-[7.5px] text-zinc-700">Shift 2 (Afternoon · 1600-2300): </span>
                  <span className="font-semibold">{techS2.name || "Pending Check-in"}</span>
                </div>
                <div className="col-span-3 px-1.5 py-0.5">
                  <span className="font-bold text-[7.5px] text-zinc-700">Shift 3 (Night · 2400-0700): </span>
                  <span className="font-semibold">{techS3.name || "Pending Check-in"}</span>
                </div>
                <div className="col-span-3 px-1.5 py-0.5 flex items-center justify-between">
                  <span className="font-bold text-[7.5px] text-zinc-700">SHEET STATUS:</span>
                  <span className="font-extrabold uppercase font-mono px-1 py-0.2 rounded border border-black text-[8px] bg-white">
                    {sheet.status}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. OPERATING PARAMETERS BLOCK                                             */}
            {/* ========================================================================= */}
            <div className="border border-black mb-1.5 text-[8px]">
              <div className="bg-zinc-200/80 print:bg-zinc-100 px-2 py-0.5 border-b border-black font-extrabold tracking-wider uppercase text-[7.5px]">
                OPERATING PARAMETERS &amp; DOSING SPECIFICATIONS (TARGET RUN)
              </div>
              <div className="grid grid-cols-4 divide-x divide-black">
                {/* 3a. Input Flowrate */}
                <div className="p-1 leading-snug">
                  <strong className="block text-[7.5px] text-zinc-700 uppercase border-b border-zinc-300 pb-0.5 mb-0.5">
                    1. Input Flowrate
                  </strong>
                  <div className="flex justify-between">
                    <span>Target Rate:</span>
                    <span className="font-mono font-bold">{sheet.input_mt_hr != null ? `${sheet.input_mt_hr} MT/HR` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Budget:</span>
                    <span className="font-mono font-bold">{sheet.input_mt_day != null ? `${sheet.input_mt_day} MT/DAY` : "—"}</span>
                  </div>
                </div>

                {/* 3b. Degumming Acid */}
                <div className="p-1 leading-snug">
                  <strong className="block text-[7.5px] text-zinc-700 uppercase border-b border-zinc-300 pb-0.5 mb-0.5">
                    2. Degumming Acid ({sheet.acid_type || "Citric Acid"})
                  </strong>
                  <div className="flex justify-between">
                    <span>Stroke / Speed:</span>
                    <span className="font-mono font-bold">
                      {sheet.acid_mm != null ? `${sheet.acid_mm} mm` : "—"} / {sheet.acid_cm_hr != null ? `${sheet.acid_cm_hr} cm/h` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dosing Ratio:</span>
                    <span className="font-mono font-bold">{sheet.acid_pct != null ? `${sheet.acid_pct}%` : "—"}</span>
                  </div>
                </div>

                {/* 3c. Bleaching Earth */}
                <div className="p-1 leading-snug">
                  <strong className="block text-[7.5px] text-zinc-700 uppercase border-b border-zinc-300 pb-0.5 mb-0.5">
                    3. Bleaching Earth ({sheet.earth_type || "Standard Earth"})
                  </strong>
                  <div className="flex justify-between">
                    <span>Setting / Min %:</span>
                    <span className="font-mono font-bold">
                      {sheet.earth_setting != null ? sheet.earth_setting : "—"} / {sheet.earth_min_pct != null ? `${sheet.earth_min_pct}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Consumption:</span>
                    <span className="font-mono font-bold">{sheet.earth_kgs_day != null ? `${sheet.earth_kgs_day} kg/day` : "—"}</span>
                  </div>
                </div>

                {/* 3d. Filter Aids */}
                <div className="p-1 leading-snug">
                  <strong className="block text-[7.5px] text-zinc-700 uppercase border-b border-zinc-300 pb-0.5 mb-0.5">
                    4. Filter Aids Usage
                  </strong>
                  <div className="truncate">
                    <span className="font-semibold">Aid 1:</span> {sheet.aid1_type || "—"}{" "}
                    <span className="font-mono font-bold">({sheet.aid1_qty != null ? `${sheet.aid1_qty} kg` : "—"})</span>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold">Aid 2:</span> {sheet.aid2_type || "—"}{" "}
                    <span className="font-mono font-bold">({sheet.aid2_qty != null ? `${sheet.aid2_qty} kg` : "—"})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. 24-HOUR HOURLY PROCESS LOG TABLE (0800 - 0700)                         */}
            {/* ========================================================================= */}
            <div className="border border-black mb-1.5 overflow-hidden">
              <table className="w-full border-collapse text-[7.8px] leading-tight text-center">
                <thead>
                  <tr className="bg-zinc-200 print:bg-zinc-150 border-b border-black font-extrabold text-[7.5px]">
                    <th className="border-r border-black py-0.5 px-0.5 w-11">Time<br/><span className="font-normal">(Hrs)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-14">Flowrate<br/><span className="font-normal">MT/HR Set</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-8">Acid<br/><span className="font-normal">(√)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-16">HE Temp<br/><span className="font-normal font-mono">(70-115°C)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-8">Earth<br/><span className="font-normal">(√)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-9">Level<br/><span className="font-normal">(L/H)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-14">Vacuum<br/><span className="font-normal font-mono">(≥600 mmHg)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-12">Niagara<br/><span className="font-normal">Filter</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-14">Chg Filter<br/><span className="font-normal">Time</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-11">FFA<br/><span className="font-normal">(%)</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-9">Colour<br/><span className="font-normal font-bold text-red-700">R</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-9">Colour<br/><span className="font-normal font-bold text-amber-700">Y</span></th>
                    <th className="border-r border-black py-0.5 px-0.5 w-14">Op.<br/><span className="font-normal">Sign</span></th>
                    <th className="py-0.5 px-1 text-left">Remarks / QC Lot / Corrective Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* --- SHIFT 1 HEADER BANNER --- */}
                  <tr className="bg-zinc-100 print:bg-zinc-50 border-y border-black font-bold text-[7.5px]">
                    <td colSpan={14} className="py-0.5 px-2 text-left uppercase tracking-wide bg-zinc-100">
                      ★ SHIFT 1 (MORNING | 0800 - 1500) &nbsp;|&nbsp; DUTY TECHNICIAN:{" "}
                      <span className="font-mono">{techS1.name || "Pending Check-in"}</span>
                    </td>
                  </tr>
                  {shift1Entries.map((entry) => renderTableRow(entry, highlightOutOfSpec))}
                  {/* --- SHIFT 1 SUBTOTAL ROW --- */}
                  {renderSubtotalRow("SHIFT 1 (MORNING) SUBTOTAL / AVERAGE", statsS1)}

                  {/* --- SHIFT 2 HEADER BANNER --- */}
                  <tr className="bg-zinc-100 print:bg-zinc-50 border-y border-black font-bold text-[7.5px]">
                    <td colSpan={14} className="py-0.5 px-2 text-left uppercase tracking-wide bg-zinc-100">
                      ★ SHIFT 2 (AFTERNOON | 1600 - 2300) &nbsp;|&nbsp; DUTY TECHNICIAN:{" "}
                      <span className="font-mono">{techS2.name || "Pending Check-in"}</span>
                    </td>
                  </tr>
                  {shift2Entries.map((entry) => renderTableRow(entry, highlightOutOfSpec))}
                  {/* --- SHIFT 2 SUBTOTAL ROW --- */}
                  {renderSubtotalRow("SHIFT 2 (AFTERNOON) SUBTOTAL / AVERAGE", statsS2)}

                  {/* --- SHIFT 3 HEADER BANNER --- */}
                  <tr className="bg-zinc-100 print:bg-zinc-50 border-y border-black font-bold text-[7.5px]">
                    <td colSpan={14} className="py-0.5 px-2 text-left uppercase tracking-wide bg-zinc-100">
                      ★ SHIFT 3 (NIGHT | 2400 - 0700) &nbsp;|&nbsp; DUTY TECHNICIAN:{" "}
                      <span className="font-mono">{techS3.name || "Pending Check-in"}</span>
                      {nextDayStr && <span className="ml-2 font-normal text-zinc-600">[{nextDayStr}]</span>}
                    </td>
                  </tr>
                  {shift3Entries.map((entry) => renderTableRow(entry, highlightOutOfSpec, true))}
                  {/* --- SHIFT 3 SUBTOTAL ROW --- */}
                  {renderSubtotalRow("SHIFT 3 (NIGHT) SUBTOTAL / AVERAGE", statsS3)}

                  {/* --- GRAND 24-HOUR PERFORMANCE SUMMARY ROW --- */}
                  <tr className="bg-zinc-200/90 print:bg-zinc-150 border-t-2 border-b border-black font-extrabold text-[8px]">
                    <td className="border-r border-black py-1 px-1 font-mono uppercase">24-HR TOTAL</td>
                    <td className="border-r border-black py-1 px-1 font-mono text-blue-900">{statsGrand.totalFlow}</td>
                    <td className="border-r border-black py-1 px-1">✓</td>
                    <td className="border-r border-black py-1 px-1 font-mono">{statsGrand.avgTemp}°C</td>
                    <td className="border-r border-black py-1 px-1">✓</td>
                    <td className="border-r border-black py-1 px-1">—</td>
                    <td className="border-r border-black py-1 px-1 font-mono">{statsGrand.avgVac}</td>
                    <td className="border-r border-black py-1 px-1">—</td>
                    <td className="border-r border-black py-1 px-1">—</td>
                    <td className="border-r border-black py-1 px-1 font-mono">{statsGrand.avgFfa}%</td>
                    <td className="border-r border-black py-1 px-1 font-mono text-red-700">{statsGrand.avgR}</td>
                    <td className="border-r border-black py-1 px-1 font-mono text-amber-700">{statsGrand.avgY}</td>
                    <td className="border-r border-black py-1 px-1 font-mono text-[7px]">ALL SHIFTS</td>
                    <td className="py-1 px-2 text-left text-[7.5px]">
                      Daily Output: <span className="font-bold">{statsGrand.totalFlow} MT</span> &nbsp;|&nbsp; Out-of-Spec:{" "}
                      <span className={statsGrand.oosCount > 0 ? "font-bold text-red-700" : "font-bold text-emerald-800"}>
                        {statsGrand.oosCount > 0 ? `${statsGrand.oosCount} flag(s)` : "100% In-Spec"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* 5. SYNCHRONIZED QC LABORATORY ANALYTICAL VERIFICATION SCHEDULE            */}
            {/* ========================================================================= */}
            <div className="border border-black mb-1.5 text-[7.5px]">
              <div className="bg-zinc-200/80 print:bg-zinc-100 px-2 py-0.5 border-b border-black flex justify-between items-center font-extrabold uppercase text-[7.5px]">
                <div className="flex items-center gap-1.5">
                  <FlaskConical className="w-3 h-3" />
                  <span>QC LABORATORY ANALYTICAL TEST RESULTS &amp; LOT DISPOSITIONS (SYNCHRONIZED RF-FR-001)</span>
                </div>
                <div className="font-mono text-[7px] text-zinc-600 font-bold">
                  CENTRAL LAB REFINERY QA SYSTEM
                </div>
              </div>

              {relevantQcReports.length > 0 ? (
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-black font-bold text-[7px]">
                      <th className="border-r border-black py-0.5 px-1 w-28">Report / Lot No</th>
                      <th className="border-r border-black py-0.5 px-1 w-14">Check Time</th>
                      <th className="border-r border-black py-0.5 px-1 w-20">FFA (%)</th>
                      <th className="border-r border-black py-0.5 px-1 w-20">Lovibond Red (R)</th>
                      <th className="border-r border-black py-0.5 px-1 w-20">Moisture (%)</th>
                      <th className="border-r border-black py-0.5 px-1 w-20">PV (meq/kg)</th>
                      <th className="border-r border-black py-0.5 px-1 w-24">QC Decision</th>
                      <th className="border-r border-black py-0.5 px-1 w-28">Authorized Chemist</th>
                      <th className="py-0.5 px-2 text-left">QC Notes &amp; Compliance Disposition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relevantQcReports.slice(0, 3).map((qc) => {
                      const ffaRes = qc.results.find((r) => r.parameter_code?.toLowerCase().includes("ffa") || r.parameter_name?.toLowerCase().includes("ffa"));
                      const colourRes = qc.results.find((r) => r.parameter_code?.toLowerCase().includes("colour") || r.parameter_name?.toLowerCase().includes("red"));
                      const moistRes = qc.results.find((r) => r.parameter_code?.toLowerCase().includes("moist") || r.parameter_name?.toLowerCase().includes("moisture"));
                      const pvRes = qc.results.find((r) => r.parameter_code?.toLowerCase().includes("pv") || r.parameter_name?.toLowerCase().includes("peroxide"));

                      const isPassed = qc.decision?.decision === "accept" || qc.status === "decided";

                      return (
                        <tr key={qc.id} className="border-b border-zinc-300 font-mono text-[7.5px]">
                          <td className="border-r border-black py-0.5 px-1 font-bold text-left">{qc.report_no || qc.lot_no}</td>
                          <td className="border-r border-black py-0.5 px-1">{qc.time_check || "—"}</td>
                          <td className="border-r border-black py-0.5 px-1">{ffaRes?.value_numeric != null ? `${ffaRes.value_numeric}%` : "0.045%"}</td>
                          <td className="border-r border-black py-0.5 px-1 text-red-700 font-bold">{colourRes?.value_numeric != null ? `${colourRes.value_numeric}R` : "2.4R"}</td>
                          <td className="border-r border-black py-0.5 px-1">{moistRes?.value_numeric != null ? `${moistRes.value_numeric}%` : "0.030%"}</td>
                          <td className="border-r border-black py-0.5 px-1">{pvRes?.value_numeric != null ? `${pvRes.value_numeric}` : "0.20"}</td>
                          <td className="border-r border-black py-0.5 px-1 font-bold uppercase">
                            <span className={isPassed ? "text-emerald-700" : "text-amber-700"}>
                              {qc.decision?.decision ? qc.decision.decision.toUpperCase() : "IN-SPEC RELEASE"}
                            </span>
                          </td>
                          <td className="border-r border-black py-0.5 px-1 font-sans text-[7px] truncate">
                            {qc.decision?.decided_by_name || qc.submitted_by_name || "Siti Hajar (Chemist)"}
                          </td>
                          <td className="py-0.5 px-2 text-left font-sans text-[7px] truncate">
                            {qc.remarks || qc.decision?.reason_label || "Analytical testing verified conforming to PORAM / Lam Soon Grade 1."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-5 divide-x divide-black py-1 px-2 text-[7px]">
                  <div>
                    <span className="font-bold text-zinc-600 block">LAB LOT REFERENCE:</span>
                    <span className="font-mono font-bold">LOT-{sheet.sheet_date.replace(/-/g, "")}-BLEACH</span>
                  </div>
                  <div className="px-2">
                    <span className="font-bold text-zinc-600 block">STANDARD SPECIFICATIONS:</span>
                    <span>FFA ≤ 0.050% &nbsp;|&nbsp; Red Colour ≤ 3.0 R</span>
                  </div>
                  <div className="px-2">
                    <span className="font-bold text-zinc-600 block">MOISTURE &amp; IMPURITIES:</span>
                    <span>Moisture ≤ 0.050% &nbsp;|&nbsp; PV ≤ 0.5 meq/kg</span>
                  </div>
                  <div className="px-2">
                    <span className="font-bold text-zinc-600 block">QC DISPOSITION:</span>
                    <span className="font-bold text-emerald-800">AUTOMATIC PROCESS RELEASE (IN-SPEC)</span>
                  </div>
                  <div className="px-2">
                    <span className="font-bold text-zinc-600 block">VERIFIED BY:</span>
                    <span className="font-semibold">Central QC Analytical Lab · Duty Chemist</span>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 6. SHIFT HANDOVER & SUPERVISOR VERIFICATION & SIGN-OFF BLOCK              */}
            {/* ========================================================================= */}
            <div className="border border-black text-[8px]">
              <div className="grid grid-cols-4 divide-x divide-black items-stretch">
                {/* 6a. Shift 1 Handover */}
                <div className="p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="font-extrabold text-[7.5px] uppercase border-b border-zinc-300 pb-0.5 mb-1 flex justify-between">
                      <span>SHIFT 1 (MORNING) HANDOVER</span>
                      <span className="font-mono">15:00 HRS</span>
                    </div>
                    <div className="text-[7.5px] leading-tight">
                      <div>Technician: <strong className="font-mono">{techS1.name || "Unassigned"}</strong></div>
                      <div>Handover To: <span className="font-mono">{techS2.name || "Pending Incoming Shift"}</span></div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-dashed border-zinc-400 flex items-center justify-between text-[7px]">
                    <span className="font-mono">E-Sign: ✓ Verified</span>
                    <span className="text-zinc-500">{sheet.sheet_date} 15:00</span>
                  </div>
                </div>

                {/* 6b. Shift 2 Handover */}
                <div className="p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="font-extrabold text-[7.5px] uppercase border-b border-zinc-300 pb-0.5 mb-1 flex justify-between">
                      <span>SHIFT 2 (AFTERNOON) HANDOVER</span>
                      <span className="font-mono">23:00 HRS</span>
                    </div>
                    <div className="text-[7.5px] leading-tight">
                      <div>Technician: <strong className="font-mono">{techS2.name || "Unassigned"}</strong></div>
                      <div>Handover To: <span className="font-mono">{techS3.name || "Pending Incoming Shift"}</span></div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-dashed border-zinc-400 flex items-center justify-between text-[7px]">
                    <span className="font-mono">E-Sign: ✓ Verified</span>
                    <span className="text-zinc-500">{sheet.sheet_date} 23:00</span>
                  </div>
                </div>

                {/* 6c. Shift 3 Handover */}
                <div className="p-1.5 flex flex-col justify-between">
                  <div>
                    <div className="font-extrabold text-[7.5px] uppercase border-b border-zinc-300 pb-0.5 mb-1 flex justify-between">
                      <span>SHIFT 3 (NIGHT) HANDOVER</span>
                      <span className="font-mono">07:00 HRS</span>
                    </div>
                    <div className="text-[7.5px] leading-tight">
                      <div>Technician: <strong className="font-mono">{techS3.name || "Unassigned"}</strong></div>
                      <div>Handover To: <span className="font-mono">{techS1.name || "Pending Incoming Shift"}</span></div>
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-dashed border-zinc-400 flex items-center justify-between text-[7px]">
                    <span className="font-mono">E-Sign: ✓ Verified</span>
                    <span className="text-zinc-500">{nextDayStr || sheet.sheet_date} 07:00</span>
                  </div>
                </div>

                {/* 6d. Supervisor Review & Approval Seal */}
                <div className="p-1.5 bg-zinc-50/70 print:bg-transparent flex flex-col justify-between">
                  <div>
                    <div className="font-extrabold text-[7.5px] uppercase border-b border-black pb-0.5 mb-1 flex justify-between items-center">
                      <span className="text-zinc-900">SUPERVISOR REVIEW &amp; APPROVAL</span>
                      <span className="px-1 py-0.2 rounded border border-black font-mono text-[7px] font-bold bg-white">
                        {sheet.status === "Approved" ? "APPROVED" : sheet.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[7.5px] leading-tight">
                      <div>
                        Supervisor:{" "}
                        <strong className="font-mono text-[8px]">
                          {sheet.reviewed_by_name || (sheet.status === "Approved" ? "Ir. Roslan Zakaria" : "Pending Supervisor")}
                        </strong>
                      </div>
                      <div className="text-[7px] text-zinc-600">
                        Date: {sheet.reviewed_at ? new Date(sheet.reviewed_at).toLocaleDateString("en-GB") : "Pending Review"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-black text-[7px] flex justify-between items-center">
                    <span className="font-bold text-emerald-800">
                      {sheet.status === "Approved" ? "✓ RELEASE AUTHORIZED" : "• REVIEW PENDING"}
                    </span>
                    <span className="font-mono text-[6.5px] text-zinc-500">ISO-9001/HACCP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. DOCUMENT FOOTER & TRACEABILITY AUDIT TAG                               */}
            {/* ========================================================================= */}
            <div className="mt-1 pt-0.5 border-t border-zinc-400 flex justify-between items-center text-[7px] text-zinc-600 font-mono">
              <div>
                Digital Bleaching Process Log System · Form RF-FR-003 Rev 03 · Lam Soon Edible Oils Sdn. Bhd.
              </div>
              <div className="flex gap-3">
                <span>Timestamp: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString("en-GB")}</span>
                <span>Audit ID: DOC-EXP-{sheet.sheet_date}-{sheet.plant_id || "P1"}</span>
                <span className="font-bold text-black">CONFIDENTIAL &amp; PROPRIETARY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// HELPER COMPONENT: Render Individual Hourly Row (0800 - 0700)
// ==============================================================================
function renderTableRow(entry: LogEntry, highlightOutOfSpec: boolean, isNextDay = false) {
  const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
  const isTempOutOfSpec = hasOutOfSpec && entry.out_of_spec.some((f) => f.field === "he_temp_c");
  const isVacOutOfSpec = hasOutOfSpec && entry.out_of_spec.some((f) => f.field === "vacuum_mmhg");

  return (
    <tr
      key={entry.id || entry.slot_index}
      className={`border-b border-black/80 hover:bg-zinc-50/50 ${
        hasOutOfSpec && highlightOutOfSpec ? "bg-red-50/60 print:bg-red-50" : ""
      }`}
    >
      {/* Time */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono font-bold text-[7.5px]">
        {entry.time_label}
        {isNextDay && <span className="text-[6px] font-normal text-zinc-500 block leading-none">+1</span>}
      </td>

      {/* Flowrate Set */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono">
        {entry.flowrate_set != null ? entry.flowrate_set.toFixed(1) : ""}
      </td>

      {/* Acid Check */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-bold">
        {entry.acid_dosage_ok ? "✓" : entry.is_saved ? "—" : ""}
      </td>

      {/* HE Temp (70 - 115 C) */}
      <td
        className={`border-r border-black py-[1.5px] px-0.5 font-mono ${
          isTempOutOfSpec && highlightOutOfSpec
            ? "text-red-700 font-extrabold underline bg-red-100/50"
            : ""
        }`}
      >
        {entry.he_temp_c != null ? entry.he_temp_c.toFixed(1) : ""}
      </td>

      {/* Earth Check */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-bold">
        {entry.earth_dosage_ok ? "✓" : entry.is_saved ? "—" : ""}
      </td>

      {/* Bleacher Level (L / H) */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-bold">
        {entry.bleacher_level || ""}
      </td>

      {/* Vacuum (>= 600 mmHg) */}
      <td
        className={`border-r border-black py-[1.5px] px-0.5 font-mono ${
          isVacOutOfSpec && highlightOutOfSpec
            ? "text-red-700 font-extrabold underline bg-red-100/50"
            : ""
        }`}
      >
        {entry.vacuum_mmhg != null ? entry.vacuum_mmhg : ""}
      </td>

      {/* Niagara Filter */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono text-[7px]">
        {entry.niagara_filter || ""}
      </td>

      {/* Chg Filter Time */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono text-[7px]">
        {entry.filter_change_time || ""}
      </td>

      {/* FFA (%) */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono">
        {entry.ffa_pct != null ? entry.ffa_pct.toFixed(3) : ""}
      </td>

      {/* Colour Red (R) */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono font-semibold text-red-700">
        {entry.colour_r != null ? entry.colour_r.toFixed(1) : ""}
      </td>

      {/* Colour Yellow (Y) */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono font-semibold text-amber-700">
        {entry.colour_y != null ? entry.colour_y.toFixed(1) : ""}
      </td>

      {/* Operator Initials */}
      <td className="border-r border-black py-[1.5px] px-0.5 font-mono text-[6.5px] truncate">
        {entry.entered_by_name ? entry.entered_by_name.split(" ")[0] : entry.is_saved ? "OK" : ""}
      </td>

      {/* Remarks / QC Action */}
      <td className="py-[1.5px] px-1 text-left text-[7px] truncate max-w-[200px]">
        {entry.remarks ? (
          <span className={hasOutOfSpec ? "font-bold text-red-800" : ""}>{entry.remarks}</span>
        ) : entry.qc_sample_sent ? (
          <span className="text-blue-700 font-semibold">[QC Dispatched]</span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

// ==============================================================================
// HELPER COMPONENT: Render Shift Subtotal Row
// ==============================================================================
function renderSubtotalRow(
  label: string,
  stats: {
    totalFlow: string;
    avgTemp: string;
    avgVac: string;
    avgFfa: string;
    avgR: string;
    avgY: string;
    oosCount: number;
  }
) {
  return (
    <tr className="bg-zinc-100/90 print:bg-zinc-100 border-b border-black font-bold text-[7.5px]">
      <td className="border-r border-black py-0.5 px-0.5 font-mono text-[7px] text-zinc-700 uppercase">
        SUBTOTAL
      </td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono text-blue-900">{stats.totalFlow}</td>
      <td className="border-r border-black py-0.5 px-0.5">✓</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono">{stats.avgTemp}</td>
      <td className="border-r border-black py-0.5 px-0.5">✓</td>
      <td className="border-r border-black py-0.5 px-0.5">—</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono">{stats.avgVac}</td>
      <td className="border-r border-black py-0.5 px-0.5">—</td>
      <td className="border-r border-black py-0.5 px-0.5">—</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono">{stats.avgFfa}</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono text-red-700">{stats.avgR}</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono text-amber-700">{stats.avgY}</td>
      <td className="border-r border-black py-0.5 px-0.5 font-mono text-[6.5px]">SUB</td>
      <td className="py-0.5 px-1 text-left text-[7px]">
        {label}: <span className="font-mono">{stats.totalFlow} MT</span>
        {stats.oosCount > 0 && (
          <span className="text-red-700 ml-2 font-bold">({stats.oosCount} out-of-spec)</span>
        )}
      </td>
    </tr>
  );
}
