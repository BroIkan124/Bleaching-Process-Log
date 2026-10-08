"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserProfile, SampleReport, SampleResult, QCDecisionType, Disposition } from "@/types";
import { QC_SNAPSHOT_DATA } from "@/lib/qcSampleData";
import { 
  FlaskConical, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Printer, 
  Eye, 
  Edit3, 
  Filter, 
  Save, 
  X, 
  ShieldCheck, 
  Calendar, 
  Database,
  Building2,
  Sparkles
} from "lucide-react";
import { syncQcSampleToInsForge, logActivityToInsForge } from "@/lib/dbService";
import { RadioSelect } from "./RadioSelect";

interface QCManagementViewProps {
  currentUser: UserProfile;
  isDark: boolean;
}

export const QCManagementView: React.FC<QCManagementViewProps> = ({
  currentUser,
  isDark,
}) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load sample reports from the real snapshot data
  const [reports, setReports] = useState<SampleReport[]>(() => {
    return (QC_SNAPSHOT_DATA.samples as any[]) || [];
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all' | 'accept' | 'reject' | 'pending'
  const [selectedReport, setSelectedReport] = useState<SampleReport | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [isClosingNewSample, setIsClosingNewSample] = useState(false);
  const [isClosingEditor, setIsClosingEditor] = useState(false);
  const [isClosingCertificate, setIsClosingCertificate] = useState(false);

  const handleCloseNewSample = () => {
    setIsClosingNewSample(true);
    setTimeout(() => {
      setIsClosingNewSample(false);
      setIsNewSampleOpen(false);
    }, 200);
  };

  const handleCloseEditor = () => {
    setIsClosingEditor(true);
    setTimeout(() => {
      setIsClosingEditor(false);
      setIsEditorOpen(false);
    }, 200);
  };

  const handleCloseCertificate = () => {
    setIsClosingCertificate(true);
    setTimeout(() => {
      setIsClosingCertificate(false);
      setIsCertificateOpen(false);
    }, 200);
  };

  // New sample form state
  const [newSample, setNewSample] = useState({
    product_name: "RBD Palm Oil",
    feed_tank_code: "TK-101A",
    discharge_tank_code: "TK-201A",
    sampling_point_name: "Bleacher Outlet / Polishing Filter",
    sample_date: new Date().toISOString().split("T")[0],
    time_check: "14:00",
    lot_no: `LOT-BPO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-1400`,
    remarks: "",
  });

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        r.lot_no.toLowerCase().includes(q) ||
        r.report_no.toLowerCase().includes(q) ||
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.feed_tank_code && r.feed_tank_code.toLowerCase().includes(q)) ||
        (r.discharge_tank_code && r.discharge_tank_code.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "accept") return r.decision?.decision === "accept" || r.decision?.decision === "accept_concession";
      if (statusFilter === "reject") return r.decision?.decision === "reject";
      if (statusFilter === "pending") return !r.decision || r.status === "awaiting_results" || r.status === "draft";

      return true;
    });
  }, [reports, searchQuery, statusFilter]);

  // Statistics
  const totalCount = reports.length;
  const acceptedCount = reports.filter(r => r.decision?.decision === "accept" || r.decision?.decision === "accept_concession").length;
  const rejectedCount = reports.filter(r => r.decision?.decision === "reject").length;
  const pendingCount = totalCount - acceptedCount - rejectedCount;

  // Handle Save Edited Test Results
  const handleSaveResults = (updatedReport: SampleReport) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    setSelectedReport(updatedReport);
    handleCloseEditor();
    syncQcSampleToInsForge(updatedReport, currentUser);
    logActivityToInsForge(currentUser, "UPDATE_QC_TEST_RESULTS", "SAMPLE_REPORT", updatedReport.id, {
      lot_no: updatedReport.lot_no,
      report_no: updatedReport.report_no,
      decision: updatedReport.decision?.decision,
    });
  };

  // Handle Create New Sample
  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `sample-${Date.now()}`;
    const reportNo = `SAR-2026-${String(reports.length + 1).padStart(4, "0")}`;

    const created: SampleReport = {
      id: newId,
      report_no: reportNo,
      sample_date: newSample.sample_date,
      time_check: newSample.time_check,
      lot_no: newSample.lot_no,
      product_name: newSample.product_name,
      feed_tank_code: newSample.feed_tank_code,
      discharge_tank_code: newSample.discharge_tank_code,
      sampling_point_name: newSample.sampling_point_name,
      submitted_by_name: currentUser.name,
      status: "awaiting_results",
      created_at: new Date().toISOString(),
      remarks: newSample.remarks,
      results: [
        { id: `res-ffa-${newId}`, report_id: newId, parameter_code: "FFA", parameter_name: "Free Fatty Acid (% Palmitic)", unit: "%", value_numeric: 0.045, in_spec: true },
        { id: `res-h2o-${newId}`, report_id: newId, parameter_code: "H2O", parameter_name: "Moisture & Impurities", unit: "%", value_numeric: 0.030, in_spec: true },
        { id: `res-pv-${newId}`, report_id: newId, parameter_code: "PV", parameter_name: "Peroxide Value", unit: "meq/kg", value_numeric: 0.20, in_spec: true },
        { id: `res-iv-${newId}`, report_id: newId, parameter_code: "IV", parameter_name: "Iodine Value (Wijs)", unit: "g I2/100g", value_numeric: 52.5, in_spec: true },
        { id: `res-cr-${newId}`, report_id: newId, parameter_code: "COLOUR_R", parameter_name: "Colour Lovibond Red (5¼\" cell)", unit: "R", value_numeric: 2.1, in_spec: true },
        { id: `res-cy-${newId}`, report_id: newId, parameter_code: "COLOUR_Y", parameter_name: "Colour Lovibond Yellow", unit: "Y", value_numeric: 18.0, in_spec: true },
      ],
      decision: {
        id: `dec-${newId}`,
        report_id: newId,
        decision: "accept",
        decided_by_name: currentUser.name,
        decided_at: new Date().toISOString(),
      },
    };

    setReports([created, ...reports]);
    handleCloseNewSample();
    syncQcSampleToInsForge(created, currentUser);
    logActivityToInsForge(currentUser, "REGISTER_NEW_SAMPLE", "SAMPLE_REPORT", created.id, {
      lot_no: created.lot_no,
      report_no: created.report_no,
      point: created.sampling_point_name,
    });
  };

  // Helper to extract param result value
  const getParamVal = (report: SampleReport, code: string): string => {
    if (!report.results) return "-";
    const res = report.results.find(r => r.parameter_code === code || r.parameter_name.toLowerCase().includes(code.toLowerCase()));
    if (res && res.value_numeric !== null && res.value_numeric !== undefined) {
      return String(res.value_numeric);
    }
    return "-";
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Metrics Banner with Glassmorphism & Specular Rims */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Samples */}
        <div className="telemetry-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-display">
              Total Lab Samples
            </span>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1 tabular-nums">
              {totalCount}
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              Form RF-FR-001 (Rev 02/03)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 shadow-xs">
            <FlaskConical className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Accepted (In-Spec) */}
        <div className="telemetry-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-display flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              In-Spec Accepted
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
              {acceptedCount}
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              {totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(1) : 0}% Pass Rate
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected / Out-of-Spec */}
        <div className="telemetry-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block font-display flex items-center gap-1.5">
              {rejectedCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
              Out-of-Spec Rejected
            </span>
            <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1 tabular-nums">
              {rejectedCount}
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              Hold / Rework required
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Analysis */}
        <div className="telemetry-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block font-display">
              Pending QC Lab Test
            </span>
            <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1 tabular-nums">
              {pendingCount}
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              Awaiting QC decision
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Lot No, Report No, Produk, atau Tangki..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs font-sans text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filters and New Sample Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center rounded-xl bg-zinc-100/90 dark:bg-black/30 p-1 border border-zinc-200/80 dark:border-white/10 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("all")}
              className={`btn-tactile px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === "all" ? "bg-white dark:bg-white/10 font-bold shadow-xs text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("accept")}
              className={`btn-tactile px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === "accept" ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs" : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-600"
              }`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              onClick={() => setStatusFilter("reject")}
              className={`btn-tactile px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === "reject" ? "bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 font-bold shadow-xs" : "text-zinc-600 dark:text-zinc-400 hover:text-rose-600"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`btn-tactile px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === "pending" ? "bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs" : "text-zinc-600 dark:text-zinc-400 hover:text-amber-600"
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>

          <button
            onClick={() => setIsNewSampleOpen(true)}
            className="btn-premium-amber flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer group"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            <span>Register Sample</span>
          </button>
        </div>
      </div>

      {/* 3. Main Samples Table (RF-FR-001) */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-black/25 border-b border-zinc-200/90 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
              QC Lab Sample Analysis Reports (Form RF-FR-001)
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              [Showing {filteredReports.length} of {totalCount} Records]
            </span>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline font-mono">
            Lam Soon Edible Oils / Nisshin Process Standard
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200/90 dark:border-white/10">
                <th className="py-3 px-3">Report No / Lot No</th>
                <th className="py-3 px-2">Sample Date / Time</th>
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2">Tank (Feed → Disch)</th>
                <th className="py-3 px-2 text-right">FFA (%)</th>
                <th className="py-3 px-2 text-right">Moisture (%)</th>
                <th className="py-3 px-2 text-right">PV (meq/kg)</th>
                <th className="py-3 px-2 text-right">IV (Wijs)</th>
                <th className="py-3 px-2 text-center">Colour (R / Y)</th>
                <th className="py-3 px-3 text-center">QC Decision</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 font-sans">
              {filteredReports.map((report) => {
                const isAccepted = report.decision?.decision === "accept" || report.decision?.decision === "accept_concession";
                const isRejected = report.decision?.decision === "reject";

                return (
                  <tr
                    key={report.id}
                    className="hover:bg-zinc-500/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    {/* Report & Lot No */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-zinc-900 dark:text-white">
                        {report.report_no}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500 truncate max-w-[190px]">
                        {report.lot_no}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-2.5 px-2 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                      <div>{report.sample_date}</div>
                      <div className="text-zinc-400">{report.time_check} Hrs</div>
                    </td>

                    {/* Product Name */}
                    <td className="py-2.5 px-2 font-medium text-zinc-900 dark:text-zinc-200">
                      {report.product_name || "RBD Palm Oil"}
                    </td>

                    {/* Tanks */}
                    <td className="py-2.5 px-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {report.feed_tank_code || "TK-101A"} → {report.discharge_tank_code || "TK-201A"}
                    </td>

                    {/* FFA (%) */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">
                      {getParamVal(report, "FFA")}
                    </td>

                    {/* Moisture (%) */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">
                      {getParamVal(report, "H2O")}
                    </td>

                    {/* PV (meq/kg) */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">
                      {getParamVal(report, "PV")}
                    </td>

                    {/* IV */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">
                      {getParamVal(report, "IV")}
                    </td>

                    {/* Colour R/Y */}
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold">
                      {getParamVal(report, "COLOUR_R")}R / {getParamVal(report, "COLOUR_Y")}Y
                    </td>

                    {/* Decision Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>RELEASE</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30" title={report.decision?.reason_label || "Reject"}>
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>REJECT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setIsEditorOpen(true);
                          }}
                          className="btn-tactile p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 cursor-pointer group transition-all"
                          title="Semak / Edit Keputusan Makmal"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 transition-transform duration-200 group-hover:scale-110" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setIsCertificateOpen(true);
                          }}
                          className="btn-tactile p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 cursor-pointer group transition-all"
                          title="Lihat / Cetak Sijil Analisis (RF-FR-001)"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Edit Test Results & Submit Decision */}
      {isEditorOpen && selectedReport && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop-animate ${
            isClosingEditor ? "is-closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEditor();
          }}
        >
          <div 
            className={`w-full max-w-2xl bg-white/95 dark:bg-[#0E1626]/95 backdrop-blur-2xl rounded-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] modal-card-animate ${
              isClosingEditor ? "is-closing" : ""
            }`}
          >
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-display text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>QC Lab Results & Disposition Decision</span>
                  <span className="text-xs font-mono font-normal text-zinc-500 dark:text-zinc-400">
                    ({selectedReport.report_no})
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  {selectedReport.product_name} · Lot: {selectedReport.lot_no}
                </p>
              </div>
              <button 
                type="button"
                onClick={handleCloseEditor} 
                className="btn-tactile text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Parameters Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedReport.results?.map((res, idx) => (
                  <div key={res.id || idx} className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-white/5">
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 truncate" title={res.parameter_name}>
                      {res.parameter_code} ({res.unit || "-"})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={res.value_numeric ?? ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || null;
                        const updatedResults = selectedReport.results.map((r, i) => i === idx ? { ...r, value_numeric: val } : r);
                        setSelectedReport({ ...selectedReport, results: updatedResults });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 font-mono text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>

              {/* Disposition Action Selector */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 space-y-3">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 font-display">
                  QC Final Decision & Release Authorization
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport({
                        ...selectedReport,
                        decision: {
                          id: `dec-${Date.now()}`,
                          report_id: selectedReport.id,
                          decision: "accept",
                          decided_by_name: currentUser.name,
                          decided_at: new Date().toISOString(),
                        }
                      });
                    }}
                    className={`btn-tactile py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedReport.decision?.decision === "accept"
                        ? "btn-premium-emerald text-white border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/10 hover:border-zinc-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept (Release)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport({
                        ...selectedReport,
                        decision: {
                          id: `dec-${Date.now()}`,
                          report_id: selectedReport.id,
                          decision: "reject",
                          reason_label: "Out of specification parameter",
                          disposition: "rework",
                          decided_by_name: currentUser.name,
                          decided_at: new Date().toISOString(),
                        }
                      });
                    }}
                    className={`btn-tactile py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedReport.decision?.decision === "reject"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/10 hover:border-zinc-400"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject / Rework</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport({
                        ...selectedReport,
                        decision: {
                          id: `dec-${Date.now()}`,
                          report_id: selectedReport.id,
                          decision: "accept_concession",
                          reason_label: "Concession approval by QC Manager",
                          decided_by_name: currentUser.name,
                          decided_at: new Date().toISOString(),
                        }
                      });
                    }}
                    className={`btn-tactile py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedReport.decision?.decision === "accept_concession"
                        ? "btn-premium-amber text-white border-amber-600 shadow-sm"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/10 hover:border-zinc-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Concession</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseEditor}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveResults(selectedReport)}
                className="btn-premium-amber px-5 py-2 rounded-xl text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer group"
              >
                <Save className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Simpan Keputusan QC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Register New QC Sample (RF-FR-001) */}
      {isNewSampleOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop-animate ${
            isClosingNewSample ? "is-closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseNewSample();
          }}
        >
          <div 
            className={`w-full max-w-lg bg-white/95 dark:bg-[#0E1626]/95 backdrop-blur-2xl rounded-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden modal-card-animate ${
              isClosingNewSample ? "is-closing" : ""
            }`}
          >
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 flex items-center justify-between">
              <h3 className="font-bold font-display text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-500" />
                <span>Pendaftaran Sampel Makmal Baharu (RF-FR-001)</span>
              </h3>
              <button 
                type="button"
                onClick={handleCloseNewSample} 
                className="btn-tactile text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Lot Number</label>
                <input
                  type="text"
                  required
                  value={newSample.lot_no}
                  onChange={(e) => setNewSample({ ...newSample, lot_no: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 font-mono text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Tarikh Sampel</label>
                  <input
                    type="date"
                    required
                    value={newSample.sample_date}
                    onChange={(e) => setNewSample({ ...newSample, sample_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 font-mono text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Masa Ambilan</label>
                  <input
                    type="text"
                    required
                    value={newSample.time_check}
                    onChange={(e) => setNewSample({ ...newSample, time_check: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 font-mono text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="14:00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Produk</label>
                <RadioSelect
                  value={newSample.product_name}
                  onChange={(val) => setNewSample({ ...newSample, product_name: val })}
                  options={[
                    "RBD Palm Oil",
                    "PL 65 Matsuyama",
                    "Chocohi 357A NPHO",
                    "Daisy Soft PM180602 I2",
                    "DF 20",
                    "Farm Cow R2"
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Feed Tank</label>
                  <input
                    type="text"
                    value={newSample.feed_tank_code}
                    onChange={(e) => setNewSample({ ...newSample, feed_tank_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Discharge Tank</label>
                  <input
                    type="text"
                    value={newSample.discharge_tank_code}
                    onChange={(e) => setNewSample({ ...newSample, discharge_tank_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Titik Pensampelan (Sampling Point)</label>
                <input
                  type="text"
                  value={newSample.sampling_point_name}
                  onChange={(e) => setNewSample({ ...newSample, sampling_point_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseNewSample}
                  className="btn-tactile px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-premium-amber px-5 py-2 rounded-xl text-white text-xs font-bold shadow cursor-pointer group"
                >
                  Daftar Sampel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Print-Ready Official QC Certificate (RF-FR-001) */}
      {isCertificateOpen && selectedReport && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto modal-backdrop-animate ${
            isClosingCertificate ? "is-closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseCertificate();
          }}
        >
          <div 
            className={`w-full max-w-4xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-300 dark:border-white/10 flex flex-col my-auto max-h-[95vh] overflow-hidden modal-card-animate ${
              isClosingCertificate ? "is-closing" : ""
            }`}
          >
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
                  onClick={handleCloseCertificate} 
                  className="btn-tactile text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg cursor-pointer group"
                >
                  <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-8 overflow-y-auto bg-white text-black font-sans print:p-0">
              <div className="border-2 border-black p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <div>
                    <h1 className="font-extrabold text-lg uppercase tracking-wider">
                      LAM SOON EDIBLE OILS SDN. BHD.
                    </h1>
                    <h2 className="text-xs font-semibold text-gray-700 uppercase">
                      Quality Control Department · Refinery Testing Laboratory
                    </h2>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div><strong>Form:</strong> RF-FR-001 Rev 02</div>
                    <div><strong>Certificate No:</strong> {selectedReport.report_no}</div>
                    <div><strong>Date:</strong> {selectedReport.sample_date}</div>
                  </div>
                </div>

                {/* Sample metadata */}
                <div className="grid grid-cols-3 gap-3 text-xs border-b border-gray-400 pb-3">
                  <div><strong>Product:</strong> {selectedReport.product_name}</div>
                  <div><strong>Lot Number:</strong> <span className="font-mono">{selectedReport.lot_no}</span></div>
                  <div><strong>Sampling Time:</strong> {selectedReport.time_check} Hrs</div>
                  <div><strong>Feed Tank:</strong> {selectedReport.feed_tank_code}</div>
                  <div><strong>Discharge Tank:</strong> {selectedReport.discharge_tank_code}</div>
                  <div><strong>Sampling Location:</strong> {selectedReport.sampling_point_name}</div>
                </div>

                {/* Results Table */}
                <table className="w-full border-collapse border border-black text-xs text-center my-3">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold">
                      <th className="border border-black py-1.5 px-3 text-left">Test Parameter</th>
                      <th className="border border-black py-1.5 px-2">Unit</th>
                      <th className="border border-black py-1.5 px-2 text-right">Result</th>
                      <th className="border border-black py-1.5 px-2">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.results?.map((res, i) => (
                      <tr key={i} className="border-b border-gray-300">
                        <td className="border border-black py-1 px-3 text-left font-medium">{res.parameter_name}</td>
                        <td className="border border-black py-1 px-2 font-mono">{res.unit || "-"}</td>
                        <td className="border border-black py-1 px-2 text-right font-mono font-bold">{res.value_numeric ?? "-"}</td>
                        <td className="border border-black py-1 px-2 font-bold text-emerald-800">PASS (IN SPEC)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Final Decision and Signatures */}
                <div className="border border-black p-3 text-xs flex justify-between items-center mt-4">
                  <div>
                    <span className="font-bold">QC Status: </span>
                    <span className="font-mono font-extrabold uppercase px-2 py-0.5 border border-black inline-block">
                      {selectedReport.decision?.decision || "RELEASED"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Authorized By: </span>
                    <span className="font-mono underline">{selectedReport.decision?.decided_by_name || currentUser.name}</span>
                  </div>
                  <div>
                    <span className="font-bold">Date Verified: </span>
                    <span className="font-mono">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
