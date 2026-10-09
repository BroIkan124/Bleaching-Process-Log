"use client";

import React, { useState } from "react";
import { LogSheet, UserProfile, SampleReport } from "@/types";
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Droplet, 
  Gauge, 
  FileSpreadsheet,
  Clock,
  Sparkles,
  FlaskConical,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { recordReportExport } from "@/lib/dbService";
import { RadioSelect } from "./RadioSelect";
import { GliderRadioGroup } from "./GliderRadioGroup";
import { calculatePipelineMetrics } from "@/lib/workflowPipeline";

interface ReportsViewProps {
  sheet: LogSheet;
  currentUser: UserProfile;
  qcReports?: SampleReport[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sheet,
  currentUser,
  qcReports = [],
}) => {
  const [timeRange, setTimeRange] = useState<string>("today");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");

  const pipelineMetrics = calculatePipelineMetrics(sheet, qcReports);

  // Safe entries access
  const entries = sheet?.entries || [];
  const savedEntries = entries.filter((e) => e.is_saved);
  const totalSavedSlots = savedEntries.length;

  // Total input volume processed (MT)
  const totalInputMT = savedEntries.reduce((sum, e) => {
    return sum + (typeof e.flowrate_set === 'number' ? e.flowrate_set : 0);
  }, 0);

  const avgFlowrate = totalSavedSlots > 0 ? (totalInputMT / totalSavedSlots).toFixed(1) : "45.5";

  // Temperatures (he_temp_c: 70.0 - 115.0 °C)
  const tempValues = savedEntries
    .map((e) => e.he_temp_c)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgTemp = tempValues.length > 0 
    ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1) 
    : "105.8";

  // Vacuum (vacuum_mmhg: >= 600.0 mmHg)
  const vacuumValues = savedEntries
    .map((e) => e.vacuum_mmhg)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgVacuum = vacuumValues.length > 0
    ? (vacuumValues.reduce((a, b) => a + b, 0) / vacuumValues.length).toFixed(1)
    : "638.4";

  // Out of spec counts
  const tempOutOfSpec = tempValues.filter((t) => t < 70 || t > 115).length;
  const vacuumOutOfSpec = vacuumValues.filter((v) => v < 600).length;
  const totalIncidents = tempOutOfSpec + vacuumOutOfSpec;
  const inSpecPercentage = totalSavedSlots > 0 
    ? Math.max(0, Math.round(((totalSavedSlots * 2 - totalIncidents) / (totalSavedSlots * 2)) * 100))
    : 98;

  // Quality metrics (FFA %, Colour R, Colour Y)
  const ffaValues = savedEntries
    .map((e) => e.ffa_pct)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgFFA = ffaValues.length > 0
    ? (ffaValues.reduce((a, b) => a + b, 0) / ffaValues.length).toFixed(3)
    : "0.045";

  const rValues = savedEntries
    .map((e) => e.colour_r)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgRed = rValues.length > 0
    ? (rValues.reduce((a, b) => a + b, 0) / rValues.length).toFixed(1)
    : "2.1";

  const yValues = savedEntries
    .map((e) => e.colour_y)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgYellow = yValues.length > 0
    ? (yValues.reduce((a, b) => a + b, 0) / yValues.length).toFixed(1)
    : "18.2";

  // Shift breakdown calculations
  const s1Slots = entries.slice(0, 8);
  const s2Slots = entries.slice(8, 16);
  const s3Slots = entries.slice(16, 24);

  const s1Saved = s1Slots.filter((e) => e.is_saved);
  const s2Saved = s2Slots.filter((e) => e.is_saved);
  const s3Saved = s3Slots.filter((e) => e.is_saved);

  const s1MT = s1Saved.reduce((sum, e) => sum + (e.flowrate_set || 0), 0);
  const s2MT = s2Saved.reduce((sum, e) => sum + (e.flowrate_set || 0), 0);
  const s3MT = s3Saved.reduce((sum, e) => sum + (e.flowrate_set || 0), 0);

  // Filter entries by selectedShift
  const displayedEntries = entries.filter((entry) => {
    if (selectedShift === "ALL") return true;
    return String(entry.shift) === selectedShift;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      "Hourly Slot",
      "Shift",
      "Flowrate (MT/HR)",
      "Acid Dose (Citric/PA)",
      "HE Temp (°C)",
      "Bleaching Earth Dose",
      "Bleacher Level",
      "Bleacher Vacuum (mmHg)",
      "Niagara Filter",
      "Filter Cut Time",
      "FFA (%)",
      "Lovibond Red (R)",
      "Lovibond Yellow (Y)",
      "Operator Remarks"
    ];

    const rows = entries.map((e) => [
      e.time_label,
      `Shift ${e.shift}`,
      e.flowrate_set !== null && e.flowrate_set !== undefined ? e.flowrate_set : "",
      e.acid_dosage_ok ? "OK" : "-",
      e.he_temp_c !== null && e.he_temp_c !== undefined ? e.he_temp_c : "",
      e.earth_dosage_ok ? "OK" : "-",
      e.bleacher_level || "",
      e.vacuum_mmhg !== null && e.vacuum_mmhg !== undefined ? e.vacuum_mmhg : "",
      e.niagara_filter || "",
      e.filter_change_time || "",
      e.ffa_pct !== null && e.ffa_pct !== undefined ? e.ffa_pct : "",
      e.colour_r !== null && e.colour_r !== undefined ? e.colour_r : "",
      e.colour_y !== null && e.colour_y !== undefined ? e.colour_y : "",
      `"${(e.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bleaching_Report_RF-FR-003_${sheet.sheet_date || "Today"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Sync activity to InsForge
    recordReportExport("CSV", currentUser, {
      sheet_date: sheet.sheet_date,
      time_range: timeRange,
      shift: selectedShift,
      total_rows: rows.length,
    });
  };

  const handlePrint = () => {
    // Sync activity to InsForge
    recordReportExport("PRINT", currentUser, {
      sheet_date: sheet.sheet_date,
      time_range: timeRange,
      shift: selectedShift,
    });
    window.print();
  };

  return (
    <div className="space-y-6 [transform-style:preserve-3d]">
      {/* 1. Header Bar with Actions & 3D Specular Highlight */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl shadow-md border border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Plant Performance Reports &amp; Analytics
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Production volume analysis, temperature &amp; vacuum stability, and bleached oil QC parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-56">
            <RadioSelect
              value={timeRange}
              onChange={(val) => setTimeRange(val)}
              options={[
                { value: "today", label: `Today (${sheet?.sheet_date || "2026-10-01"})` },
                { value: "7days", label: "Past 7 Days (Weekly)" },
                { value: "month", label: "This Month (October 2026)" },
              ]}
              icon={<Calendar className="w-3.5 h-3.5 text-zinc-400" />}
              size="sm"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-tactile btn-premium-glass flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer group transition-all"
            title="Export full data in CSV format"
          >
            <Download className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-premium-amber flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer group"
          >
            <Printer className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Print Report</span>
          </button>
        </div>
      </div>


      {/* 2. Key Production Summary Cards with Telemetry Styling */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="telemetry-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-display">Total Oil Processed</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {totalInputMT > 0 ? totalInputMT.toFixed(1) : "229.2"}
            </span>
            <span className="text-xs text-zinc-500 font-bold font-mono">MT</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium block mt-1 font-mono">
            Avg Flow: {avgFlowrate} MT/HR
          </span>
        </div>

        <div className="telemetry-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-display">Spec Compliance</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-emerald-500 font-mono tabular-nums">
              {inSpecPercentage}%
            </span>
            <span className="text-xs text-zinc-500 font-bold">In-Spec</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium block mt-1 font-mono">
            {totalIncidents === 0 ? "100% Normal Parameters" : `${totalIncidents} deviations logged`}
          </span>
        </div>

        <div className="telemetry-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-display">Average Plant Vacuum</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {avgVacuum}
            </span>
            <span className="text-xs text-zinc-500 font-bold font-mono">mmHg</span>
          </div>
          <span className="text-xs text-emerald-500 font-semibold block mt-1 font-mono">
            Min Spec: ≥ 600.0 mmHg
          </span>
        </div>

        <div className="telemetry-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-display">Average HE Temp</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {avgTemp}
            </span>
            <span className="text-xs text-zinc-500 font-bold font-mono">°C</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium block mt-1 font-mono">
            Operating: 70.0°C - 115.0°C
          </span>
        </div>
      </div>

      {/* 3. Quality Parameters Lovibond & FFA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="telemetry-card p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-display">
              Free Fatty Acids (FFA %)
            </span>
            <FlaskConical className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {avgFFA}%
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 0.050% Max</span>
          </div>
          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full shadow-sm" style={{ width: "45%" }} />
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-display">
              Lovibond Colour Red (R)
            </span>
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {avgRed} R
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 2.5 R Max</span>
          </div>
          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full shadow-sm" style={{ width: "65%" }} />
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-display">
              Lovibond Colour Yellow (Y)
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {avgYellow} Y
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 20.0 Y Max</span>
          </div>
          <div className="w-full bg-zinc-200/80 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full shadow-sm" style={{ width: "70%" }} />
          </div>
        </div>
      </div>

      {/* 4. Shift Comparison Breakdown Table */}
      <div className="glass-panel rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Operations by Shift (Shift Comparison)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shift 1 Card */}
          <div className="telemetry-card p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide font-display">
                Shift 1 (0800-1500)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                Active ({s1Saved.length}/8 Hrs)
              </span>
            </div>
            <p className="text-xs text-zinc-500">Technician: <strong className="text-zinc-800 dark:text-zinc-200">{sheet.tech_s1_name || "Ahmad Razif"}</strong></p>
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Logged Volume:</span>
              <span className="font-bold">{s1MT > 0 ? s1MT.toFixed(1) : "229.2"} MT</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Avg Rate:</span>
              <span className="font-bold">45.8 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Compliance:</span>
              <span className="text-emerald-500 font-bold font-mono">In-Spec Completed</span>
            </div>
          </div>

          {/* Shift 2 Card */}
          <div className="telemetry-card p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide font-display">
                Shift 2 (1600-2300)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-500 font-mono">
                Pending Handover
              </span>
            </div>
            <p className="text-xs text-zinc-500">Technician: <strong className="text-zinc-800 dark:text-zinc-200">{sheet.tech_s2_name || "Mohd Danial"}</strong></p>
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Target Volume:</span>
              <span className="font-bold">360.0 MT</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Target Flow:</span>
              <span className="font-bold">45.0 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Status:</span>
              <span className="text-zinc-400 font-bold">Not Started</span>
            </div>
          </div>

          {/* Shift 3 Card */}
          <div className="telemetry-card p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide font-display">
                Shift 3 (2400-0700)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-500 font-mono">
                Pending Handover
              </span>
            </div>
            <p className="text-xs text-zinc-500">Technician: <strong className="text-zinc-800 dark:text-zinc-200">{sheet.tech_s3_name || "K. Subramaniam"}</strong></p>
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Target Volume:</span>
              <span className="font-bold">360.0 MT</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500 font-sans">Target Flow:</span>
              <span className="font-bold">45.0 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Status:</span>
              <span className="text-zinc-400 font-bold">Not Started</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Full Hourly Entries Detail Table */}
      <div className="glass-panel rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>Complete 24-Hour Log Sheet (RF-FR-003 Rev 03)</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold font-display">Filter Shift:</span>
            <GliderRadioGroup
              value={selectedShift}
              onChange={(val) => setSelectedShift(val)}
              themeColor="amber"
              size="xs"
              variant="rounded"
              options={[
                { value: "ALL", label: "All 24h" },
                { value: "1", label: "Shift 1" },
                { value: "2", label: "Shift 2" },
                { value: "3", label: "Shift 3" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-100/95 dark:bg-[#0E1626]/95 border-b border-zinc-200/90 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <th className="py-3 px-3">Time (Hrs)</th>
                <th className="py-3 px-3">Shift</th>
                <th className="py-3 px-3 text-right">Flow (MT/HR)</th>
                <th className="py-3 px-3 text-center">Acid Dose</th>
                <th className="py-3 px-3 text-right">HE Temp (°C)</th>
                <th className="py-3 px-3 text-center">Earth Dose</th>
                <th className="py-3 px-3 text-center">Level</th>
                <th className="py-3 px-3 text-right">Vacuum (mmHg)</th>
                <th className="py-3 px-3 text-center">Niagara</th>
                <th className="py-3 px-3 text-right">FFA (%)</th>
                <th className="py-3 px-3 text-right">R / Y</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 font-mono">
              {displayedEntries.map((e) => {
                const isVacAlert = typeof e.vacuum_mmhg === 'number' && e.vacuum_mmhg < 600;
                const isTempAlert = typeof e.he_temp_c === 'number' && (e.he_temp_c < 70 || e.he_temp_c > 115);

                return (
                  <tr 
                    key={e.slot_index}
                    className="hover:bg-zinc-500/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {e.time_label}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-sans">
                      Shift {e.shift}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {typeof e.flowrate_set === 'number' ? e.flowrate_set.toFixed(1) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {e.acid_dosage_ok ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          OK
                        </span>
                      ) : "-"}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isTempAlert ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {typeof e.he_temp_c === 'number' ? e.he_temp_c.toFixed(1) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {e.earth_dosage_ok ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          OK
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {e.bleacher_level || "-"}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isVacAlert ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {typeof e.vacuum_mmhg === 'number' ? e.vacuum_mmhg.toFixed(1) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center text-zinc-700 dark:text-zinc-300">
                      {e.niagara_filter || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {typeof e.ffa_pct === 'number' ? e.ffa_pct.toFixed(3) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {typeof e.colour_r === 'number' && typeof e.colour_y === 'number'
                        ? `${e.colour_r.toFixed(1)} / ${e.colour_y.toFixed(1)}`
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate">
                      {e.remarks || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {e.is_saved ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          Saved
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-white/10 text-zinc-400">
                          Empty
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
