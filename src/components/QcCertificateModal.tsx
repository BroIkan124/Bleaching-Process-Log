"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SampleReport, SampleResult, UserProfile } from "@/types";
import { Printer, X } from "lucide-react";

interface QcCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SampleReport | null;
  currentUser?: UserProfile;
}

export const QcCertificateModal: React.FC<QcCertificateModalProps> = ({
  isOpen,
  onClose,
  report,
  currentUser,
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

  if (!isOpen || !report || !mounted) return null;

  const isParamTested = (res: SampleResult): boolean => {
    if (res.is_tested !== undefined) return Boolean(res.is_tested);
    return res.value_numeric !== null && res.value_numeric !== undefined;
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto modal-backdrop-animate ${
        isClosing ? "is-closing" : ""
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div 
        className={`w-full max-w-4xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-300 dark:border-white/10 flex flex-col my-auto max-h-[95vh] overflow-hidden modal-card-animate ${
          isClosing ? "is-closing" : ""
        }`}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/40 flex items-center justify-between print:hidden">
          <span className="font-bold text-sm text-zinc-900 dark:text-white font-display">
            Official QC Laboratory Analysis Certificate (RF-FR-001)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-tactile px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer group"
            >
              <Printer className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Print Certificate</span>
            </button>
            <button 
              type="button"
              onClick={handleSmoothClose} 
              className="btn-tactile text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg cursor-pointer group"
            >
              <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Print CSS Rules for Exact A4 Portrait Output */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body * {
              visibility: hidden !important;
            }
            #official-rf-fr-001-print-area, #official-rf-fr-001-print-area * {
              visibility: visible !important;
            }
            #official-rf-fr-001-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-zinc-100/70 dark:bg-black/40 text-black font-sans print:p-0 print:bg-white">
          <div 
            id="official-rf-fr-001-print-area"
            className="max-w-3xl mx-auto bg-white border-2 border-black p-6 sm:p-8 space-y-4 shadow-lg print:shadow-none print:border-2 print:p-6"
          >
            {/* 1. Official Header with Lam Soon Logo Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-4 gap-4">
              <div className="flex items-center gap-3.5">
                {/* Lam Soon Official Logo Badge */}
                <div className="w-14 h-14 rounded-xl bg-white border border-black/20 p-1 flex items-center justify-center shrink-0 shadow-2xs print:border-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lamsoon-logo.png"
                    alt="Lam Soon Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
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
                    Quality Control Department · Refinery Testing Laboratory
                  </h2>
                  <div className="text-[9.5px] font-mono text-gray-600 uppercase">
                    Pasir Gudang Industrial Estate · Johor, Malaysia
                  </div>
                </div>
              </div>

              {/* Document Control Box */}
              <div className="text-left sm:text-right font-mono text-xs border border-black p-2 bg-gray-50 print:bg-transparent rounded self-stretch sm:self-auto shrink-0">
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Form:</strong> <span className="font-bold">RF-FR-001 Rev 02</span>
                </div>
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Cert No:</strong> <span className="font-bold text-black">{report.report_no}</span>
                </div>
                <div className="text-[10.5px]">
                  <strong className="text-gray-600 uppercase text-[9.5px]">Date:</strong> <span className="font-bold">{report.sample_date}</span>
                </div>
              </div>
            </div>

            {/* 2. Certificate Title */}
            <div className="text-center py-1 border-b border-black/30">
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-widest text-black">
                CERTIFICATE OF ANALYSIS (COA)
              </h3>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Bleaching Process Quality Control Laboratory Analysis Report
              </div>
            </div>

            {/* 3. Sample Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-lg bg-gray-50 border border-black/80 text-xs print:bg-white print:border-black">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Product Name</span>
                <span className="font-bold text-sm text-black">{report.product_name || "RBD Palm Oil"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Sampling Time</span>
                <span className="font-mono font-semibold text-black">{report.time_check} Hrs</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Sampling Location</span>
                <span className="font-medium text-black">{report.sampling_point_name || "Deodorizer / Bleacher Outlet (SP-01)"}</span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Batch / Lot Number</span>
                <span className="font-mono text-xs font-semibold text-black break-all">{report.lot_no || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Feed Tank (Source)</span>
                <span className="font-mono font-bold text-black">{report.feed_tank_code || "TK-101 (Crude Feed)"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Discharge Tank (Destination)</span>
                <span className="font-mono font-bold text-black">{report.discharge_tank_code || "TK-201 (Bleached Oil)"}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Process Standard</span>
                <span className="font-medium text-black">Nisshin Bleaching Line 1</span>
              </div>
            </div>

            {/* 4. Results Table (Form RF-FR-001) */}
            <table className="w-full border-collapse border border-black text-xs text-center my-3">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-bold">
                  <th className="border border-black py-2 px-2 w-16 text-center uppercase tracking-wider text-[10px]">Req (✓)</th>
                  <th className="border border-black py-2 px-3 text-left uppercase tracking-wider text-[10px]">Test Parameter</th>
                  <th className="border border-black py-2 px-2 w-20 uppercase tracking-wider text-[10px]">Unit</th>
                  <th className="border border-black py-2 px-3 w-28 text-right uppercase tracking-wider text-[10px]">Result</th>
                  <th className="border border-black py-2 px-3 w-44 uppercase tracking-wider text-[10px]">Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                {report.results?.map((res, i) => {
                  const tested = isParamTested(res);
                  const isPass = res.in_spec !== false;
                  return (
                    <tr key={i} className={`border-b border-gray-300 ${!tested ? "bg-gray-50/60 text-gray-400" : i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="border border-black py-1.5 px-2 font-mono font-bold text-center">
                        {tested ? <span className="text-black font-extrabold text-sm">✓</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-left font-semibold text-black">
                        {res.parameter_name}
                      </td>
                      <td className="border border-black py-1.5 px-2 font-mono text-gray-700">{res.unit || "—"}</td>
                      <td className="border border-black py-1.5 px-3 text-right font-mono font-bold text-black text-xs">
                        {tested && res.value_numeric !== null ? res.value_numeric : "—"}
                      </td>
                      <td className="border border-black py-1.5 px-3 font-bold text-xs">
                        {tested ? (
                          isPass ? (
                            <span className="text-emerald-800 uppercase tracking-tight">PASS (IN SPEC)</span>
                          ) : (
                            <span className="text-rose-800 uppercase tracking-tight">OUT OF SPEC</span>
                          )
                        ) : (
                          <span className="text-gray-500 font-normal italic">NOT TESTED (N/A)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 5. Final Decision and Signatures Endorsement */}
            <div className="border-2 border-black p-4 text-xs mt-4 bg-gray-50/50 print:bg-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Quality Disposition Stamp */}
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">QC Disposition</span>
                  <div className={`mt-1 font-mono font-extrabold uppercase px-3 py-1.5 border-2 inline-flex items-center gap-1.5 rounded ${
                    report.decision?.decision === "accept" || report.decision?.decision === "accept_concession"
                      ? "border-emerald-700 text-emerald-900 bg-emerald-50 print:bg-transparent"
                      : report.decision?.decision === "reject"
                        ? "border-rose-700 text-rose-900 bg-rose-50 print:bg-transparent"
                        : "border-amber-700 text-amber-900 bg-amber-50 print:bg-transparent"
                  }`}>
                    <span>STATUS:</span>
                    <span>
                      {report.decision?.decision === "accept" || report.decision?.decision === "accept_concession"
                        ? "RELEASED / ACCEPT"
                        : report.decision?.decision === "reject"
                          ? "REJECTED (HOLD)"
                          : "PENDING QC"}
                    </span>
                  </div>
                </div>

                {/* Authorized By */}
                <div className="text-left">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Authorized By (QC Chemist / Supervisor)</span>
                  <div className="font-mono font-bold text-black mt-1 text-sm underline decoration-gray-400">
                    {report.decision?.decided_by_name || currentUser?.name || "Ahmad Razif"}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    ID: {currentUser?.id || "USR-QC-01"} · Refinery QA/QC
                  </div>
                </div>

                {/* Date Verified */}
                <div className="text-left sm:text-right">
                  <span className="text-[9.5px] uppercase font-bold text-gray-600 block">Date & Stamp Verification</span>
                  <div className="font-mono font-bold text-black mt-1">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase mt-0.5">
                    Official Record · ISO 9001:2015 Compliant
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="border-t border-gray-300 mt-3 pt-2 text-[9px] text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-1 font-mono">
                <span>Lam Soon Edible Oils Sdn. Bhd. · Quality Assurance Record (RF-FR-001)</span>
                <span>System Generated from Bleaching Process Log</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
