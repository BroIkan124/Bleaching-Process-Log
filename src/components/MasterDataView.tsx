"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  SampleReport, 
  UserProfile, 
  Product, 
  Plant, 
  Tank,
  ProductSpec,
  RejectionReasonCode,
  DashboardTab
} from "@/types";
import { 
  DEFAULT_PRODUCT_SPECS, 
  DEFAULT_REJECTION_REASONS,
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
  Droplets
} from "lucide-react";
import { RadioSelect } from "./RadioSelect";

interface MasterDataViewProps {
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
  onResetCleanData?: () => void;
}

type MasterSubTab = "pareto_frequency" | "product_specs" | "reason_codes" | "plants_tanks";
type ChartTab = "trays" | "bc101" | "chilling" | "steam" | "vacuum";
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
  onResetCleanData,
}) => {
  const availableProducts = externalProducts || MOCK_PRODUCTS;
  const plantList = externalPlants || MOCK_PLANTS;
  const tankList = externalTanks || MOCK_TANKS;

  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [customPlantName, setCustomPlantName] = useState("");
  const [isAddTankModalOpen, setIsAddTankModalOpen] = useState(false);
  const [customTankName, setCustomTankName] = useState("");
  const [customTankKind, setCustomTankKind] = useState<'feed' | 'discharge' | 'both'>('feed');
  
  // Navigation & Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<MasterSubTab>("pareto_frequency");
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("trays");
  
  // Pareto & Frequency Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [nonConformanceMode, setNonConformanceMode] = useState<NonConformityFilter>("rejects_only");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string | null>(null);
  
  // Table search & inspection modal
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCertificateReport, setActiveCertificateReport] = useState<SampleReport | null>(null);
  
  // Specs and Reason Masters filters
  const [specSearchQuery, setSpecSearchQuery] = useState<string>("");
  const [reasonSearchQuery, setReasonSearchQuery] = useState<string>("");

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
  // 5. PROCESS TRENDS TELEMETRY DATA (SAMPLE HOURLY PROFILES)
  // =========================================================================
  const trendPoints = useMemo(() => {
    const hours = ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000", "2100", "2200", "2300"];
    return hours.map((hour, idx) => {
      const step = idx * 0.15;
      return {
        time: hour,
        tray1: 252 + Math.sin(step) * 2.5,
        tray2: 255 + Math.cos(step) * 2.8,
        tray3: 259 + Math.sin(step * 1.2) * 3.1,
        tray4: 264.5 + Math.cos(step * 0.9) * 3.4, // Tray 4 peak
        tray5: 261 + Math.sin(step * 1.1) * 2.9,
        tray6: 256 + Math.cos(step * 1.3) * 2.4,
        tray7: 251.5 + Math.sin(step) * 2.1,
        bc101In: 32 + Math.sin(step) * 2.0,
        bc101Out: 41.5 + Math.cos(step) * 2.5,
        chillIn: 9.5 + Math.sin(step * 0.8) * 1.5,
        chillOut: 13.2 + Math.cos(step * 0.8) * 1.8,
        traySteam: 3.02 + Math.sin(step) * 0.12,
        boosterPress: 2.85 + Math.cos(step) * 0.15,
        ejectorPress: 2.4 + Math.sin(step * 0.7) * 0.18,
        vacuum: 3.2 + Math.sin(step * 1.4) * 0.65,
      };
    });
  }, []);

  // =========================================================================
  // 6. QUICK ACTIONS & SIMULATIONS
  // =========================================================================
  const handleSimulateQuickTestRejection = () => {
    if (!onUpdateReport) return;
    const testSample: SampleReport = {
      id: `test-reject-${Date.now()}`,
      report_no: `SAR-2026-TEST${Math.floor(1000 + Math.random() * 9000)}`,
      sample_date: new Date().toISOString().split("T")[0],
      time_check: new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false }),
      lot_no: `LOT-TEST-DEFECT-${Math.floor(100 + Math.random() * 900)}`,
      product_name: "CHOCOHI 357A NPHO",
      feed_tank_code: "TK-101",
      discharge_tank_code: "TK-201",
      submitted_by_name: currentUser.name,
      status: "decided",
      created_at: new Date().toISOString(),
      results: [
        {
          id: `res-${Date.now()}-1`,
          report_id: `test-reject-${Date.now()}`,
          parameter_code: "FFA",
          parameter_name: "Free Fatty Acid",
          unit: "%",
          value_numeric: 0.082,
          in_spec: false,
        },
        {
          id: `res-${Date.now()}-2`,
          report_id: `test-reject-${Date.now()}`,
          parameter_code: "COLOUR_R",
          parameter_name: 'Colour Red (5.25")',
          unit: "Lovibond",
          value_numeric: 3.4,
          in_spec: false,
        }
      ],
      decision: {
        id: `dec-${Date.now()}`,
        report_id: `test-reject-${Date.now()}`,
        decision: "reject",
        reason_id: "QC-REAS-01",
        reason_label: "Free Fatty Acid (FFA) Exceeds Max Limit",
        reason_detail: "Tested 0.082% FFA exceeding maximum specification threshold 0.05%",
        disposition: "rework",
        decided_by_name: currentUser.name,
        decided_at: new Date().toISOString(),
      }
    };

    onUpdateReport(testSample);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER WITH INDUSTRIAL SPECULAR STYLING                            */}
      {/* ========================================================================= */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/15 to-indigo-700/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-zinc-900 dark:text-white">
                Master Data &amp; Quality Analytics
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live QC Synced
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Process trends telemetry, quality defect Pareto distribution, lot rejection frequencies by product, and refinery master specifications.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("qc")}
              className="btn-tactile px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open QC Lab</span>
            </button>
          )}

          <button
            onClick={handleSimulateQuickTestRejection}
            className="btn-tactile px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Inject a realistic defect lot to test live Pareto synchronization"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Test Defect Lot</span>
          </button>

          {onResetCleanData && (
            <button
              onClick={onResetCleanData}
              className="btn-tactile px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Clear all stored dummy logs and reset to clean live recording state"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Clean Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TABS SELECTOR                                                      */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveSubTab("pareto_frequency")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "pareto_frequency"
              ? "btn-premium-amber text-white shadow-md ring-1 ring-amber-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>QC Rejection Pareto &amp; Product Frequency</span>
        </button>

        <button
          onClick={() => setActiveSubTab("product_specs")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "product_specs"
              ? "btn-premium-amber text-white shadow-md ring-1 ring-amber-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product Quality Specs Master</span>
        </button>

        <button
          onClick={() => setActiveSubTab("reason_codes")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "reason_codes"
              ? "btn-premium-amber text-white shadow-md ring-1 ring-amber-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Defect Reason Codes Master</span>
        </button>

        <button
          onClick={() => setActiveSubTab("plants_tanks")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "plants_tanks"
              ? "btn-premium-amber text-white shadow-md ring-1 ring-amber-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plant Lines &amp; Tanks Inventory</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: QC REJECTION PARETO & PRODUCT FREQUENCY (ANALYTICS MIRROR)     */}
      {/* ========================================================================= */}
      {activeSubTab === "pareto_frequency" && (
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
          {/* PROCESS TRENDS & QUALITY PARETO ANALYTICS CHART                           */}
          {/* ========================================================================= */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                  Process trends and quality Pareto analytics
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Banded tolerance shading, multi-tray temperature overlays, statistical rejection Pareto
                </p>
              </div>

              {/* Chart Series Selector */}
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-black/40 p-1 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("trays")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeChartTab === "trays"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Tray temps (1-7)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("bc101")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeChartTab === "bc101"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  BC 101 (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("chilling")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeChartTab === "chilling"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Chilling (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("steam")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeChartTab === "steam"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Steam Press (Bar)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("vacuum")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeChartTab === "vacuum"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Deodorizer vacuum
                </button>
              </div>
            </div>

            {/* Sub-header description & hint */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium">
                {activeChartTab === "trays" && "Deodorizer tray temperatures (°C) for Trays 1 to 7 with configured operating bands (250 - 268°C)"}
                {activeChartTab === "bc101" && "BC 101 Condenser Water Temperatures (°C) - Water In vs Water Out with soft warning threshold (45°C)"}
                {activeChartTab === "chilling" && "Chilling Water Temperatures (°C) - Water In vs Water Out with target limit (Max 16°C)"}
                {activeChartTab === "steam" && "Steam Supply Pressures (Bar) - Tray Steam (Set 3.00 Bar), Booster & Ejector Pressures"}
                {activeChartTab === "vacuum" && "Deodorizer vacuum (Torr) with operating limit (Soft Max 4.5 Torr)"}
              </span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                Shift 24-Hour Telemetry, live process data
              </span>
            </div>

            {/* High-Resolution SVG Responsive Graph */}
            <div className="w-full h-72 sm:h-80 bg-zinc-50 dark:bg-black/30 rounded-2xl border border-zinc-200/80 dark:border-white/5 p-4 relative overflow-hidden flex flex-col justify-between">
              {/* SVG Curve Canvas */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id="vacGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d81f2c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#d81f2c" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[40, 90, 140, 190].map((y, i) => (
                  <line key={i} x1="40" y1={y} x2="780" y2={y} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4 4" />
                ))}

                {/* Operating Band Shading for Trays (250-268 C) */}
                {activeChartTab === "trays" && (
                  <>
                    <rect x="40" y="55" width="740" height="95" fill="url(#bandGrad)" rx="4" />
                    <line x1="40" y1="55" x2="780" y2="55" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1.2" opacity="0.8" />
                    <text x="770" y="50" fill="#10b981" fontSize="10" fontWeight="600" textAnchor="end">Band Max 268°C</text>
                    <line x1="40" y1="150" x2="780" y2="150" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1.2" opacity="0.8" />
                    <text x="770" y="163" fill="#10b981" fontSize="10" fontWeight="600" textAnchor="end">Band Min 250°C</text>

                    {/* Tray 4 Peak (Red Line) */}
                    <path
                      d="M 50 78 Q 200 68 400 62 T 770 70"
                      fill="none"
                      stroke="#d81f2c"
                      strokeWidth="2.8"
                    />
                    {/* Tray 2 (Blue Line) */}
                    <path
                      d="M 50 120 Q 200 115 400 110 T 770 118"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="1.8"
                    />
                    {/* Tray 7 (Emerald Line) */}
                    <path
                      d="M 50 145 Q 200 142 400 140 T 770 144"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* BC 101 Temperature Lines */}
                {activeChartTab === "bc101" && (
                  <>
                    <line x1="40" y1="80" x2="780" y2="80" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.2" />
                    <text x="770" y="75" fill="#f59e0b" fontSize="10" fontWeight="600" textAnchor="end">Warn Max 45°C</text>

                    <path
                      d="M 50 100 Q 220 95 400 92 T 770 98"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M 50 160 Q 220 156 400 152 T 770 158"
                      fill="none"
                      stroke="#00d2ff"
                      strokeWidth="2.2"
                    />
                  </>
                )}

                {/* Chilling Water Lines */}
                {activeChartTab === "chilling" && (
                  <>
                    <line x1="40" y1="85" x2="780" y2="85" stroke="#10b981" strokeDasharray="4 4" strokeWidth="1.2" />
                    <text x="770" y="80" fill="#10b981" fontSize="10" fontWeight="600" textAnchor="end">Target Max 16°C</text>

                    <path
                      d="M 50 115 Q 220 110 400 108 T 770 114"
                      fill="none"
                      stroke="#009fe3"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M 50 165 Q 220 160 400 155 T 770 162"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                    />
                  </>
                )}

                {/* Steam Pressure Lines */}
                {activeChartTab === "steam" && (
                  <>
                    <line x1="40" y1="90" x2="780" y2="90" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1.2" />
                    <text x="770" y="85" fill="#10b981" fontSize="10" fontWeight="600" textAnchor="end">Tray Set 3.00 Bar</text>

                    <path
                      d="M 50 88 Q 220 90 400 89 T 770 88"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M 50 120 Q 220 125 400 122 T 770 118"
                      fill="none"
                      stroke="#d81f2c"
                      strokeWidth="2.2"
                    />
                  </>
                )}

                {/* Vacuum Area & Curve */}
                {activeChartTab === "vacuum" && (
                  <>
                    <line x1="40" y1="80" x2="780" y2="80" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.2" />
                    <text x="770" y="75" fill="#f59e0b" fontSize="10" fontWeight="600" textAnchor="end">Soft Max: 4.5 Torr</text>

                    <path
                      d="M 50 135 Q 200 145 400 125 T 770 130 L 770 210 L 50 210 Z"
                      fill="url(#vacGrad)"
                    />
                    <path
                      d="M 50 135 Q 200 145 400 125 T 770 130"
                      fill="none"
                      stroke="#d81f2c"
                      strokeWidth="2.4"
                    />
                  </>
                )}

                {/* Time markers on X-Axis */}
                {trendPoints.filter((_, i) => i % 3 === 0).map((pt, i) => {
                  const x = 50 + (i * 140);
                  return (
                    <text key={i} x={x} y="228" fill="var(--muted, #888)" fontSize="11" fontFamily="monospace" textAnchor="middle">
                      {pt.time}
                    </text>
                  );
                })}
              </svg>

              {/* Chart Legend Footer */}
              <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  {activeChartTab === "trays" && (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d81f2c]" /> Tray 4 Peak (264.5°C)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Tray 2 Interm (255.0°C)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Tray 7 Final (251.5°C)</span>
                    </>
                  )}
                  {activeChartTab === "bc101" && (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> BC 101 Out (41.5°C)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" /> BC 101 In (32.0°C)</span>
                    </>
                  )}
                  {activeChartTab === "chilling" && (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#009fe3]" /> Chilling Water Out (13.2°C)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Chilling Water In (9.5°C)</span>
                    </>
                  )}
                  {activeChartTab === "steam" && (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /> Tray Steam (3.02 Bar)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d81f2c]" /> Booster Steam (2.85 Bar)</span>
                    </>
                  )}
                  {activeChartTab === "vacuum" && (
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d81f2c]" /> Deodorizer Operating Vacuum (3.2 Torr)</span>
                  )}
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  100% Parameter Stability
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
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live QC Lab Synced: {totalRejectedCount} {totalRejectedCount === 1 ? "rejection" : "rejections"}
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

                    <div className="flex items-center bg-zinc-100 dark:bg-black/40 p-0.5 rounded-xl border border-zinc-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setNonConformanceMode("rejects_only")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          nonConformanceMode === "rejects_only"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                        title="Show only lot rejections"
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
                        title="Show rejections and concessions"
                      >
                        + Concessions ({totalRejectedCount + totalConcessionsCount})
                      </button>
                    </div>
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
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Synchronized with QC Management (RF-FR-001) · {totalEvaluatedCount} Lots ({totalRejectedCount} {totalRejectedCount === 1 ? "Rejection" : "Rejections"}
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PRODUCT SPECIFICATIONS MASTER                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "product_specs" && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Refinery Product Quality Release Specifications Master
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Governing specification thresholds used by QC Laboratory for release decisions (RF-FR-001).
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products & specs..."
                value={specSearchQuery}
                onChange={(e) => setSpecSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3 text-center">FFA Max (%)</th>
                  <th className="py-3 px-3 text-center">Lovibond Red Max</th>
                  <th className="py-3 px-3 text-center">Lovibond Yellow Max</th>
                  <th className="py-3 px-3 text-center">Moisture Max (%)</th>
                  <th className="py-3 px-3 text-center">PV Max (meq/kg)</th>
                  <th className="py-3 px-3 text-center">DOBI Min</th>
                  <th className="py-3 px-3">Governing Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-mono">
                {DEFAULT_PRODUCT_SPECS
                  .filter((s) => s.productName.toLowerCase().includes(specSearchQuery.toLowerCase()))
                  .map((spec) => (
                    <tr key={spec.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-sans font-bold text-zinc-900 dark:text-white">
                        {spec.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">
                        ≤ {spec.ffaMax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-600 dark:text-rose-400 font-bold">
                        ≤ {spec.colourRedMax.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-yellow-600 dark:text-yellow-400">
                        ≤ {spec.colourYellowMax.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-sky-600 dark:text-sky-400">
                        ≤ {spec.moistureMax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-violet-600 dark:text-violet-400">
                        ≤ {spec.peroxideMax.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                        ≥ {spec.dobiMin.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs text-zinc-500">
                        {spec.standardReference}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DEFECT REASON CODES MASTER                                     */}
      {/* ========================================================================= */}
      {activeSubTab === "reason_codes" && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Defect Reason Taxonomy Master
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Standard classification reason codes, severity levels, and mandatory corrective actions.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reason codes..."
                value={reasonSearchQuery}
                onChange={(e) => setReasonSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300">
                  <th className="py-3 px-3">Reason Code</th>
                  <th className="py-3 px-3">Description Label</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Default Disposition</th>
                  <th className="py-3 px-3">Standard Corrective Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-sans">
                {DEFAULT_REJECTION_REASONS
                  .filter((r) => r.label.toLowerCase().includes(reasonSearchQuery.toLowerCase()) || r.code.toLowerCase().includes(reasonSearchQuery.toLowerCase()))
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {r.code}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                        {r.label}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.severity === "Critical" 
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : r.severity === "Major"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold uppercase text-zinc-700 dark:text-zinc-300">
                        {r.defaultDisposition}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-zinc-500 max-w-sm">
                        {r.correctiveAction}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PLANTS & TANKS INVENTORY                                       */}
      {/* ========================================================================= */}
      {activeSubTab === "plants_tanks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plants */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Plant Refining Lines ({plantList.length})</span>
              </h2>
              {onAddPlant && (
                <button
                  type="button"
                  onClick={() => setIsAddPlantModalOpen(true)}
                  className="btn-premium-amber px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plant</span>
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {plantList.map((plant) => (
                <div key={plant.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-zinc-900 dark:text-white font-display">
                      {plant.name}
                    </span>
                    <span className="block text-xs font-mono text-zinc-400 mt-0.5">
                      Line ID: {plant.id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tanks */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Refinery Tanks Inventory ({tankList.length})</span>
              </h2>
              {onAddTank && (
                <button
                  type="button"
                  onClick={() => setIsAddTankModalOpen(true)}
                  className="btn-premium-emerald px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tank</span>
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {tankList.map((tank) => (
                <div key={tank.id} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-zinc-900 dark:text-white font-display">
                      {tank.name}
                    </span>
                    <span className="block text-xs font-mono text-zinc-400 mt-0.5">
                      Tank ID: {tank.id} · Type: {tank.kind.toUpperCase()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                    tank.kind === "feed" 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" 
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {tank.kind === "feed" ? "Feed Tank" : "Discharge Tank"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 100% FULL-SCREEN PORTALLED CERTIFICATE & AUDIT MODAL                      */}
      {/* ========================================================================= */}
      {activeCertificateReport && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveCertificateReport(null)}
        >
          <div 
            className="bg-[#101927] border border-[#1F2E43] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1F2E43] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base font-display text-white">
                      Laboratory Analysis Certificate
                    </h3>
                    <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {activeCertificateReport.lot_no}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Form RF-FR-001 · Report No: {activeCertificateReport.report_no}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCertificateReport(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Product & Process Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/30 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="block text-xs text-slate-400 uppercase font-mono">Product</span>
                  <span className="font-semibold text-xs text-white mt-1 block truncate">
                    {activeCertificateReport.product_name || "Refined Product"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 uppercase font-mono">Sampling Point</span>
                  <span className="font-semibold text-xs text-white mt-1 block truncate">
                    {activeCertificateReport.sampling_point_name || "Deodorizer Discharge"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 uppercase font-mono">Sample Date &amp; Time</span>
                  <span className="font-semibold text-xs font-mono text-white mt-1 block">
                    {activeCertificateReport.sample_date} {activeCertificateReport.time_check}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 uppercase font-mono">Sampler</span>
                  <span className="font-semibold text-xs text-white mt-1 block truncate">
                    {activeCertificateReport.submitted_by_name}
                  </span>
                </div>
              </div>

              {/* Decision & Root Cause */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-rose-600 text-white">
                      {activeCertificateReport.decision?.decision === "reject" ? "REJECTED LOT" : "CONCESSION RELEASE"}
                    </span>
                    <span className="text-xs font-bold text-rose-400">
                      {normalizeReason(activeCertificateReport.decision?.reason_label, activeCertificateReport.decision?.reason_id)}
                    </span>
                  </div>
                  {activeCertificateReport.decision?.disposition && (
                    <span className="text-xs uppercase font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded text-white">
                      Action: {activeCertificateReport.decision.disposition}
                    </span>
                  )}
                </div>
                {activeCertificateReport.decision?.reason_detail && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {activeCertificateReport.decision.reason_detail}
                  </p>
                )}
              </div>

              {/* Analytical Results Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
                  Analytical Assay Results
                </h4>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 font-bold text-slate-300">
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3 text-right">Result</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-center">Specification Limit</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {activeCertificateReport.results.map((res) => (
                        <tr key={res.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                            {res.parameter_name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {res.value_numeric !== null && res.value_numeric !== undefined ? res.value_numeric : "–"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">
                            {res.unit || "–"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">
                            {res.parameter_code === "FFA" ? "≤ 0.05%" : res.parameter_code === "COLOUR_R" ? "≤ 2.5 R" : "Standard"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {res.in_spec === false ? (
                              <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                OUT OF SPEC
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                PASS
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signoff Authority */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Decided by: <strong className="text-white">{activeCertificateReport.decision?.decided_by_name || "QA Officer"}</strong></span>
                </div>
                <div className="font-mono">
                  Timestamp: {activeCertificateReport.decision?.decided_at || "Recorded"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1F2E43] flex items-center justify-end gap-2.5 bg-black/20">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCertificateReport(null)}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-white btn-premium-amber cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Add New Plant Line in MasterData (Portalled to document.body) */}
      {isAddPlantModalOpen && onAddPlant && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddPlantModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-[#0E1626] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-zinc-900 dark:text-white">
                    Register New Plant / Production Line
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add new production line to refinery master data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlantModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Plant / Line Name
              </label>
              <input
                type="text"
                value={customPlantName}
                onChange={(e) => setCustomPlantName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customPlantName.trim()) {
                      onAddPlant(customPlantName.trim());
                      setCustomPlantName("");
                      setIsAddPlantModalOpen(false);
                    }
                  }
                }}
                placeholder="e.g. Refinery Plant 3 (Continuous Bleaching Line 3)"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/40 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCustomPlantName("");
                  setIsAddPlantModalOpen(false);
                }}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customPlantName.trim()}
                onClick={() => {
                  if (customPlantName.trim()) {
                    onAddPlant(customPlantName.trim());
                    setCustomPlantName("");
                    setIsAddPlantModalOpen(false);
                  }
                }}
                className="btn-premium-amber px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Plant Line</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Add New Tank in MasterData (Portalled to document.body) */}
      {isAddTankModalOpen && onAddTank && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddTankModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-[#0E1626] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-zinc-900 dark:text-white">
                    Register New Storage / Transfer Tank
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add new feed or discharge tank to refinery tank farm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTankModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tank Name / Identifier
                </label>
                <input
                  type="text"
                  value={customTankName}
                  onChange={(e) => setCustomTankName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (customTankName.trim()) {
                        onAddTank(customTankName.trim(), customTankKind);
                        setCustomTankName("");
                        setIsAddTankModalOpen(false);
                      }
                    }
                  }}
                  placeholder="e.g. Feed Tank TK-104 (Crude Feed)"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/40 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tank Functional Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTankKind('feed')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      customTankKind === 'feed'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Feed Tank
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTankKind('discharge')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      customTankKind === 'discharge'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Discharge Tank
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTankKind('both')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      customTankKind === 'both'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Dual Purpose
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCustomTankName("");
                  setIsAddTankModalOpen(false);
                }}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customTankName.trim()}
                onClick={() => {
                  if (customTankName.trim()) {
                    onAddTank(customTankName.trim(), customTankKind);
                    setCustomTankName("");
                    setIsAddTankModalOpen(false);
                  }
                }}
                className="btn-premium-emerald px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Tank</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
