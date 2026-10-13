"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  SampleReport, 
  UserProfile, 
  Product, 
  Plant, 
  Tank,
  ProductSpec,
  RejectionReasonCode,
  DashboardTab,
  LogSheet,
  LogEntry
} from "@/types";
import { 
  MOCK_PRODUCTS,
  MOCK_PLANTS,
  MOCK_TANKS
} from "@/lib/mockData";
import { 
  Database, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Sliders, 
  Layers, 
  FileText, 
  Boxes, 
  ArrowUpRight, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Clock, 
  ChevronDown, 
  Calendar, 
  X, 
  Printer, 
  Eye, 
  Activity, 
  Check, 
  Shield, 
  Droplets,
  Thermometer,
  Gauge,
  Flame,
  Zap,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { RadioSelect } from "./RadioSelect";
import { GliderRadioGroup } from "./GliderRadioGroup";
import { QcCertificateModal } from "./QcCertificateModal";

interface MasterDataViewProps {
  sheet?: LogSheet;
  currentUser: UserProfile;
  isDark: boolean;
  reports: SampleReport[];
  products?: Product[];
  plants?: Plant[];
  tanks?: Tank[];
  onAddPlant?: (plantName: string) => Plant | null;
  onAddTank?: (tankName: string, kind?: 'feed' | 'discharge' | 'both') => Tank | null;
  onNavigateTab?: (tab: DashboardTab) => void;
  onUpdateReport?: (report: SampleReport) => void;
}

type ProcessChartTab = "combined" | "he_temp" | "vacuum";
type ProcessShiftFilter = "all" | "1" | "2" | "3";
type NonConformityFilter = "rejects_only" | "all_non_conformances";

// Helper to normalize reason descriptions for Pareto aggregation matching RF-FR-001 standard
function normalizeReason(label?: string | null, codeOrId?: string | null): string {
  if (!label && !codeOrId) return "Other Quality Deviation";
  
  const text = `${label || ""} ${codeOrId || ""}`.toLowerCase();
  
  if (text.includes("ffa") || text.includes("fatty acid")) {
    return "FFA above spec";
  }
  if (text.includes("colour") || text.includes("color") || text.includes("lovibond")) {
    return "Colour out of spec";
  }
  if (text.includes("moisture") || text.includes("h2o") || text.includes("volatile")) {
    return "Moisture above limit";
  }
  if (text.includes("peroxide") || text.includes("pv")) {
    return "PV above spec";
  }
  if (text.includes("odour") || text.includes("odor") || text.includes("smell")) {
    return "Off odour";
  }
  if (text.includes("dobi") || text.includes("bleachability")) {
    return "Low DOBI index";
  }
  if (text.includes("smp") || text.includes("slip melting") || text.includes("melting point")) {
    return "SMP out of range";
  }
  if (text.includes("cloud") || text.includes("cloud point")) {
    return "Cloud point out of range";
  }
  if (text.includes("sfc") || text.includes("solid fat")) {
    return "SFC profile out of range";
  }
  if (text.includes("earth") || text.includes("filter bleed") || text.includes("turbidity")) {
    return "Suspended earth / filter bleed";
  }
  if (text.includes("cross") || text.includes("contamination")) {
    return "Cross-contamination";
  }
  if (text.includes("wrong tank") || text.includes("tank")) {
    return "Wrong product in tank";
  }
  if (text.includes("sampling") || text.includes("sample")) {
    return "Sampling error";
  }
  
  return label || "Other Quality Deviation";
}

// Format YYYY-MM into readable month title (e.g., "October 2026")
function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === "all") return "All Shifts (All-Time MTD)";
  const parts = monthKey.split("-");
  if (parts.length !== 2) return monthKey;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${months[monthNum - 1]} ${year}`;
  }
  return monthKey;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  sheet,
  currentUser,
  isDark,
  reports,
  products: externalProducts,
  plants: externalPlants,
  tanks: externalTanks,
  onAddPlant,
  onAddTank,
  onNavigateTab,
  onUpdateReport,
}) => {
  const availableProducts = externalProducts || MOCK_PRODUCTS;
  const plantList = externalPlants || MOCK_PLANTS;
  const tankList = externalTanks || MOCK_TANKS;

  // Process Trends Telemetry
  const [activeProcessTab, setActiveProcessTab] = useState<ProcessChartTab>("combined");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<ProcessShiftFilter>("all");
  const [hoveredEntry, setHoveredEntry] = useState<LogEntry | null>(null);
  
  // Pareto & Frequency Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [nonConformanceMode, setNonConformanceMode] = useState<NonConformityFilter>("rejects_only");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string | null>(null);
  
  // Table search & inspection modal
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCertificateReport, setActiveCertificateReport] = useState<SampleReport | null>(null);

  // Lock body scroll when certificate modal is open
  useEffect(() => {
    if (activeCertificateReport) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeCertificateReport]);

  // Reset reason filter if month or non-conformance mode changes
  useEffect(() => {
    setSelectedReasonFilter(null);
  }, [selectedMonth, nonConformanceMode]);

  // =========================================================================
  // 1. DYNAMIC MONTH LIST EXTRACTION
  // =========================================================================
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    reports.forEach((r) => {
      if (r.sample_date && /^\d{4}-\d{2}/.test(r.sample_date)) {
        monthsSet.add(r.sample_date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // =========================================================================
  // 2. DATA FILTERING BY SELECTED MONTH
  // =========================================================================
  const monthFilteredReports = useMemo(() => {
    if (selectedMonth === "all") return reports;
    return reports.filter((r) => r.sample_date && r.sample_date.startsWith(selectedMonth));
  }, [reports, selectedMonth]);

  // Evaluated Reports (QC decided)
  const evaluatedReports = useMemo(() => {
    return monthFilteredReports.filter(
      (r) => r.decision && (r.decision.decision === "accept" || r.decision.decision === "accept_concession" || r.decision.decision === "reject")
    );
  }, [monthFilteredReports]);

  // Counts in current month scope
  const totalEvaluatedCount = evaluatedReports.length;
  const totalRejectedCount = useMemo(() => {
    return evaluatedReports.filter((r) => r.decision?.decision === "reject").length;
  }, [evaluatedReports]);

  const totalConcessionsCount = useMemo(() => {
    return evaluatedReports.filter((r) => r.decision?.decision === "accept_concession").length;
  }, [evaluatedReports]);

  const totalAcceptedCount = useMemo(() => {
    return evaluatedReports.filter((r) => r.decision?.decision === "accept" || r.decision?.decision === "accept_concession").length;
  }, [evaluatedReports]);

  const overallRejectionRate = totalEvaluatedCount > 0 ? (totalRejectedCount / totalEvaluatedCount) * 100 : 0;

  // Non-conforming reports according to mode
  const nonConformingReports = useMemo(() => {
    return evaluatedReports.filter((r) => {
      const dec = r.decision?.decision;
      if (nonConformanceMode === "rejects_only") {
        return dec === "reject";
      }
      return dec === "reject" || dec === "accept_concession";
    });
  }, [evaluatedReports, nonConformanceMode]);

  // Sorted list for registry table
  const sortedNonConformingReports = useMemo(() => {
    return [...nonConformingReports].sort((a, b) => {
      const dateA = a.decision?.decided_at || a.created_at || a.sample_date || "";
      const dateB = b.decision?.decided_at || b.created_at || b.sample_date || "";
      return dateB.localeCompare(dateA);
    });
  }, [nonConformingReports]);

  // Filtered lots for the bottom traceability table
  const filteredTableLots = useMemo(() => {
    return sortedNonConformingReports.filter((r) => {
      // Reason filter if clicked from Pareto
      if (selectedReasonFilter) {
        const norm = normalizeReason(r.decision?.reason_label, r.decision?.reason_id);
        if (norm !== selectedReasonFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const lot = (r.lot_no || "").toLowerCase();
        const rep = (r.report_no || "").toLowerCase();
        const prod = (r.product_name || "").toLowerCase();
        const officer = (r.decision?.decided_by_name || "").toLowerCase();
        const reason = (r.decision?.reason_label || "").toLowerCase();
        const detail = (r.decision?.reason_detail || "").toLowerCase();
        const disp = (r.decision?.disposition || "").toLowerCase();
        const fTank = (r.feed_tank_code || "").toLowerCase();
        const dTank = (r.discharge_tank_code || "").toLowerCase();
        const failedParams = (r.decision?.failed_parameters || []).join(" ").toLowerCase();

        const matches = 
          lot.includes(query) ||
          rep.includes(query) ||
          prod.includes(query) ||
          officer.includes(query) ||
          reason.includes(query) ||
          detail.includes(query) ||
          disp.includes(query) ||
          fTank.includes(query) ||
          dTank.includes(query) ||
          failedParams.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [sortedNonConformingReports, selectedReasonFilter, searchQuery]);

  // =========================================================================
  // 3. QC REJECTION PARETO ANALYSIS BY REASON CODE
  // =========================================================================
  const paretoData = useMemo(() => {
    const countsMap: { [key: string]: number } = {};

    nonConformingReports.forEach((r) => {
      const normReason = normalizeReason(r.decision?.reason_label, r.decision?.reason_id);
      countsMap[normReason] = (countsMap[normReason] || 0) + 1;
    });

    const entries = Object.entries(countsMap)
      .filter(([_, count]) => count > 0)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const totalCount = entries.reduce((acc, curr) => acc + curr.count, 0);

    let cumulative = 0;
    return entries.map((item) => {
      cumulative += item.count;
      const cumulativePercent = totalCount > 0 ? Math.round((cumulative / totalCount) * 100) : 0;
      return {
        reason: item.reason,
        count: item.count,
        cumulative: cumulativePercent,
      };
    });
  }, [nonConformingReports]);

  const maxParetoCount = useMemo(() => {
    return Math.max(1, ...paretoData.map((p) => p.count));
  }, [paretoData]);

  const totalParetoRejections = useMemo(() => {
    return paretoData.reduce((acc, curr) => acc + curr.count, 0);
  }, [paretoData]);

  // Top two defect causes for Pareto insight text
  const topParetoDefects = useMemo(() => paretoData.slice(0, 2), [paretoData]);

  // =========================================================================
  // 4. LOT REJECTION FREQUENCY BY PRODUCT
  // =========================================================================
  const productFrequencyData = useMemo(() => {
    const productStats: { [key: string]: { lots: number; rejects: number; concessions: number } } = {};

    // Populate from all evaluated reports in scope
    evaluatedReports.forEach((report) => {
      let prodName = (report.product_name || "").trim();
      if (!prodName) prodName = "Other Product";

      if (!productStats[prodName]) {
        productStats[prodName] = { lots: 0, rejects: 0, concessions: 0 };
      }

      productStats[prodName].lots += 1;
      if (report.decision?.decision === "reject") {
        productStats[prodName].rejects += 1;
      } else if (report.decision?.decision === "accept_concession") {
        productStats[prodName].concessions += 1;
      }
    });

    return Object.entries(productStats)
      .map(([product, stats]) => ({
        product,
        lots: stats.lots,
        rejects: stats.rejects,
        concessions: stats.concessions,
        effectiveRejects: nonConformanceMode === "rejects_only" ? stats.rejects : stats.rejects + stats.concessions,
      }))
      .sort((a, b) => b.effectiveRejects - a.effectiveRejects || b.lots - a.lots);
  }, [evaluatedReports, nonConformanceMode]);

  const maxProductLots = useMemo(() => {
    return Math.max(1, ...productFrequencyData.map((p) => p.lots));
  }, [productFrequencyData]);

  const highestNonConformanceProduct = useMemo(() => {
    return productFrequencyData.length > 0 ? productFrequencyData[0] : null;
  }, [productFrequencyData]);

  // =========================================================================
  // 5. PROCESS TRENDS TELEMETRY DATA (SYNCHRONIZED WITH BLEACHING LOG)
  // =========================================================================
  const sheetEntries: LogEntry[] = useMemo(() => {
    return sheet?.entries || [];
  }, [sheet?.entries]);

  // Filter entries based on selected shift
  const filteredProcessEntries = useMemo(() => {
    if (selectedShiftFilter === "1") {
      return sheetEntries.filter((e) => e.shift === 1);
    }
    if (selectedShiftFilter === "2") {
      return sheetEntries.filter((e) => e.shift === 2);
    }
    if (selectedShiftFilter === "3") {
      return sheetEntries.filter((e) => e.shift === 3);
    }
    return sheetEntries;
  }, [sheetEntries, selectedShiftFilter]);

  // Saved entries metrics
  const savedEntries = useMemo(() => {
    return sheetEntries.filter((e) => e.is_saved);
  }, [sheetEntries]);

  // HE Temp metrics (spec: 70.0 - 115.0 °C)
  const heTempEntries = useMemo(() => {
    return savedEntries.filter((e) => typeof e.he_temp_c === "number" && !isNaN(e.he_temp_c));
  }, [savedEntries]);

  const latestHeTemp = heTempEntries.length > 0 ? heTempEntries[heTempEntries.length - 1].he_temp_c : null;
  const avgHeTemp = heTempEntries.length > 0
    ? (heTempEntries.reduce((sum, e) => sum + (e.he_temp_c || 0), 0) / heTempEntries.length).toFixed(1)
    : null;
  const minHeTemp = heTempEntries.length > 0
    ? Math.min(...heTempEntries.map((e) => e.he_temp_c as number)).toFixed(1)
    : null;
  const maxHeTemp = heTempEntries.length > 0
    ? Math.max(...heTempEntries.map((e) => e.he_temp_c as number)).toFixed(1)
    : null;
  const outOfSpecHeTempCount = heTempEntries.filter((e) => (e.he_temp_c as number) < 70 || (e.he_temp_c as number) > 115).length;

  // Bleacher Vacuum metrics (spec: >= 600.0 mmHg)
  const vacuumEntries = useMemo(() => {
    return savedEntries.filter((e) => typeof e.vacuum_mmhg === "number" && !isNaN(e.vacuum_mmhg));
  }, [savedEntries]);

  const latestVacuum = vacuumEntries.length > 0 ? vacuumEntries[vacuumEntries.length - 1].vacuum_mmhg : null;
  const avgVacuum = vacuumEntries.length > 0
    ? (vacuumEntries.reduce((sum, e) => sum + (e.vacuum_mmhg || 0), 0) / vacuumEntries.length).toFixed(1)
    : null;
  const minVacuum = vacuumEntries.length > 0
    ? Math.min(...vacuumEntries.map((e) => e.vacuum_mmhg as number)).toFixed(1)
    : null;
  const maxVacuum = vacuumEntries.length > 0
    ? Math.max(...vacuumEntries.map((e) => e.vacuum_mmhg as number)).toFixed(1)
    : null;
  const outOfSpecVacuumCount = vacuumEntries.filter((e) => (e.vacuum_mmhg as number) < 600).length;

  // Overall Process Compliance Rate (%)
  const totalLoggedParams = heTempEntries.length + vacuumEntries.length;
  const totalProcessViolations = outOfSpecHeTempCount + outOfSpecVacuumCount;
  const processComplianceRate = totalLoggedParams > 0
    ? Math.max(0, Math.round(((totalLoggedParams - totalProcessViolations) / totalLoggedParams) * 100))
    : 100;

  // =========================================================================
  // 5B. SVG TELEMETRY CHART GEOMETRY & PATH GENERATION
  // =========================================================================
  const chartWidth = 920;
  const chartHeight = 280;
  const padLeft = 65;
  const padRight = 65;
  const padTop = 35;
  const padBottom = 45;
  const plotWidth = chartWidth - padLeft - padRight; // 790
  const plotHeight = chartHeight - padTop - padBottom; // 200

  // HE Temp Scale: 50°C to 130°C (range 80)
  const minTempY = 50;
  const maxTempY = 130;
  const getTempY = (val: number) => {
    const clamped = Math.max(minTempY, Math.min(maxTempY, val));
    return padTop + (1 - (clamped - minTempY) / (maxTempY - minTempY)) * plotHeight;
  };

  // Bleacher Vacuum Scale: 500 mmHg to 760 mmHg (range 260)
  const minVacY = 500;
  const maxVacY = 760;
  const getVacY = (val: number) => {
    const clamped = Math.max(minVacY, Math.min(maxVacY, val));
    return padTop + (1 - (clamped - minVacY) / (maxVacY - minVacY)) * plotHeight;
  };

  const getSlotX = (index: number, total: number) => {
    if (total <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (total - 1)) * plotWidth;
  };

  // Mapped HE Temp Points for filtered entries
  const mappedTempPoints = useMemo(() => {
    const total = filteredProcessEntries.length;
    return filteredProcessEntries
      .map((entry, idx) => {
        const hasVal = typeof entry.he_temp_c === "number" && !isNaN(entry.he_temp_c);
        return {
          entry,
          index: idx,
          hasVal,
          x: getSlotX(idx, total),
          y: hasVal ? getTempY(entry.he_temp_c as number) : null,
          val: entry.he_temp_c,
          inSpec: hasVal ? (entry.he_temp_c as number) >= 70 && (entry.he_temp_c as number) <= 115 : true,
        };
      })
      .filter((pt) => pt.hasVal && pt.y !== null);
  }, [filteredProcessEntries, padLeft, plotWidth, padTop, plotHeight]);

  // Mapped Bleacher Vacuum Points for filtered entries
  const mappedVacPoints = useMemo(() => {
    const total = filteredProcessEntries.length;
    return filteredProcessEntries
      .map((entry, idx) => {
        const hasVal = typeof entry.vacuum_mmhg === "number" && !isNaN(entry.vacuum_mmhg);
        return {
          entry,
          index: idx,
          hasVal,
          x: getSlotX(idx, total),
          y: hasVal ? getVacY(entry.vacuum_mmhg as number) : null,
          val: entry.vacuum_mmhg,
          inSpec: hasVal ? (entry.vacuum_mmhg as number) >= 600 : true,
        };
      })
      .filter((pt) => pt.hasVal && pt.y !== null);
  }, [filteredProcessEntries, padLeft, plotWidth, padTop, plotHeight]);

  const tempLinePath = useMemo(() => {
    if (mappedTempPoints.length === 0) return "";
    if (mappedTempPoints.length === 1) {
      return `M ${mappedTempPoints[0].x} ${mappedTempPoints[0].y} L ${mappedTempPoints[0].x + 0.1} ${mappedTempPoints[0].y}`;
    }
    return mappedTempPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");
  }, [mappedTempPoints]);

  const tempAreaPath = useMemo(() => {
    if (mappedTempPoints.length < 2) return "";
    const baseY = padTop + plotHeight;
    return `${tempLinePath} L ${mappedTempPoints[mappedTempPoints.length - 1].x} ${baseY} L ${mappedTempPoints[0].x} ${baseY} Z`;
  }, [mappedTempPoints, tempLinePath, padTop, plotHeight]);

  const vacLinePath = useMemo(() => {
    if (mappedVacPoints.length === 0) return "";
    if (mappedVacPoints.length === 1) {
      return `M ${mappedVacPoints[0].x} ${mappedVacPoints[0].y} L ${mappedVacPoints[0].x + 0.1} ${mappedVacPoints[0].y}`;
    }
    return mappedVacPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");
  }, [mappedVacPoints]);

  const vacAreaPath = useMemo(() => {
    if (mappedVacPoints.length < 2) return "";
    const baseY = padTop + plotHeight;
    return `${vacLinePath} L ${mappedVacPoints[mappedVacPoints.length - 1].x} ${baseY} L ${mappedVacPoints[0].x} ${baseY} Z`;
  }, [mappedVacPoints, vacLinePath, padTop, plotHeight]);

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY TITLE                                           */}
      {/* ========================================================================= */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-3.5 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/15 to-amber-700/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-display px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Master Data Analytics
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-zinc-900 dark:text-white mt-1">
              QC Rejection Pareto &amp; Product Frequency
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Defect reason distribution Pareto telemetry, lot rejection frequencies by finished product, and batch operating parameters.
            </p>
          </div>
        </div>
      </div>

      {/* QC REJECTION PARETO & PRODUCT FREQUENCY (ANALYTICS MIRROR) */}
      <div className="space-y-6">
          {/* Top KPI Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="telemetry-card p-4 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider font-display">Lots Evaluated</span>
                <Boxes className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
                {totalEvaluatedCount}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Total QC release evaluations</p>
            </div>

            <div className="telemetry-card p-4 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider font-display">Accepted Lots</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalAcceptedCount}
              </div>
              <p className="text-xs text-emerald-600/80 mt-1">
                {totalEvaluatedCount > 0 ? ((totalAcceptedCount / totalEvaluatedCount) * 100).toFixed(1) : 100}% Release Yield
              </p>
            </div>

            <div className="telemetry-card p-4 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider font-display">Rejected / Hold Lots</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {totalRejectedCount}
              </div>
              <p className="text-xs text-rose-600/80 mt-1">
                {overallRejectionRate.toFixed(1)}% Rejection Rate
              </p>
            </div>

            <div className="telemetry-card p-4 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider font-display">Primary Defect Cause</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold font-display text-amber-600 dark:text-amber-400 truncate mt-1">
                {paretoData.length > 0 ? paretoData[0].reason : "None (All In-Spec)"}
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">
                {paretoData.length > 0 ? `${paretoData[0].count} occurrences (${Math.round((paretoData[0].count / Math.max(totalParetoRejections, 1)) * 100)}%)` : "Zero defects logged"}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLEACHING PROCESS TELEMETRY & DYNAMIC TREND CURVES (HE TEMP & VACUUM)     */}
          {/* ========================================================================= */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-5">
            {/* Top Header & Interactive Controls Bar */}
            <div className="space-y-4 border-b border-zinc-200 dark:border-white/10 pb-4">
              {/* Row 1: Title, Subtitle, and Clean Metadata Info */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">
                    Bleaching Process Telemetry &amp; Dynamic Trend Curves
                  </h2>

                  {/* Clean Inline Metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>
                      Line: <strong className="text-zinc-800 dark:text-zinc-200">{sheet?.plant_name || sheet?.plant_id || "Plant 1"}</strong>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700 font-bold">·</span>
                    <span>
                      Product: <strong className="text-zinc-800 dark:text-zinc-200">{sheet?.product_name || "Refined Oil"}</strong>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700 font-bold">·</span>
                    <span>
                      Shift Date: <strong className="text-zinc-800 dark:text-zinc-200">{sheet?.sheet_date || "Current Log"}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Live Heat Exchanger Temperature (HE Temp °C) and Bleacher Vacuum (mmHg) mapped dynamically from operator hourly log records.
                </p>
              </div>

              {/* Row 2: Dedicated Filter & Series Controls Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200/60 dark:border-white/5">
                {/* Series Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                    Series:
                  </span>
                  <GliderRadioGroup<ProcessChartTab>
                    value={activeProcessTab}
                    onChange={(val) => setActiveProcessTab(val)}
                    themeColor="amber"
                    size="sm"
                    variant="rounded"
                    options={[
                      { value: "combined", label: "Dual Series", icon: <Layers className="w-3.5 h-3.5" /> },
                      { value: "he_temp", label: "HE Temp (°C)", icon: <Thermometer className="w-3.5 h-3.5 text-amber-500" /> },
                      { value: "vacuum", label: "Vacuum (mmHg)", icon: <Gauge className="w-3.5 h-3.5 text-sky-500" /> },
                    ]}
                  />
                </div>

                {/* Shift Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                    Shift Range:
                  </span>
                  <GliderRadioGroup<ProcessShiftFilter>
                    value={selectedShiftFilter}
                    onChange={(val) => setSelectedShiftFilter(val)}
                    themeColor="zinc"
                    size="sm"
                    variant="rounded"
                    options={[
                      { value: "all", label: "All 24h" },
                      { value: "1", label: "Shift 1 (Morning)" },
                      { value: "2", label: "Shift 2 (Afternoon)" },
                      { value: "3", label: "Shift 3 (Night)" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* 4 Real-time Telemetry Highlights Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: HE Temperature */}
              <div className="telemetry-card p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/5">
                <div className="flex items-center justify-between text-zinc-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider font-display">HE Temp (°C)</span>
                  <Thermometer className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    {latestHeTemp !== null ? `${latestHeTemp}°C` : "--"}
                  </span>
                  {latestHeTemp !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      latestHeTemp >= 70 && latestHeTemp <= 115
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}>
                      {latestHeTemp >= 70 && latestHeTemp <= 115 ? "In-Spec" : "Alarm"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Spec: 70.0 - 115.0 °C (Avg: {avgHeTemp ?? "--"}°C)
                </p>
              </div>

              {/* Card 2: Bleacher Vacuum */}
              <div className="telemetry-card p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/5">
                <div className="flex items-center justify-between text-zinc-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Bleacher Vacuum</span>
                  <Gauge className="w-4 h-4 text-sky-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                    {latestVacuum !== null ? `${latestVacuum} mmHg` : "--"}
                  </span>
                  {latestVacuum !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      latestVacuum >= 600
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}>
                      {latestVacuum >= 600 ? "Optimal" : "Low Vac"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Spec: ≥ 600.0 mmHg (Avg: {avgVacuum ?? "--"} mmHg)
                </p>
              </div>

              {/* Card 3: Out of Spec Alarms */}
              <div className="telemetry-card p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/5">
                <div className="flex items-center justify-between text-zinc-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Alarm Deviations</span>
                  <AlertTriangle className={`w-4 h-4 ${totalProcessViolations > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`} />
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums">
                  <span className={totalProcessViolations > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                    {totalProcessViolations}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 ml-2">violations</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {outOfSpecHeTempCount} Temp alarms, {outOfSpecVacuumCount} Vacuum alarms
                </p>
              </div>

              {/* Card 4: Parameter Stability */}
              <div className="telemetry-card p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/5">
                <div className="flex items-center justify-between text-zinc-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Process Stability</span>
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {processComplianceRate}%
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {savedEntries.length} of {sheetEntries.length || 24} hourly readings verified
                </p>
              </div>
            </div>

            {/* High-Resolution SVG Responsive Graph */}
            <div className="w-full h-80 sm:h-96 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-200/80 dark:border-white/10 p-4 relative overflow-hidden flex flex-col justify-between">
              {/* SVG Curve Canvas */}
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  {/* HE Temp Area Gradient */}
                  <linearGradient id="heTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Vacuum Area Gradient */}
                  <linearGradient id="vacGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
                  </linearGradient>

                  {/* HE Temp Target Band (70 - 115 C) */}
                  <linearGradient id="heBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                  </linearGradient>

                  {/* Vacuum Optimal Band (620 - 720 mmHg) */}
                  <linearGradient id="vacBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal reference lines */}
                {[130, 115, 100, 85, 70, 50].map((temp, i) => {
                  const y = getTempY(temp);
                  return (
                    <line
                      key={`grid-${i}`}
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotWidth}
                      y2={y}
                      stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* HE Temp Target Operating Band (70.0 - 115.0 °C) */}
                <rect
                  x={padLeft}
                  y={getTempY(115)}
                  width={plotWidth}
                  height={Math.max(0, getTempY(70) - getTempY(115))}
                  fill="url(#heBandGrad)"
                  rx="4"
                />
                {/* 115°C Max Limit Line */}
                <line
                  x1={padLeft}
                  y1={getTempY(115)}
                  x2={padLeft + plotWidth}
                  y2={getTempY(115)}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                  opacity="0.85"
                />
                {/* 70°C Min Limit Line */}
                <line
                  x1={padLeft}
                  y1={getTempY(70)}
                  x2={padLeft + plotWidth}
                  y2={getTempY(70)}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                  opacity="0.85"
                />
                {/* 100°C Setpoint Target Guide */}
                <line
                  x1={padLeft}
                  y1={getTempY(100)}
                  x2={padLeft + plotWidth}
                  y2={getTempY(100)}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                  opacity="0.5"
                />

                {/* Vacuum Optimal Zone (620 - 720 mmHg) */}
                <rect
                  x={padLeft}
                  y={getVacY(720)}
                  width={plotWidth}
                  height={Math.max(0, getVacY(620) - getVacY(720))}
                  fill="url(#vacBandGrad)"
                  rx="4"
                />
                {/* Vacuum Critical Minimum Limit Line (600.0 mmHg) */}
                <line
                  x1={padLeft}
                  y1={getVacY(600)}
                  x2={padLeft + plotWidth}
                  y2={getVacY(600)}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.9"
                />

                {/* Y-Axis Left Labels (HE Temp °C in Amber) */}
                <text x={padLeft - 10} y={getTempY(130) + 4} fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="end">130°C</text>
                <text x={padLeft - 10} y={getTempY(115) + 4} fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="end">115°C (Max)</text>
                <text x={padLeft - 10} y={getTempY(100) + 4} fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="end">100°C (Set)</text>
                <text x={padLeft - 10} y={getTempY(70) + 4} fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="end">70°C (Min)</text>
                <text x={padLeft - 10} y={getTempY(50) + 4} fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="end">50°C</text>

                {/* Y-Axis Right Labels (Bleacher Vacuum mmHg in Sky) */}
                <text x={padLeft + plotWidth + 10} y={getVacY(760) + 4} fill="#0284c7" fontSize="11" fontFamily="monospace" textAnchor="start">760</text>
                <text x={padLeft + plotWidth + 10} y={getVacY(720) + 4} fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="start">720 (Opt)</text>
                <text x={padLeft + plotWidth + 10} y={getVacY(650) + 4} fill="#0284c7" fontSize="11" fontFamily="monospace" textAnchor="start">650</text>
                <text x={padLeft + plotWidth + 10} y={getVacY(600) + 4} fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="start">600 (Min)</text>
                <text x={padLeft + plotWidth + 10} y={getVacY(500) + 4} fill="#0284c7" fontSize="11" fontFamily="monospace" textAnchor="start">500 mmHg</text>

                {/* HE Temp Area & Curve Rendering */}
                {(activeProcessTab === "combined" || activeProcessTab === "he_temp") && (
                  <>
                    {tempAreaPath && (
                      <path d={tempAreaPath} fill="url(#heTempGrad)" />
                    )}
                    {tempLinePath && (
                      <path
                        d={tempLinePath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* HE Temp Data Point Nodes */}
                    {mappedTempPoints.map((pt, i) => {
                      const isHovered = hoveredEntry?.slot_index === pt.entry.slot_index;
                      return (
                        <g
                          key={`temp-pt-${i}`}
                          className="cursor-pointer transition-transform duration-150"
                          onMouseEnter={() => setHoveredEntry(pt.entry)}
                          onClick={() => setHoveredEntry(pt.entry)}
                        >
                          {isHovered && (
                            <circle
                              cx={pt.x}
                              cy={pt.y!}
                              r="10"
                              fill="#f59e0b"
                              fillOpacity="0.25"
                              className="animate-ping"
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y!}
                            r={isHovered ? "6" : "4.5"}
                            fill={pt.inSpec ? "#f59e0b" : "#ef4444"}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="drop-shadow-md"
                          />
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Bleacher Vacuum Area & Curve Rendering */}
                {(activeProcessTab === "combined" || activeProcessTab === "vacuum") && (
                  <>
                    {vacAreaPath && (
                      <path d={vacAreaPath} fill="url(#vacGrad)" />
                    )}
                    {vacLinePath && (
                      <path
                        d={vacLinePath}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* Vacuum Data Point Nodes */}
                    {mappedVacPoints.map((pt, i) => {
                      const isHovered = hoveredEntry?.slot_index === pt.entry.slot_index;
                      return (
                        <g
                          key={`vac-pt-${i}`}
                          className="cursor-pointer transition-transform duration-150"
                          onMouseEnter={() => setHoveredEntry(pt.entry)}
                          onClick={() => setHoveredEntry(pt.entry)}
                        >
                          {isHovered && (
                            <circle
                              cx={pt.x}
                              cy={pt.y!}
                              r="10"
                              fill="#0284c7"
                              fillOpacity="0.25"
                              className="animate-ping"
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y!}
                            r={isHovered ? "6" : "4.5"}
                            fill={pt.inSpec ? "#00d2ff" : "#ef4444"}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="drop-shadow-md"
                          />
                        </g>
                      );
                    })}
                  </>
                )}

                {/* X-Axis Timeline Markers */}
                {filteredProcessEntries.map((entry, idx) => {
                  const step = filteredProcessEntries.length <= 8 ? 1 : filteredProcessEntries.length <= 16 ? 2 : 3;
                  if (idx % step !== 0 && idx !== filteredProcessEntries.length - 1) return null;
                  const x = getSlotX(idx, filteredProcessEntries.length);
                  return (
                    <text
                      key={`time-axis-${idx}`}
                      x={x}
                      y={chartHeight - 12}
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      fontSize="11"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {entry.time_label}
                    </text>
                  );
                })}
              </svg>

              {/* Zero-Entries Fallback Banner when no logs are saved */}
              {mappedTempPoints.length === 0 && mappedVacPoints.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-xs p-6 text-center z-10">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3">
                    <Activity className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                    No Hourly Operator Logs Recorded for Selected Range
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1 mb-4 font-medium">
                    When operators input hourly Heat Exchanger Temperature (°C) and Bleacher Vacuum (mmHg) in the Bleaching Log tab, this trend graph will dynamically plot real-time curves.
                  </p>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("bleaching")}
                      className="btn-premium-amber px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Bleaching Log to Enter Readings</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Inspection HUD (Active when hovering or clicking a node) */}
            {hoveredEntry && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-100 to-sky-500/10 dark:from-amber-500/10 dark:via-zinc-900 dark:to-sky-500/10 border border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-mono font-bold">
                    Slot {hoveredEntry.time_label} (Shift {hoveredEntry.shift})
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span className="text-zinc-500">HE Temp:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {hoveredEntry.he_temp_c !== null ? `${hoveredEntry.he_temp_c}°C` : "Not logged"}
                    </span>
                    {hoveredEntry.he_temp_c !== null && (
                      <span className={`px-1.5 py-0.2 rounded text-xs font-semibold ${
                        hoveredEntry.he_temp_c >= 70 && hoveredEntry.he_temp_c <= 115
                          ? "text-emerald-600 bg-emerald-500/10"
                          : "text-rose-600 bg-rose-500/10"
                      }`}>
                        {hoveredEntry.he_temp_c >= 70 && hoveredEntry.he_temp_c <= 115 ? "70-115°C (In-Spec)" : "Out of Spec"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Gauge className="w-4 h-4 text-sky-500" />
                    <span className="text-zinc-500">Vacuum:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {hoveredEntry.vacuum_mmhg !== null ? `${hoveredEntry.vacuum_mmhg} mmHg` : "Not logged"}
                    </span>
                    {hoveredEntry.vacuum_mmhg !== null && (
                      <span className={`px-1.5 py-0.2 rounded text-xs font-semibold ${
                        hoveredEntry.vacuum_mmhg >= 600
                          ? "text-emerald-600 bg-emerald-500/10"
                          : "text-rose-600 bg-rose-500/10"
                      }`}>
                        {hoveredEntry.vacuum_mmhg >= 600 ? "≥600 mmHg (Optimal)" : "Low Vacuum"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Operator: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{hoveredEntry.entered_by_name || hoveredEntry.entered_by || "Assigned Operator"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHoveredEntry(null)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Clear Inspection
                </button>
              </div>
            )}

            {/* Chart Legend & Telemetry Status Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-500 pt-3 border-t border-zinc-200 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span>HE Temp (°C) [70.0 - 115.0 °C Target Band]</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                  <span>Bleacher Vacuum (mmHg) [≥ 600.0 mmHg Alarm Limit]</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-2 rounded bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Safe Operating Bands</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 border-t border-dashed border-rose-500" />
                  <span>Alarm Trigger Limit (600 mmHg)</span>
                </span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className={processComplianceRate >= 95 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                  {processComplianceRate}% In-Spec Compliance
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE 2-COLUMN BENTO GRID: QC REJECTION PARETO & LOT FREQUENCY              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ----------------------------------------------------------------------- */}
            {/* LEFT CARD: QC REJECTION PARETO BY REASON CODE                            */}
            {/* ----------------------------------------------------------------------- */}
            <div className="glass-panel rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header with Title, Live Synced Badge, Month filter & Mode toggle */}
                <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold font-display text-base text-zinc-900 dark:text-white">
                      {selectedMonth === "all" ? "QC Rejection Pareto by Reason Code" : `Monthly QC Rejection Pareto (${formatMonthLabel(selectedMonth)})`}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {totalRejectedCount} {totalRejectedCount === 1 ? "rejection" : "rejections"}
                      {totalConcessionsCount > 0 ? ` (${totalConcessionsCount} concessions)` : ""} across {totalEvaluatedCount} lots
                    </span>
                  </div>

                  {/* Month Dropdown & Segments Toggle */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedReasonFilter(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Shifts (All-Time MTD)</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>{formatMonthLabel(m)}</option>
                      ))}
                    </select>

                    <GliderRadioGroup<NonConformityFilter>
                      value={nonConformanceMode}
                      onChange={(val) => setNonConformanceMode(val)}
                      themeColor="dynamic"
                      size="xs"
                      variant="rounded"
                      options={[
                        {
                          value: "rejects_only",
                          label: "Rejects",
                          notification: totalRejectedCount,
                          activeColor: "rose",
                        },
                        {
                          value: "all_non_conformances",
                          label: "+ Concessions",
                          notification: totalRejectedCount + totalConcessionsCount,
                          activeColor: "amber",
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Pareto Rows Body */}
                <div className="p-4 sm:p-5 space-y-2">
                  {paretoData.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 space-y-1">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                        No QC {nonConformanceMode === "rejects_only" ? "rejections" : "non-conformances"} logged
                        {selectedMonth !== "all" ? ` for ${formatMonthLabel(selectedMonth)}` : ""}.
                      </p>
                      <p className="text-xs text-zinc-400">
                        100% of tested lots meet analytical quality specifications.
                      </p>
                    </div>
                  ) : (
                    paretoData.map((item) => {
                      const barPercent = Math.round((item.count / maxParetoCount) * 100);
                      const isFiltered = selectedReasonFilter === item.reason;

                      return (
                        <div
                          key={item.reason}
                          onClick={() => {
                            setSelectedReasonFilter((prev) => (prev === item.reason ? null : item.reason));
                            const registryEl = document.getElementById("rejected-lots-registry");
                            if (registryEl) {
                              registryEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                          }}
                          className={`grid grid-cols-[160px_1fr_75px] items-center gap-3 cursor-pointer rounded-xl p-2.5 transition-all ${
                            isFiltered
                              ? "bg-rose-500/15 border border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                              : "hover:bg-zinc-100/70 dark:hover:bg-white/[0.03] border border-transparent"
                          }`}
                          title={`Click to filter rejected lots registry by: ${item.reason}`}
                        >
                          {/* Reason Label & FILTERED Chip */}
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span 
                              title={item.reason}
                              className={`text-xs truncate ${
                                isFiltered 
                                  ? "font-bold text-rose-600 dark:text-rose-400" 
                                  : "font-semibold text-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {item.reason}
                            </span>
                            {isFiltered && (
                              <span className="px-1.5 py-0.2 rounded text-xs font-extrabold bg-rose-600 text-white shrink-0 tracking-wider">
                                FILTERED
                              </span>
                            )}
                          </div>

                          {/* Horizontal Pareto Bar */}
                          <div className="w-full bg-zinc-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${barPercent}%` }}
                              className="h-full bg-rose-600 rounded-full transition-all duration-500"
                            />
                          </div>

                          {/* Count & Cumulative % */}
                          <div className="text-right flex items-center justify-end gap-2 font-mono text-xs">
                            <b className={`tabular-nums ${isFiltered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-zinc-900 dark:text-white"}`}>
                              {item.count}
                            </b>
                            <span className="text-zinc-400 tabular-nums w-8 text-right">
                              {item.cumulative}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pareto Insight Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-black/30 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {totalParetoRejections === 0 ? (
                    "0 rejections tracked. All inspected lots passed quality release specifications."
                  ) : totalParetoRejections === 1 ? (
                    <span>
                      <strong className="text-zinc-900 dark:text-white">{topParetoDefects[0]?.reason}</strong> accounts for 100% of the 1 tracked rejection in this period.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-zinc-900 dark:text-white">{topParetoDefects[0]?.reason}</strong> and <strong className="text-zinc-900 dark:text-white">{topParetoDefects[1]?.reason}</strong> account for{" "}
                      {Math.round((((topParetoDefects[0]?.count || 0) + (topParetoDefects[1]?.count || 0)) / totalParetoRejections) * 100)}% of the {totalParetoRejections} rejections tracked.
                    </span>
                  )}
                </span>

                {selectedReasonFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedReasonFilter(null)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Clear reason filter ✕
                  </button>
                )}
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* RIGHT CARD: LOT REJECTION FREQUENCY BY PRODUCT                          */}
            {/* ----------------------------------------------------------------------- */}
            <div className="glass-panel rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header with Title, Synced Badge, and Grades count */}
                <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold font-display text-base text-zinc-900 dark:text-white">
                      Lot rejection frequency by product
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {totalEvaluatedCount} Lots ({totalRejectedCount} {totalRejectedCount === 1 ? "Rejection" : "Rejections"}
                      {totalConcessionsCount > 0 ? `, ${totalConcessionsCount} Concessions` : ""})
                    </span>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                    {productFrequencyData.length} {productFrequencyData.length === 1 ? "Product Grade" : "Product Grades"}
                  </span>
                </div>

                {/* Product Rows Body */}
                <div className="p-4 sm:p-5 space-y-2">
                  {productFrequencyData.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 space-y-1">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                        No product lots recorded in QC Management.
                      </p>
                    </div>
                  ) : (
                    productFrequencyData.map((item) => {
                      const totalBarPercent = Math.round((item.lots / maxProductLots) * 100);
                      const failRatePercent = item.lots > 0 ? Math.round((item.effectiveRejects / item.lots) * 100) : 0;

                      return (
                        <div
                          key={item.product}
                          className="grid grid-cols-[140px_1fr_140px] items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-white/[0.03] transition-all"
                        >
                          {/* Product Name */}
                          <span 
                            title={item.product}
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                          >
                            {item.product}
                          </span>

                          {/* Dual-layered Progress Bar: Grey baseline + Red overlay */}
                          <div className="relative w-full bg-zinc-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                            {/* Baseline lots bar */}
                            <div
                              style={{ width: `${totalBarPercent}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.effectiveRejects > 0 ? "bg-rose-500/30" : "bg-zinc-400 dark:bg-zinc-600"
                              }`}
                            />
                            {/* Overlaid rejection fill */}
                            {item.effectiveRejects > 0 && (
                              <div
                                style={{ width: `${(totalBarPercent * item.effectiveRejects) / item.lots}%` }}
                                className="absolute top-0 bottom-0 left-0 bg-rose-600 rounded-full transition-all duration-500"
                              />
                            )}
                          </div>

                          {/* Metrics Label */}
                          <div className="text-right text-xs font-mono tabular-nums text-zinc-500">
                            {item.lots} lots,{" "}
                            <b className={item.effectiveRejects > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-zinc-800 dark:text-zinc-200"}>
                              {item.effectiveRejects}
                            </b>{" "}
                            rej
                            {item.concessions > 0 && nonConformanceMode === "all_non_conformances" && (
                              <span className="text-amber-500 ml-1">
                                ({item.concessions}c)
                              </span>
                            )}
                            {item.effectiveRejects > 0 && (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1.5">
                                ({failRatePercent}%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Product Frequency Insight Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-black/30 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-400">
                {highestNonConformanceProduct && highestNonConformanceProduct.effectiveRejects > 0 ? (
                  <span>
                    Highest non-conformance: <strong className="text-zinc-900 dark:text-white">{highestNonConformanceProduct.product}</strong> with {highestNonConformanceProduct.effectiveRejects} of {highestNonConformanceProduct.lots} lots ({((highestNonConformanceProduct.effectiveRejects / highestNonConformanceProduct.lots) * 100).toFixed(1)}% fail rate). Synchronized live with RF-FR-001 QC Lab decisions.
                  </span>
                ) : (
                  <span>
                    All {totalEvaluatedCount} tested lots passed with 0 rejections across all product grades.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM SECTION: REJECTED LOTS & NON-CONFORMANCE TRACEABILITY LOG          */}
          {/* ========================================================================= */}
          <div id="rejected-lots-registry" className="glass-panel rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl overflow-hidden space-y-0">
            {/* Table Header & Controls Bar */}
            <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                      Rejected Lots &amp; Non-Conformance Traceability Log
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Full trace of rejected product lots, QA decision authorities, timestamps, failed analytical parameters, and dispositions.
                </p>
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Month Dropdown */}
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedReasonFilter(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Shifts (All-Time MTD)</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>

                {/* Rejects vs Concessions toggle */}
                <div className="flex items-center bg-zinc-100 dark:bg-black/40 p-0.5 rounded-xl border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setNonConformanceMode("rejects_only")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      nonConformanceMode === "rejects_only"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Rejects ({totalRejectedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNonConformanceMode("all_non_conformances")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      nonConformanceMode === "all_non_conformances"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    + Concessions ({totalRejectedCount + totalConcessionsCount})
                  </button>
                </div>

                {/* Active Reason Filter Pill with ✕ Clear */}
                {selectedReasonFilter && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <Filter className="w-3.5 h-3.5 shrink-0" />
                    <span>Reason: <strong>{selectedReasonFilter}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedReasonFilter(null)}
                      className="ml-1 p-0.5 hover:bg-rose-500/20 rounded cursor-pointer"
                      title="Clear reason filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Lot / Product / Officer..."
                    className="pl-8 pr-7 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none w-48 sm:w-56"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Count Badge */}
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {filteredTableLots.length} {filteredTableLots.length === 1 ? "Lot" : "Lots"}
                </span>
              </div>
            </div>

            {/* Traceability Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/10 font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="py-3 px-4">Lot &amp; Report No</th>
                    <th className="py-3 px-3">Product &amp; Sampling Point</th>
                    <th className="py-3 px-3">Sample Check Time</th>
                    <th className="py-3 px-3">Status &amp; Disposition</th>
                    <th className="py-3 px-3">Defect Reason &amp; Failed Parameters</th>
                    <th className="py-3 px-3">QA Decision Authority</th>
                    <th className="py-3 px-4 text-center">Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-sans">
                  {filteredTableLots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
                          <span className="font-bold text-zinc-900 dark:text-white text-sm">
                            {selectedReasonFilter 
                              ? `No lots found for reason "${selectedReasonFilter}" in ${formatMonthLabel(selectedMonth)}.`
                              : searchQuery 
                              ? `No lots match query "${searchQuery}".`
                              : `No QC ${nonConformanceMode === "rejects_only" ? "rejections" : "non-conformances"} recorded for ${formatMonthLabel(selectedMonth)}.`
                            }
                          </span>
                          <p className="text-xs text-zinc-500">
                            {selectedReasonFilter
                              ? "Try clearing the Pareto reason filter to view all lots in this month."
                              : totalConcessionsCount > 0 && nonConformanceMode === "rejects_only"
                              ? `There are ${totalConcessionsCount} concession lots in this month. Switch to "+ Concessions" to view them.`
                              : "All inspected lots passed quality specification without any rejection logged."}
                          </p>
                          <div className="flex gap-2 pt-2">
                            {selectedReasonFilter && (
                              <button
                                type="button"
                                onClick={() => setSelectedReasonFilter(null)}
                                className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                              >
                                Clear Reason Filter
                              </button>
                            )}
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                              >
                                Clear Search
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTableLots.map((report) => {
                      const isReject = report.decision?.decision === "reject";
                      const failedParams = report.decision?.failed_parameters || [];
                      const displayReason = normalizeReason(report.decision?.reason_label, report.decision?.reason_id);

                      return (
                        <tr 
                          key={report.id} 
                          className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* 1. Lot & Report No */}
                          <td className="py-3 px-4 align-top">
                            <div className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
                              {report.lot_no}
                            </div>
                            <div className="font-mono text-xs text-zinc-500 mt-0.5">
                              {report.report_no}
                            </div>
                            {(report.feed_tank_code || report.discharge_tank_code) && (
                              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <Database className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>Tank: {report.feed_tank_code || "–"} → {report.discharge_tank_code || "–"}</span>
                              </div>
                            )}
                          </td>

                          {/* 2. Product & Sampling Point */}
                          <td className="py-3 px-3 align-top">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {report.product_name || "Standard Product"}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {report.sampling_point_name || "Deodorizer Discharge"}
                            </div>
                          </td>

                          {/* 3. Sample Check Time */}
                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            <div className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                              {report.sample_date}
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>Check: {report.time_check || "–"}</span>
                            </div>
                            {report.submitted_by_name && (
                              <div className="text-xs text-zinc-400 mt-0.5">
                                Sampler: {report.submitted_by_name}
                              </div>
                            )}
                          </td>

                          {/* 4. Status & Disposition */}
                          <td className="py-3 px-3 align-top">
                            <div>
                              {isReject ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  REJECTED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  CONCESSION
                                </span>
                              )}
                            </div>
                            {report.decision?.disposition && (
                              <div className="mt-1.5">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wider">
                                  Action: {report.decision.disposition}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 5. Defect Reason & Failed Parameters */}
                          <td className="py-3 px-3 align-top max-w-xs">
                            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{displayReason}</span>
                            </div>
                            {report.decision?.reason_detail && (
                              <div className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                                {report.decision.reason_detail}
                              </div>
                            )}
                            {failedParams.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {failedParams.map((p, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* 6. QA Decision Authority */}
                          <td className="py-3 px-3 align-top">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{report.decision?.decided_by_name || "QA Authority"}</span>
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{report.decision?.decided_at ? new Date(report.decision.decided_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }) : "Logged"}</span>
                            </div>
                          </td>

                          {/* 7. Analysis View Button */}
                          <td className="py-3 px-4 align-top text-center">
                            <button
                              type="button"
                              onClick={() => setActiveCertificateReport(report)}
                              className="btn-tactile px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 bg-white dark:bg-white/5 flex items-center gap-1.5 mx-auto cursor-pointer transition-all"
                              title={`Inspect full laboratory certificate for ${report.lot_no}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-black/30 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">
                Displaying <strong className="text-zinc-900 dark:text-white">{filteredTableLots.length}</strong> of <strong className="text-zinc-900 dark:text-white">{nonConformingReports.length}</strong> non-conforming lot records for {formatMonthLabel(selectedMonth)}.
              </span>
              <span className="text-zinc-500 font-mono">
                Traceability locked to ISO 9001 / HACCP standard analytical records.
              </span>
            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* OFFICIAL QC CERTIFICATE OF ANALYSIS (RF-FR-001) MODAL                     */}
      {/* ========================================================================= */}
      <QcCertificateModal
        isOpen={Boolean(activeCertificateReport)}
        onClose={() => setActiveCertificateReport(null)}
        report={activeCertificateReport}
        currentUser={currentUser}
      />
    </div>
  );
};
