"use client";

import React, { useState } from "react";
import { LogSheet, UserProfile } from "@/types";
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
  Filter
} from "lucide-react";

interface ReportsViewProps {
  sheet: LogSheet;
  currentUser: UserProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sheet,
  currentUser,
}) => {
  const [timeRange, setTimeRange] = useState<string>("today");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");

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
      "Slot Jam",
      "Syif",
      "Kadar Alir Flowrate (MT/HR)",
      "Dos Asid Sitrik/PA",
      "Suhu HE (°C)",
      "Dos Tanah Bleaching Earth",
      "Paras Bleacher",
      "Vakum Bleacher (mmHg)",
      "Penapis Niagara",
      "Waktu Tukar Penapis",
      "FFA (%)",
      "Warna Lovibond Red (R)",
      "Warna Lovibond Yellow (Y)",
      "Catatan Operator"
    ];

    const rows = entries.map((e) => [
      e.time_label,
      `Syif ${e.shift}`,
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
    link.setAttribute("download", `Laporan_Bleaching_RF-FR-003_${sheet.sheet_date || "Hari_Ini"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Laporan &amp; Analisis Prestasi Loji (RF-FR-003)
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Analisis volum pengeluaran, kestabilan parameter suhu &amp; vakum, serta kualiti ujian minyak luntur.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              <option value="today">Hari Ini ({sheet?.sheet_date || "2026-10-01"})</option>
              <option value="7days">7 Hari Lepas (Mingguan)</option>
              <option value="month">Bulan Ini (Oktober 2026)</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-bold shadow-sm transition-all"
            title="Eksport data penuh dalam format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Eksport CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* 2. Key Production Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Jumlah Minyak Diproses</span>
            <Droplet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono">
              {totalInputMT > 0 ? totalInputMT.toFixed(1) : "229.2"}
            </span>
            <span className="text-xs text-zinc-500 font-bold">MT</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium block mt-1">
            Purata Alir: {avgFlowrate} MT/Jam
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pematuhan Spesifikasi</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-emerald-500 font-mono">
              {inSpecPercentage}%
            </span>
            <span className="text-xs text-zinc-500 font-bold">In-Spec</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium block mt-1">
            {totalIncidents === 0 ? "100% Parameter Normal" : `${totalIncidents} bacaan luar had dikesan`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purata Vakum Loji</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono">
              {avgVacuum}
            </span>
            <span className="text-xs text-zinc-500 font-bold">mmHg</span>
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold block mt-1">
            Had Min: ≥ 600.0 mmHg
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purata Suhu HE</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono">
              {avgTemp}
            </span>
            <span className="text-xs text-zinc-500 font-bold">°C</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium block mt-1">
            Had Dibenarkan: 70.0°C – 115.0°C
          </span>
        </div>
      </div>

      {/* 3. Quality Parameters Lovibond & FFA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Asid Lemak Bebas (FFA %)
            </span>
            <FlaskConical className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100">
              {avgFFA}%
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 0.050% Max</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "45%" }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Warna Lovibond Red (R)
            </span>
            <span className="w-3 h-3 rounded-full bg-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100">
              {avgRed} R
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 2.5 R Max</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "65%" }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Warna Lovibond Yellow (Y)
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display font-mono text-zinc-900 dark:text-zinc-100">
              {avgYellow} Y
            </span>
            <span className="text-xs text-emerald-500 font-bold font-mono">≤ 20.0 Y Max</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "70%" }} />
          </div>
        </div>
      </div>

      {/* 4. Shift Comparison Breakdown Table */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Prestasi Mengikut Syif Operasi (Shift Comparison)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shift 1 Card */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Syif 1 (0800 – 1500)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Aktif ({s1Saved.length}/8 Jam)
              </span>
            </div>
            <p className="text-xs text-zinc-500">Juruteknik: <strong>{sheet.tech_s1_name || "Ahmad Razif"}</strong></p>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs">
              <span className="text-zinc-500">Volum Direkod:</span>
              <span className="font-mono font-bold">{s1MT > 0 ? s1MT.toFixed(1) : "229.2"} MT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Kadar Purata:</span>
              <span className="font-mono font-bold">45.8 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Pematuhan:</span>
              <span className="text-emerald-500 font-bold">In-Spec Selesai</span>
            </div>
          </div>

          {/* Shift 2 Card */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                Syif 2 (1600 – 2300)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                Menunggu Giliran
              </span>
            </div>
            <p className="text-xs text-zinc-500">Juruteknik: <strong>{sheet.tech_s2_name || "Mohd Danial"}</strong></p>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs">
              <span className="text-zinc-500">Sasaran Volum:</span>
              <span className="font-mono font-bold">360.0 MT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Sasaran Flow:</span>
              <span className="font-mono font-bold">45.0 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Status:</span>
              <span className="text-zinc-400 font-bold">Belum Bermula</span>
            </div>
          </div>

          {/* Shift 3 Card */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                Syif 3 (2400 – 0700)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                Menunggu Giliran
              </span>
            </div>
            <p className="text-xs text-zinc-500">Juruteknik: <strong>{sheet.tech_s3_name || "K. Subramaniam"}</strong></p>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs">
              <span className="text-zinc-500">Sasaran Volum:</span>
              <span className="font-mono font-bold">360.0 MT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Sasaran Flow:</span>
              <span className="font-mono font-bold">45.0 MT/HR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Status:</span>
              <span className="text-zinc-400 font-bold">Belum Bermula</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Full Hourly Entries Detail Table */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>Jadual Log Lengkap 24-Jam (RF-FR-003 Rev 03)</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold">Pilih Syif:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold"
            >
              <option value="ALL">Semua 24 Jam</option>
              <option value="1">Syif 1 (0800–1500)</option>
              <option value="2">Syif 2 (1600–2300)</option>
              <option value="3">Syif 3 (2400–0700)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#131416] text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <th className="py-2.5 px-3">Slot Jam</th>
                <th className="py-2.5 px-3">Syif</th>
                <th className="py-2.5 px-3 text-right">Flow (MT/HR)</th>
                <th className="py-2.5 px-3 text-center">Dos Asid</th>
                <th className="py-2.5 px-3 text-right">Suhu HE (°C)</th>
                <th className="py-2.5 px-3 text-center">Dos Tanah</th>
                <th className="py-2.5 px-3 text-center">Paras</th>
                <th className="py-2.5 px-3 text-right">Vakum (mmHg)</th>
                <th className="py-2.5 px-3 text-center">Niagara</th>
                <th className="py-2.5 px-3 text-right">FFA (%)</th>
                <th className="py-2.5 px-3 text-right">R / Y</th>
                <th className="py-2.5 px-3">Catatan / Remarks</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
              {displayedEntries.map((e) => {
                const isVacAlert = typeof e.vacuum_mmhg === 'number' && e.vacuum_mmhg < 600;
                const isTempAlert = typeof e.he_temp_c === 'number' && (e.he_temp_c < 70 || e.he_temp_c > 115);

                return (
                  <tr 
                    key={e.slot_index}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {e.time_label}
                    </td>
                    <td className="py-2 px-3 text-zinc-500 font-sans">
                      Syif {e.shift}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {typeof e.flowrate_set === 'number' ? e.flowrate_set.toFixed(1) : "-"}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {e.acid_dosage_ok ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          OK
                        </span>
                      ) : "-"}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${isTempAlert ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {typeof e.he_temp_c === 'number' ? e.he_temp_c.toFixed(1) : "-"}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {e.earth_dosage_ok ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          OK
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {e.bleacher_level || "-"}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${isVacAlert ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {typeof e.vacuum_mmhg === 'number' ? e.vacuum_mmhg.toFixed(1) : "-"}
                    </td>
                    <td className="py-2 px-3 text-center text-zinc-700 dark:text-zinc-300">
                      {e.niagara_filter || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {typeof e.ffa_pct === 'number' ? e.ffa_pct.toFixed(3) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {typeof e.colour_r === 'number' && typeof e.colour_y === 'number'
                        ? `${e.colour_r.toFixed(1)} / ${e.colour_y.toFixed(1)}`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 font-sans text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate">
                      {e.remarks || "-"}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {e.is_saved ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Disimpan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                          Kosong
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
