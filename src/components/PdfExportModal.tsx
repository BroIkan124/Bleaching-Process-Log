"use client";

import React, { useState } from "react";
import { LogSheet } from "@/types";
import { FORM_META } from "@/lib/constants";
import { Printer, Download, X, Building2, CheckCircle2 } from "lucide-react";
import { recordDocumentExport } from "@/lib/dbService";

interface PdfExportModalProps {
  sheet: LogSheet;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  sheet,
  isOpen,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

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
      "Bleaching Process Log Sheet (RF-FR-003)",
      "RF-FR-003",
      "Form",
      null,
      {
        sheet_date: sheet.sheet_date,
        plant: sheet.plant_name || sheet.plant_id,
        product: sheet.product_name || sheet.product_id,
        status: sheet.status,
      }
    );
    window.print();
  };

  return (
    <div 
      className={`modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200 overflow-y-auto ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`modal-card-animate w-full max-w-6xl bg-white dark:bg-[#0A0F1C] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6),0_12px_36px_rgba(0,0,0,0.4)] border border-zinc-200/90 dark:border-white/10 flex flex-col my-auto max-h-[95vh] overflow-hidden [transform-style:preserve-3d] ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Modal Controls Bar with 3D Specular Highlight (Hidden during Print) */}
        <div className="px-6 py-3.5 border-b border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-display">
              A4 Landscape Official Print &amp; PDF Export (RF-FR-003 Rev 03)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn-premium-amber px-4 py-2 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer group"
            >
              <Printer className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={handleSmoothClose}
              className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group transition-all"
            >
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* The Printable A4 Sheet Body */}
        <div className="p-8 overflow-y-auto bg-white text-black font-sans print:p-0 print:m-0 print:overflow-visible">
          {/* Company & Form Header Block */}
          <div className="border-2 border-black p-3 mb-2">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-bold font-display text-lg">
                  LS
                </div>
                <div>
                  <h1 className="font-bold text-base tracking-wider uppercase">
                    {FORM_META.company}
                  </h1>
                  <h2 className="text-xs font-semibold text-gray-700 uppercase">
                    {FORM_META.department}
                  </h2>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-extrabold text-base uppercase tracking-wide px-4 py-1 border border-black inline-block">
                  {FORM_META.title}
                </h3>
              </div>

              <div className="text-right text-xs font-mono">
                <div><strong>Form No:</strong> {sheet.form_no}</div>
                <div><strong>Rev No:</strong> {sheet.form_rev}</div>
                <div><strong>Date:</strong> {sheet.sheet_date}</div>
              </div>
            </div>

            {/* Header Master Data Grid */}
            <div className="grid grid-cols-4 gap-2 text-xs border-b border-gray-400 pb-2 mb-2">
              <div>
                <span className="font-bold">Plant: </span>
                <span>{sheet.plant_name || "Plant 1"}</span>
              </div>
              <div>
                <span className="font-bold">Product: </span>
                <span>{sheet.product_name || "RBD Palm Oil"}</span>
              </div>
              <div>
                <span className="font-bold">Feed Tank: </span>
                <span>{sheet.feed_tank_name || "TK-101"}</span>
              </div>
              <div>
                <span className="font-bold">Discharge Tank: </span>
                <span>{sheet.discharge_tank_name || "TK-201"}</span>
              </div>
            </div>

            {/* Technician Shift Assignments */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-800">
              <div>
                <strong>Tech 1st Shift (0800-1500): </strong>
                <span>{sheet.tech_s1_name || "Ahmad Razif"}</span>
              </div>
              <div>
                <strong>Tech 2nd Shift (1600-2300): </strong>
                <span>{sheet.tech_s2_name || "Mohd Danial"}</span>
              </div>
              <div>
                <strong>Tech 3rd Shift (2400-0700): </strong>
                <span>{sheet.tech_s3_name || "K. Subramaniam"}</span>
              </div>
            </div>
          </div>

          {/* Operating Parameters Block */}
          <div className="border border-black p-2 mb-2 text-xs">
            <div className="grid grid-cols-4 gap-2 divide-x divide-gray-300">
              <div className="px-1">
                <strong className="block text-xs text-gray-600 uppercase">Input Flowrate</strong>
                <div>MT/HR: <span className="font-mono font-bold">{sheet.input_mt_hr ?? '-'}</span></div>
                <div>MT/DAY: <span className="font-mono font-bold">{sheet.input_mt_day ?? '-'}</span></div>
              </div>
              <div className="px-2">
                <strong className="block text-xs text-gray-600 uppercase">Degumming Acid ({sheet.acid_type})</strong>
                <div>Mm: <span className="font-mono font-bold">{sheet.acid_mm ?? '-'}</span> | Cm/Hr: <span className="font-mono font-bold">{sheet.acid_cm_hr ?? '-'}</span></div>
                <div>%: <span className="font-mono font-bold">{sheet.acid_pct ?? '-'}%</span></div>
              </div>
              <div className="px-2">
                <strong className="block text-xs text-gray-600 uppercase">Bleaching Earth ({sheet.earth_type || 'Standard'})</strong>
                <div>Setting: <span className="font-mono font-bold">{sheet.earth_setting ?? '-'}</span> | Min %: <span className="font-mono font-bold">{sheet.earth_min_pct ?? '-'}</span></div>
                <div>Kgs/Day: <span className="font-mono font-bold">{sheet.earth_kgs_day ?? '-'}</span></div>
              </div>
              <div className="px-2">
                <strong className="block text-xs text-gray-600 uppercase">Filter Aids</strong>
                <div>1: {sheet.aid1_type || '-'} ({sheet.aid1_qty ?? '-'} kg)</div>
                <div>2: {sheet.aid2_type || '-'} ({sheet.aid2_qty ?? '-'} kg)</div>
              </div>
            </div>
          </div>

          {/* 24-Hour Process Grid Table */}
          <table className="w-full border-2 border-black border-collapse text-xs text-center mb-3">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-bold">
                <th className="border border-black py-1 px-1">Time<br/>(Hrs)</th>
                <th className="border border-black py-1 px-1">Flowrate<br/>MT/HR</th>
                <th className="border border-black py-1 px-1">Acid<br/>(√)</th>
                <th className="border border-black py-1 px-1">HE Temp<br/>(70-115°C)</th>
                <th className="border border-black py-1 px-1">Earth<br/>(√)</th>
                <th className="border border-black py-1 px-1">Level<br/>(L/H)</th>
                <th className="border border-black py-1 px-1">Vacuum<br/>(&ge;600)</th>
                <th className="border border-black py-1 px-1">Niagara<br/>Filter</th>
                <th className="border border-black py-1 px-1">Chg Filter<br/>Time</th>
                <th className="border border-black py-1 px-1">FFA<br/>(%)</th>
                <th className="border border-black py-1 px-1" colSpan={2}>Colour<br/>R / Y</th>
                <th className="border border-black py-1 px-2 text-left w-64">Remarks / Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              {sheet.entries.map((entry) => {
                const hasOutOfSpec = entry.out_of_spec && entry.out_of_spec.length > 0;
                return (
                  <tr key={entry.id} className={`border-b border-black ${hasOutOfSpec ? 'bg-red-50 font-bold' : ''}`}>
                    <td className="border border-black py-0.5 font-mono font-bold">{entry.time_label}</td>
                    <td className="border border-black py-0.5 font-mono">{entry.flowrate_set ?? ''}</td>
                    <td className="border border-black py-0.5">{entry.acid_dosage_ok ? '√' : ''}</td>
                    <td className={`border border-black py-0.5 font-mono ${hasOutOfSpec && entry.out_of_spec.some(f=>f.field==='he_temp_c') ? 'text-red-700 underline font-extrabold' : ''}`}>
                      {entry.he_temp_c ?? ''}
                    </td>
                    <td className="border border-black py-0.5">{entry.earth_dosage_ok ? '√' : ''}</td>
                    <td className="border border-black py-0.5">{entry.bleacher_level ?? ''}</td>
                    <td className={`border border-black py-0.5 font-mono ${hasOutOfSpec && entry.out_of_spec.some(f=>f.field==='vacuum_mmhg') ? 'text-red-700 underline font-extrabold' : ''}`}>
                      {entry.vacuum_mmhg ?? ''}
                    </td>
                    <td className="border border-black py-0.5 font-mono">{entry.niagara_filter ?? ''}</td>
                    <td className="border border-black py-0.5 font-mono">{entry.filter_change_time ?? ''}</td>
                    <td className="border border-black py-0.5 font-mono">{entry.ffa_pct ?? ''}</td>
                    <td className="border border-black py-0.5 font-mono">{entry.colour_r ?? ''}</td>
                    <td className="border border-black py-0.5 font-mono">{entry.colour_y ?? ''}</td>
                    <td className="border border-black py-0.5 text-left px-1 font-mono text-xs truncate">
                      {entry.remarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Supervisor Approval Stamp & Signatures */}
          <div className="border border-black p-2 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold">Sheet Status: </span>
              <span className="uppercase font-semibold">{sheet.status}</span>
            </div>

            <div className="flex gap-8">
              <div>
                <span className="font-bold">Reviewed / Approved By: </span>
                <span className="underline font-mono">{sheet.reviewed_by_name || (sheet.status === 'Approved' ? 'Ir. Roslan Zakaria (Supervisor)' : 'Pending Review')}</span>
              </div>
              <div>
                <span className="font-bold">Approval Date: </span>
                <span className="font-mono">{sheet.reviewed_at ? new Date(sheet.reviewed_at).toLocaleDateString() : '-'}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-mono">
              E-Verified System RF-FR-003 Rev 03
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
