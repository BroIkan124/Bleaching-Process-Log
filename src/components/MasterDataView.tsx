"use client";

import React, { useState, useMemo } from "react";
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
  ExternalLink
} from "lucide-react";

interface MasterDataViewProps {
  currentUser: UserProfile;
  isDark: boolean;
  reports: SampleReport[];
  products?: Product[];
  onNavigateTab?: (tab: DashboardTab) => void;
  onUpdateReport?: (report: SampleReport) => void;
  onResetCleanData?: () => void;
}

type MasterSubTab = "pareto_frequency" | "product_specs" | "reason_codes" | "plants_tanks";

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  currentUser,
  isDark,
  reports,
  products: externalProducts,
  onNavigateTab,
  onUpdateReport,
  onResetCleanData,
}) => {
  const availableProducts = externalProducts || MOCK_PRODUCTS;
  const [activeSubTab, setActiveSubTab] = useState<MasterSubTab>("pareto_frequency");
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");
  const [specSearchQuery, setSpecSearchQuery] = useState<string>("");
  const [reasonSearchQuery, setReasonSearchQuery] = useState<string>("");

  // =========================================================================
  // 1. DYNAMIC DATA AGGREGATION & LIVE SYNC WITH QC MANAGEMENT
  // =========================================================================

  // All evaluated reports (decided by QC)
  const evaluatedReports = useMemo(() => {
    return reports.filter(r => r.decision && (r.decision.decision === "accept" || r.decision.decision === "accept_concession" || r.decision.decision === "reject"));
  }, [reports]);

  // All rejected reports
  const rejectedReports = useMemo(() => {
    return reports.filter(r => r.decision?.decision === "reject");
  }, [reports]);

  // Total evaluated lots count
  const totalEvaluatedCount = evaluatedReports.length;
  const totalRejectedCount = rejectedReports.length;
  const totalAcceptedCount = evaluatedReports.filter(r => r.decision?.decision === "accept" || r.decision?.decision === "accept_concession").length;
  const overallRejectionRate = totalEvaluatedCount > 0 ? (totalRejectedCount / totalEvaluatedCount) * 100 : 0;

  // Filtered rejected reports based on product dropdown
  const filteredRejectedReports = useMemo(() => {
    if (selectedProductFilter === "all") return rejectedReports;
    return rejectedReports.filter(r => (r.product_name || "").toLowerCase().includes(selectedProductFilter.toLowerCase()));
  }, [rejectedReports, selectedProductFilter]);

  // =========================================================================
  // 2. QC REJECTION PARETO ANALYSIS BY REASON CODE
  // =========================================================================
  const paretoData = useMemo(() => {
    // Tally rejections by reason label/code
    const countsMap = new Map<string, { count: number; code: string; category: string; severity: string; action: string }>();

    // Seed with standard reason taxonomy
    DEFAULT_REJECTION_REASONS.forEach(r => {
      countsMap.set(r.label, {
        count: 0,
        code: r.code,
        category: r.category,
        severity: r.severity,
        action: r.correctiveAction
      });
    });

    // Populate actual counts from QC decisions
    filteredRejectedReports.forEach(report => {
      const label = report.decision?.reason_label || "Other / Unspecified Quality Deviation";
      if (countsMap.has(label)) {
        const item = countsMap.get(label)!;
        item.count += 1;
      } else {
        countsMap.set(label, {
          count: 1,
          code: report.decision?.reason_id || "DEF_CUSTOM",
          category: "Quality",
          severity: "Major",
          action: "Investigate refining telemetry and verify analytical assay"
        });
      }
    });

    // Convert to array and filter for either items with count > 0, or top items if none
    const rawList = Array.from(countsMap.entries()).map(([label, info]) => ({
      label,
      ...info,
    }));

    // Sort descending by count
    rawList.sort((a, b) => b.count - a.count);

    // Calculate total rejections in this scope
    const totalRejectionsInScope = rawList.reduce((acc, curr) => acc + curr.count, 0);

    let cumulativeCount = 0;
    return rawList.map((item, index) => {
      cumulativeCount += item.count;
      const percent = totalRejectionsInScope > 0 ? (item.count / totalRejectionsInScope) * 100 : 0;
      const cumulativePercent = totalRejectionsInScope > 0 ? (cumulativeCount / totalRejectionsInScope) * 100 : 0;
      const isVitalFew = cumulativePercent <= 80 || (index > 0 && ((cumulativeCount - item.count) / totalRejectionsInScope) * 100 < 80);

      return {
        ...item,
        percent,
        cumulativePercent,
        isVitalFew,
      };
    });
  }, [filteredRejectedReports]);

  // Maximum defect count for relative Pareto bar scaling
  const maxParetoCount = useMemo(() => {
    const max = Math.max(...paretoData.map(d => d.count), 1);
    return max;
  }, [paretoData]);

  // =========================================================================
  // 3. LOT REJECTION FREQUENCY BY PRODUCT ANALYSIS
  // =========================================================================
  const productFrequencyData = useMemo(() => {
    const productStats = new Map<string, { total: number; rejected: number; accepted: number; topReason: string }>();

    // Seed with all catalog products
    availableProducts.forEach(p => {
      productStats.set(p.name, { total: 0, rejected: 0, accepted: 0, topReason: "None" });
    });

    // Tally all QC evaluated reports
    reports.forEach(report => {
      const prodName = report.product_name || "RBD Palm Oil (Refined, Bleached & Deodorized)";
      if (!productStats.has(prodName)) {
        productStats.set(prodName, { total: 0, rejected: 0, accepted: 0, topReason: "None" });
      }

      const current = productStats.get(prodName)!;
      if (report.decision) {
        current.total += 1;
        if (report.decision.decision === "reject") {
          current.rejected += 1;
          current.topReason = report.decision.reason_label || "Quality Deviation";
        } else {
          current.accepted += 1;
        }
      }
    });

    // Transform into sorted analysis list
    return Array.from(productStats.entries()).map(([productName, stats]) => {
      const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
      let riskStatus: "Zero Defect" | "Controlled" | "High Alert" = "Zero Defect";

      if (stats.rejected > 0) {
        riskStatus = rejectionRate > 10 ? "High Alert" : "Controlled";
      }

      return {
        productName,
        totalLots: stats.total,
        rejectedLots: stats.rejected,
        acceptedLots: stats.accepted,
        rejectionRate,
        topReason: stats.topReason,
        riskStatus,
      };
    }).sort((a, b) => b.rejectedLots - a.rejectedLots || b.rejectionRate - a.rejectionRate);
  }, [reports]);

  // Max product rejection count for scaling
  const maxProductRejections = useMemo(() => {
    return Math.max(...productFrequencyData.map(p => p.rejectedLots), 1);
  }, [productFrequencyData]);

  // =========================================================================
  // 4. SIMULATE QUICK TEST REJECTION (FOR TESTING ZERO-DATA STATE)
  // =========================================================================
  const handleSimulateQuickTestRejection = () => {
    if (!onUpdateReport) return;
    const testSample: SampleReport = {
      id: `test-reject-${Date.now()}`,
      report_no: `SAR-2026-TEST${Math.floor(1000 + Math.random() * 9000)}`,
      sample_date: new Date().toISOString().split("T")[0],
      time_check: new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false }),
      lot_no: `LOT-TEST-DEFECT-${Math.floor(100 + Math.random() * 900)}`,
      product_name: "RBD Palm Oil (Refined, Bleached & Deodorized)",
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
          parameter_name: "Colour Red (5.25\")",
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
        reason_detail: "Tested 0.082% FFA exceeding maximum specification 0.05%",
        disposition: "rework",
        decided_by_name: currentUser.name,
        decided_at: new Date().toISOString(),
      }
    };

    onUpdateReport(testSample);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* View Header with Industrial Specular Styling */}
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                QC Synced
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Quality defect Pareto charts, lot rejection frequencies by product, and refinery master specifications.
            </p>
          </div>
        </div>

        {/* Navigation / Action Buttons */}
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
            title="Add a sample rejection to test live Pareto synchronization"
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

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveSubTab("pareto_frequency")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "pareto_frequency"
              ? "btn-premium-amber text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>QC Rejection Pareto &amp; Product Frequency</span>
        </button>

        <button
          onClick={() => setActiveSubTab("product_specs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "product_specs"
              ? "btn-premium-amber text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product Quality Specs Master</span>
        </button>

        <button
          onClick={() => setActiveSubTab("reason_codes")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "reason_codes"
              ? "btn-premium-amber text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Defect Reason Codes Master</span>
        </button>

        <button
          onClick={() => setActiveSubTab("plants_tanks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "plants_tanks"
              ? "btn-premium-amber text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plant Lines &amp; Tanks Inventory</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PARETO ANALYSIS & PRODUCT REJECTION FREQUENCY                   */}
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
              <p className="text-xs text-zinc-500 mt-1">Total QC decision records</p>
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
                {totalRejectedCount > 0 ? paretoData[0]?.code || "FFA_EXCEED" : "None (All In-Spec)"}
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">
                {totalRejectedCount > 0 ? `${paretoData[0]?.count || 0} occurrences (${paretoData[0]?.percent?.toFixed(1) || 0}%)` : "Zero defects logged"}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-panel p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-display">Product Filter:</span>
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="p-1.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">All Refining Products</option>
                {MOCK_PRODUCTS.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-zinc-500 font-mono">
              Analyzing {filteredRejectedReports.length} rejections out of {totalEvaluatedCount} total decided lots
            </div>
          </div>

          {/* ================================================================= */}
          {/* 1. QC REJECTION PARETO BY REASON CODE CHART                       */}
          {/* ================================================================= */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                    QC Rejection Pareto by Reason Code
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    80/20 Rule Analysis
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Frequency of quality rejections ranked in descending order with cumulative percentage curve.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-rose-600 to-amber-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Rejection Count (Bars)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Cumulative % (Curve)</span>
                </div>
              </div>
            </div>

            {totalRejectedCount === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                  Zero Quality Rejections Logged
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  All lots inspected by QC Laboratory are currently within specification limits. When a lot is rejected in QC Management, it will automatically populate this Pareto chart.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleSimulateQuickTestRejection}
                    className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-white btn-premium-amber shadow-sm cursor-pointer"
                  >
                    Simulate / Inject Test Rejection to View Pareto
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Pareto Chart Bars & Cumulative Curve */}
                <div className="relative pt-6 pb-2">
                  {/* 80% Cutoff Reference Line */}
                  <div className="absolute top-[28%] left-0 right-0 border-b border-dashed border-amber-500/60 z-10 pointer-events-none flex items-center justify-end pr-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-xs font-bold font-mono shadow-xs -translate-y-1/2">
                      80% Vital Few Threshold
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 items-end min-h-[220px]">
                    {paretoData.slice(0, 8).map((item, idx) => {
                      const barHeightPercent = maxParetoCount > 0 ? (item.count / maxParetoCount) * 100 : 0;
                      return (
                        <div key={item.code} className="flex flex-col items-center group relative h-full justify-end">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-30 bg-zinc-900 text-white text-xs rounded-lg p-2 shadow-xl pointer-events-none whitespace-nowrap">
                            <div className="font-bold">{item.label}</div>
                            <div className="font-mono text-xs text-amber-400">
                              {item.count} Lots · {item.percent.toFixed(1)}% (Cum: {item.cumulativePercent.toFixed(1)}%)
                            </div>
                          </div>

                          {/* Cumulative % Badge */}
                          <div className="text-xs font-bold font-mono text-sky-500 mb-1">
                            {item.cumulativePercent.toFixed(0)}%
                          </div>

                          {/* Vertical Pareto Bar */}
                          <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-t-xl relative overflow-hidden flex flex-col justify-end h-36">
                            <div
                              style={{ height: `${Math.max(barHeightPercent, 8)}%` }}
                              className={`w-full rounded-t-xl transition-all duration-500 relative ${
                                item.isVitalFew
                                  ? "bg-gradient-to-t from-rose-600 via-rose-500 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                  : "bg-gradient-to-t from-zinc-500 to-zinc-400"
                              }`}
                            >
                              <div className="absolute top-1 left-0 right-0 text-center text-xs font-bold font-mono text-white">
                                {item.count}
                              </div>
                            </div>
                          </div>

                          {/* Reason Label */}
                          <div className="w-full text-center mt-2">
                            <span className="block text-xs font-bold font-mono text-zinc-900 dark:text-zinc-200 truncate" title={item.label}>
                              {item.code}
                            </span>
                            <span className="block text-xs text-zinc-500 truncate" title={item.label}>
                              {item.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pareto Data Breakdown Table */}
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300">
                        <th className="py-2.5 px-3">Reason Code</th>
                        <th className="py-2.5 px-3">Defect Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Rejection Count</th>
                        <th className="py-2.5 px-3 text-right">Share (%)</th>
                        <th className="py-2.5 px-3 text-right">Cumulative (%)</th>
                        <th className="py-2.5 px-3">Recommended Corrective Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-mono">
                      {paretoData.map((row) => (
                        <tr key={row.code} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">
                            {row.code}
                          </td>
                          <td className="py-2 px-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                            {row.label}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900 dark:text-white">
                            {row.count}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                            {row.percent.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                            {row.cumulativePercent.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 font-sans text-xs text-zinc-500 max-w-xs truncate" title={row.action}>
                            {row.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 2. LOT REJECTION FREQUENCY BY PRODUCT CHART                       */}
          {/* ================================================================= */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                    Lot Rejection Frequency by Product
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Product Defect Distribution
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Comparison of total lots inspected versus rejected lots across all refinery product lines.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-zinc-600 dark:text-zinc-400">Total Inspected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-600" />
                  <span className="text-zinc-600 dark:text-zinc-400">Rejected Lots</span>
                </div>
              </div>
            </div>

            {/* Horizontal Product Frequency Bars */}
            <div className="space-y-4">
              {productFrequencyData.map((item) => {
                const totalWidthPercent = Math.min((item.totalLots / Math.max(totalEvaluatedCount, 1)) * 100, 100);
                const rejectWidthPercent = item.totalLots > 0 ? (item.rejectedLots / item.totalLots) * 100 : 0;

                return (
                  <div key={item.productName} className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-display text-zinc-900 dark:text-white">
                          {item.productName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.riskStatus === "Zero Defect"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : item.riskStatus === "Controlled"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}>
                          {item.riskStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {item.totalLots} Lots Inspected
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {item.rejectedLots} Rejected ({item.rejectionRate.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual Progress Bar */}
                    <div className="w-full bg-zinc-200/80 dark:bg-zinc-800/80 h-3 rounded-full overflow-hidden p-0.5 flex items-center">
                      <div 
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        style={{ width: `${100 - rejectWidthPercent}%` }}
                        title={`${item.acceptedLots} Accepted`}
                      />
                      {item.rejectedLots > 0 && (
                        <div 
                          className="h-full bg-rose-600 rounded-r-full transition-all duration-500"
                          style={{ width: `${rejectWidthPercent}%` }}
                          title={`${item.rejectedLots} Rejected`}
                        />
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Primary Defect: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{item.topReason}</strong></span>
                      <span className="font-mono">{item.acceptedLots} Passed Release Criteria</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PRODUCT SPECIFICATIONS MASTER                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "product_specs" && (
        <div className="space-y-6">
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
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-zinc-900 dark:text-white focus:outline-none"
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
                    <th className="py-3 px-3">Standard Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-mono">
                  {DEFAULT_PRODUCT_SPECS
                    .filter(s => s.productName.toLowerCase().includes(specSearchQuery.toLowerCase()))
                    .map((spec) => (
                      <tr key={spec.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-sans font-bold text-zinc-900 dark:text-white">
                          {spec.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          {spec.ffaMax.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {spec.colourRedMax.toFixed(1)}R
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                          {spec.colourYellowMax.toFixed(0)}Y
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                          {spec.moistureMax.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                          {spec.peroxideMax.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                          &ge; {spec.dobiMin.toFixed(1)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DEFECT REASON CODES MASTER                                     */}
      {/* ========================================================================= */}
      {activeSubTab === "reason_codes" && (
        <div className="space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                  QC Defect Reason Codes Taxonomy Master
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Standardized reason codes tagged during lot rejections to fuel automated Pareto root-cause analysis.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reason codes..."
                  value={reasonSearchQuery}
                  onChange={(e) => setReasonSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300">
                    <th className="py-3 px-3">Reason Code</th>
                    <th className="py-3 px-3">Defect Description</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Default Disposition</th>
                    <th className="py-3 px-3">Action Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-sans">
                  {DEFAULT_REJECTION_REASONS
                    .filter(r => r.label.toLowerCase().includes(reasonSearchQuery.toLowerCase()) || r.code.toLowerCase().includes(reasonSearchQuery.toLowerCase()))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-white">
                          {item.label}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.severity === "Critical"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono uppercase text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {item.defaultDisposition}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-zinc-500 max-w-sm">
                          {item.correctiveAction}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PLANT LINES & TANKS INVENTORY                                  */}
      {/* ========================================================================= */}
      {activeSubTab === "plants_tanks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plants */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-200 dark:border-white/10 pb-3">
              <Layers className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Refining Process Lines
              </h2>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-white/5">
              {MOCK_PLANTS.map((plant) => (
                <div key={plant.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white font-display">
                      {plant.name}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">ID: {plant.id}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Active Line
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tanks */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-200 dark:border-white/10 pb-3">
              <Database className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Feed &amp; Discharge Storage Tanks
              </h2>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-white/5">
              {MOCK_TANKS.map((tank) => (
                <div key={tank.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white font-display">
                      {tank.name}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">ID: {tank.id}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    tank.kind === "feed"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                  }`}>
                    {tank.kind === "feed" ? "Crude Feed Tank" : "Discharge Product Tank"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataView;
