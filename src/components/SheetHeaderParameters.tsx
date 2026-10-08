"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { LogSheet, Plant, Product, Tank } from "@/types";
import { 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Factory, 
  Beaker, 
  Layers, 
  Calendar, 
  Sparkles,
  Droplet,
  Droplets,
  CheckCircle2,
  Settings2,
  Plus,
  X,
  Tag
} from "lucide-react";
import { RadioSelect } from "./RadioSelect";

interface SheetHeaderParametersProps {
  sheet: LogSheet;
  plants: Plant[];
  products: Product[];
  tanks: Tank[];
  isLocked: boolean;
  onUpdateHeader: (updates: Partial<LogSheet>) => void;
  onAddProduct?: (productName: string) => Product | null;
}

export const SheetHeaderParameters: React.FC<SheetHeaderParametersProps> = ({
  sheet,
  plants,
  products,
  tanks,
  isLocked,
  onUpdateHeader,
  onAddProduct,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [customProductName, setCustomProductName] = useState("");

  const feedTanks = tanks.filter((t) => t.kind === "feed");
  const dischargeTanks = tanks.filter((t) => t.kind === "discharge");

  const currentPlant = plants.find((p) => p.id === sheet.plant_id)?.name || sheet.plant_name || "Refinery Line 1";
  const currentProduct = products.find((p) => p.id === sheet.product_id)?.name || sheet.product_name || "RBD Palm Oil";
  const currentFeed = feedTanks.find((t) => t.id === sheet.feed_tank_id)?.name || "TK-101";
  const currentDischarge = dischargeTanks.find((t) => t.id === sheet.discharge_tank_id)?.name || "TK-201";

  return (
    <div className={`glass-panel rounded-2xl mb-5 transition-all shadow-md hover:shadow-xl border border-zinc-200/90 dark:border-white/10 ${
      isExpanded ? "overflow-visible relative z-30" : "overflow-hidden"
    }`}>
      {/* 1. Sleek Compact Parameter Summary Bar with 3D Depth */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0D1424] dark:via-[#131D33] dark:to-[#0D1424] border-b border-zinc-200/80 dark:border-white/10">
        {/* Left: Key Meta Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-100 block leading-tight">
                {currentPlant}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block leading-none mt-1">
                {currentProduct} · Date: <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{sheet.sheet_date}</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          {/* Quick 3D Telemetry Chips */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-white/95 dark:bg-white/[0.08] border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-medium shadow-sm">
              Feed: <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{currentFeed.split(" ")[0]}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/95 dark:bg-white/[0.08] border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-medium shadow-sm">
              Discharge: <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{currentDischarge.split(" ")[0]}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/35 text-amber-700 dark:text-amber-300 font-mono font-bold shadow-sm flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Target: {sheet.input_mt_hr ?? 45.0} MT/HR</span>
            </span>
          </div>
        </div>

        {/* Right: Expand / Edit Toggle Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer group shadow-sm ${
              isExpanded
                ? "btn-premium-amber text-white"
                : "btn-premium-glass text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
            <span>{isExpanded ? "Close Settings" : "Configure Parameters"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Structured Expanded Settings Grid */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isExpanded ? "grid-rows-[1fr] opacity-100 overflow-visible" : "grid-rows-[0fr] opacity-0 pointer-events-none overflow-hidden"
        }`}
      >
        <div className={isExpanded ? "overflow-visible" : "overflow-hidden"}>
          <div className="p-5 space-y-5 text-xs">
          {/* Group 1: Plant & Tank Logistics */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>1. Plant &amp; Tank Logistics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Plant / Production Line
                </label>
                <RadioSelect
                  disabled={isLocked}
                  value={sheet.plant_id}
                  onChange={(val) => onUpdateHeader({ plant_id: val })}
                  options={plants.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Oil Product Type ({products.length})
                  </label>
                  {onAddProduct && !isLocked && (
                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Register a new oil product into the plant catalog"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  )}
                </div>
                <RadioSelect
                  disabled={isLocked}
                  value={sheet.product_id}
                  icon={<Droplets className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  onChange={(val) => {
                    const chosen = products.find((p) => p.id === val);
                    onUpdateHeader({
                      product_id: val,
                      product_name: chosen?.name || sheet.product_name,
                    });
                  }}
                  options={products.map((p) => ({ 
                    value: p.id, 
                    label: p.name,
                    icon: <Droplets className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  }))}
                  searchable={true}
                  onAddCustom={onAddProduct && !isLocked ? () => setIsAddProductModalOpen(true) : undefined}
                  addCustomLabel="+ Register New Product..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Feed Tank
                </label>
                <RadioSelect
                  disabled={isLocked}
                  value={sheet.feed_tank_id}
                  onChange={(val) => onUpdateHeader({ feed_tank_id: val })}
                  options={feedTanks.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Discharge Tank
                </label>
                <RadioSelect
                  disabled={isLocked}
                  value={sheet.discharge_tank_id}
                  onChange={(val) => onUpdateHeader({ discharge_tank_id: val })}
                  options={dischargeTanks.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>
            </div>
          </div>

          {/* Group 2: Operational Target Parameters */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-200/70 dark:border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-display">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Operating Specs &amp; Chemical Dosing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Input Flowrate */}
              <div className="telemetry-card p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5 font-display text-xs">
                    <Factory className="w-3.5 h-3.5 text-amber-500" />
                    <span>Flowrate Targets</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">MT / Hour</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={isLocked}
                      value={sheet.input_mt_hr ?? ""}
                      onChange={(e) => onUpdateHeader({ input_mt_hr: parseFloat(e.target.value) || null })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      placeholder="45.0"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">MT / Day</span>
                    <input
                      type="number"
                      step="1"
                      disabled={isLocked}
                      value={sheet.input_mt_day ?? ""}
                      onChange={(e) => onUpdateHeader({ input_mt_day: parseFloat(e.target.value) || null })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      placeholder="1080"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Degumming Acid */}
              <div className="telemetry-card p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5 font-display text-xs">
                    <Beaker className="w-3.5 h-3.5 text-sky-500" />
                    <span>Degumming Acid</span>
                  </span>
                  <div className="w-32">
                    <RadioSelect
                      disabled={isLocked}
                      size="xs"
                      value={sheet.acid_type}
                      onChange={(val) => onUpdateHeader({ acid_type: val })}
                      options={[
                        { value: "Phosphoric Acid", label: "Phosphoric" },
                        { value: "Citric Acid", label: "Citric" }
                      ]}
                      className="py-1 px-2.5 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Mm</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.acid_mm ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_mm: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Cm/Hr</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.acid_cm_hr ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_cm_hr: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="24.0"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">%</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isLocked}
                      value={sheet.acid_pct ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_pct: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="0.06"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Bleaching Earth */}
              <div className="telemetry-card p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5 font-display text-xs">
                    <Droplet className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bleaching Earth (BE)</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Setting</span>
                    <input
                      type="number"
                      step="0.05"
                      disabled={isLocked}
                      value={sheet.earth_setting ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_setting: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="1.25"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Min %</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isLocked}
                      value={sheet.earth_min_pct ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_min_pct: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="0.80"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Kgs/Day</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.earth_kgs_day ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_kgs_day: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white shadow-inner focus:border-amber-500"
                      placeholder="9180"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Filter Aids */}
              <div className="telemetry-card p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5 font-display text-xs">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Filter Aids</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Aid 1 (Type / Qty)</span>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={sheet.aid1_type}
                        onChange={(e) => onUpdateHeader({ aid1_type: e.target.value })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-medium shadow-inner"
                        placeholder="Type"
                      />
                      <input
                        type="number"
                        disabled={isLocked}
                        value={sheet.aid1_qty ?? ""}
                        onChange={(e) => onUpdateHeader({ aid1_qty: parseFloat(e.target.value) || null })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold shadow-inner"
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">Aid 2 (Type / Qty)</span>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={sheet.aid2_type}
                        onChange={(e) => onUpdateHeader({ aid2_type: e.target.value })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-medium shadow-inner"
                        placeholder="Type"
                      />
                      <input
                        type="number"
                        disabled={isLocked}
                        value={sheet.aid2_qty ?? ""}
                        onChange={(e) => onUpdateHeader({ aid2_qty: parseFloat(e.target.value) || null })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold shadow-inner"
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal: Add New Oil Product (Portalled to document.body for full viewport coverage) */}
      {isAddProductModalOpen && onAddProduct && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddProductModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-[#0E1626] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-zinc-900 dark:text-white">
                    Register New Oil Product
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add custom product to refinery catalog
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Product Name / Grade Specification
              </label>
              <input
                type="text"
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customProductName.trim()) {
                      onAddProduct(customProductName.trim());
                      setCustomProductName("");
                      setIsAddProductModalOpen(false);
                    }
                  }
                }}
                placeholder="e.g. SUPER OLEIN IV65 or NBD STEARIN"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/40 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 uppercase"
              />
              <p className="text-xs text-zinc-500 mt-1">
                New products are synchronized across Bleaching Log, QC Lab, and Master Data Pareto analytics.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCustomProductName("");
                  setIsAddProductModalOpen(false);
                }}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customProductName.trim()}
                onClick={() => {
                  if (customProductName.trim()) {
                    onAddProduct(customProductName.trim());
                    setCustomProductName("");
                    setIsAddProductModalOpen(false);
                  }
                }}
                className="btn-premium-amber px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save to Catalog &amp; Select</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
