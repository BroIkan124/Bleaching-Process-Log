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
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { recordReportExport } from "@/lib/dbService";
import { RadioSelect } from "./RadioSelect";
import { GliderRadioGroup } from "./GliderRadioGroup";
import { calculatePipelineMetrics, getShiftDutyTechnician } from "@/lib/workflowPipeline";
import { ShiftRosterModal } from "./ShiftRosterModal";

interface ReportsViewProps {
  sheet: LogSheet;
  currentUser: UserProfile;
  qcReports?: SampleReport[];
  allUsers?: UserProfile[];
  onUpdateShiftTechnician?: (updates: Partial<LogSheet>) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sheet,
  currentUser,
  qcReports = [],
  allUsers = [],
  onUpdateShiftTechnician,
}) => {
  const [timeRange, setTimeRange] = useState<string>("today");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [rosterModalShift, setRosterModalShift] = useState<1 | 2 | 3 | null>(null);

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

  // Shift duty technicians (Option 3: Smart Hybrid)
  const techS1 = getShiftDutyTechnician(sheet, 1);
  const techS2 = getShiftDutyTechnician(sheet, 2);
  const techS3 = getShiftDutyTechnician(sheet, 3);

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
          <div className="telemetry-card p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between space-y-3.5 border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] shadow-sm hover:border-zinc-300 dark:hover:border-white/10 transition-all">
            {/* Header: Title & Status */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shrink-0" />
                  <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide font-display truncate">
                    Shift 1 (Morning)
                  </h3>
                </div>
                {s1Saved.length > 0 ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                    Active ({s1Saved.length}/8h)
                  </span>
                ) : techS1.source === "manual" ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                    Roster Set
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-500 font-mono">
                    Standby
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pl-4.5">
                <span>0800 – 1500 Hrs</span>
                <span>{s1Saved.length} of 8 hrs logged</span>
              </div>
            </div>

            {/* Duty Technician Mini Block */}
            <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 font-display block leading-none mb-1">
                    Duty Technician
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {techS1.isPending ? (
                      <span className="text-xs text-zinc-400 italic font-mono">Awaiting Check-in</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {techS1.name}
                      </span>
                    )}
                    {techS1.source === "auto" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                        Auto
                      </span>
                    )}
                    {techS1.source === "manual" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRosterModalShift(1)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Assign or change Shift 1 roster technician"
              >
                <span>Assign</span>
              </button>
            </div>

            {/* Operating Metrics */}
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/5 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s1Saved.length > 0 ? "Logged Volume" : "Target Volume"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s1Saved.length > 0 ? s1MT.toFixed(1) : "360.0"} MT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s1Saved.length > 0 ? "Average Rate" : "Target Flow"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s1Saved.length > 0 ? (s1MT / s1Saved.length).toFixed(1) : "45.0"} MT/HR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">Shift Status</span>
                <span className={`text-[11px] font-bold font-sans ${s1Saved.length > 0 ? "text-emerald-500" : "text-zinc-400"}`}>
                  {s1Saved.length > 0 ? "In-Spec Completed" : "Not Started"}
                </span>
              </div>
            </div>
          </div>

          {/* Shift 2 Card */}
          <div className="telemetry-card p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between space-y-3.5 border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] shadow-sm hover:border-zinc-300 dark:hover:border-white/10 transition-all">
            {/* Header: Title & Status */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shrink-0" />
                  <h3 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide font-display truncate">
                    Shift 2 (Afternoon)
                  </h3>
                </div>
                {s2Saved.length > 0 ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                    Active ({s2Saved.length}/8h)
                  </span>
                ) : techS2.source === "manual" ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                    Roster Set
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-500 font-mono">
                    Standby
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pl-4.5">
                <span>1600 – 2300 Hrs</span>
                <span>{s2Saved.length} of 8 hrs logged</span>
              </div>
            </div>

            {/* Duty Technician Mini Block */}
            <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 font-display block leading-none mb-1">
                    Duty Technician
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {techS2.isPending ? (
                      <span className="text-xs text-zinc-400 italic font-mono">Awaiting Check-in</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {techS2.name}
                      </span>
                    )}
                    {techS2.source === "auto" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                        Auto
                      </span>
                    )}
                    {techS2.source === "manual" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRosterModalShift(2)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/30 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Assign or change Shift 2 roster technician"
              >
                <span>Assign</span>
              </button>
            </div>

            {/* Operating Metrics */}
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/5 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s2Saved.length > 0 ? "Logged Volume" : "Target Volume"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s2Saved.length > 0 ? s2MT.toFixed(1) : "360.0"} MT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s2Saved.length > 0 ? "Average Rate" : "Target Flow"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s2Saved.length > 0 ? (s2MT / s2Saved.length).toFixed(1) : "45.0"} MT/HR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">Shift Status</span>
                <span className={`text-[11px] font-bold font-sans ${s2Saved.length > 0 ? "text-emerald-500" : "text-zinc-400"}`}>
                  {s2Saved.length > 0 ? "Active Logging" : "Not Started"}
                </span>
              </div>
            </div>
          </div>

          {/* Shift 3 Card */}
          <div className="telemetry-card p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between space-y-3.5 border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] shadow-sm hover:border-zinc-300 dark:hover:border-white/10 transition-all">
            {/* Header: Title & Status */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shrink-0" />
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-display truncate">
                    Shift 3 (Night)
                  </h3>
                </div>
                {s3Saved.length > 0 ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                    Active ({s3Saved.length}/8h)
                  </span>
                ) : techS3.source === "manual" ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                    Roster Set
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-zinc-200/80 dark:bg-white/10 text-zinc-500 font-mono">
                    Standby
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pl-4.5">
                <span>2400 – 0700 Hrs</span>
                <span>{s3Saved.length} of 8 hrs logged</span>
              </div>
            </div>

            {/* Duty Technician Mini Block */}
            <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 font-display block leading-none mb-1">
                    Duty Technician
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {techS3.isPending ? (
                      <span className="text-xs text-zinc-400 italic font-mono">Awaiting Check-in</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {techS3.name}
                      </span>
                    )}
                    {techS3.source === "auto" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                        Auto
                      </span>
                    )}
                    {techS3.source === "manual" && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-mono">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRosterModalShift(3)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Assign or change Shift 3 roster technician"
              >
                <span>Assign</span>
              </button>
            </div>

            {/* Operating Metrics */}
            <div className="pt-2 border-t border-zinc-200/80 dark:border-white/5 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s3Saved.length > 0 ? "Logged Volume" : "Target Volume"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s3Saved.length > 0 ? s3MT.toFixed(1) : "360.0"} MT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">{s3Saved.length > 0 ? "Average Rate" : "Target Flow"}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s3Saved.length > 0 ? (s3MT / s3Saved.length).toFixed(1) : "45.0"} MT/HR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">Shift Status</span>
                <span className={`text-[11px] font-bold font-sans ${s3Saved.length > 0 ? "text-emerald-500" : "text-zinc-400"}`}>
                  {s3Saved.length > 0 ? "Active Logging" : "Not Started"}
                </span>
              </div>
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
                { value: "1", label: "Shift 1 (Morning)" },
                { value: "2", label: "Shift 2 (Afternoon)" },
                { value: "3", label: "Shift 3 (Night)" },
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
      {/* Shift Roster Assignment Modal (Option 3: Smart Hybrid) */}
      {rosterModalShift !== null && (
        <ShiftRosterModal
          isOpen={true}
          onClose={() => setRosterModalShift(null)}
          shiftNum={rosterModalShift}
          sheet={sheet}
          allUsers={allUsers}
          onSaveRoster={(updates) => {
            if (onUpdateShiftTechnician) {
              onUpdateShiftTechnician(updates);
            }
          }}
        />
      )}
    </div>
  );
};
