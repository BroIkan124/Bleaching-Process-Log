"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  Settings2
} from "lucide-react";

interface SheetHeaderParametersProps {
  sheet: LogSheet;
  plants: Plant[];
  products: Product[];
  tanks: Tank[];
  isLocked: boolean;
  onUpdateHeader: (updates: Partial<LogSheet>) => void;
}

export const SheetHeaderParameters: React.FC<SheetHeaderParametersProps> = ({
  sheet,
  plants,
  products,
  tanks,
  isLocked,
  onUpdateHeader,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const feedTanks = tanks.filter((t) => t.kind === "feed");
  const dischargeTanks = tanks.filter((t) => t.kind === "discharge");

  const currentPlant = plants.find((p) => p.id === sheet.plant_id)?.name || sheet.plant_name || "Refinery Line 1";
  const currentProduct = products.find((p) => p.id === sheet.product_id)?.name || sheet.product_name || "RBD Palm Oil";
  const currentFeed = feedTanks.find((t) => t.id === sheet.feed_tank_id)?.name || "TK-101";
  const currentDischarge = dischargeTanks.find((t) => t.id === sheet.discharge_tank_id)?.name || "TK-201";

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm transition-all overflow-hidden mb-5">
      {/* 1. Sleek Compact Parameter Summary Bar */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#141517] border-b border-zinc-200/70 dark:border-zinc-800/80">
        {/* Left: Key Meta Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block leading-tight">
                {currentPlant}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium block leading-none mt-0.5">
                {currentProduct} · Tarikh: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{sheet.sheet_date}</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          {/* Quick Telemetry Chips */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              Feed: <strong className="text-zinc-900 dark:text-zinc-100">{currentFeed.split(" ")[0]}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              Discharge: <strong className="text-zinc-900 dark:text-zinc-100">{currentDischarge.split(" ")[0]}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
              Sasaran: {sheet.input_mt_hr ?? 45.0} MT/HR
            </span>
          </div>
        </div>

        {/* Right: Expand / Edit Toggle Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isExpanded
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Tutup Tetapan" : "Konfigurasi Parameter"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Structured Expanded Settings Grid */}
      {isExpanded && (
        <div className="p-5 space-y-5 animate-in slide-in-from-top-2 duration-200 text-xs">
          {/* Group 1: Plant & Tank Logistics */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>1. Konfigurasi Loji &amp; Tangki (Master Logistics)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Loji / Laluan (Plant Line)
                </label>
                <select
                  disabled={isLocked}
                  value={sheet.plant_id}
                  onChange={(e) => onUpdateHeader({ plant_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Jenis Produk Minyak
                </label>
                <select
                  disabled={isLocked}
                  value={sheet.product_id}
                  onChange={(e) => onUpdateHeader({ product_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Tangki Suapan (Feed Tank)
                </label>
                <select
                  disabled={isLocked}
                  value={sheet.feed_tank_id}
                  onChange={(e) => onUpdateHeader({ feed_tank_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                >
                  {feedTanks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Tangki Pelepasan (Discharge Tank)
                </label>
                <select
                  disabled={isLocked}
                  value={sheet.discharge_tank_id}
                  onChange={(e) => onUpdateHeader({ discharge_tank_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                >
                  {dischargeTanks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Operational Target Parameters */}
          <div className="space-y-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>2. Parameter Operasi &amp; Dos Bahan Kimia (Operating Specs)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Input Flowrate */}
              <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kadar Aliran (Flowrate)</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">MT / Jam</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={isLocked}
                      value={sheet.input_mt_hr ?? ""}
                      onChange={(e) => onUpdateHeader({ input_mt_hr: parseFloat(e.target.value) || null })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="45.0"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">MT / Hari</span>
                    <input
                      type="number"
                      step="1"
                      disabled={isLocked}
                      value={sheet.input_mt_day ?? ""}
                      onChange={(e) => onUpdateHeader({ input_mt_day: parseFloat(e.target.value) || null })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="1080"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Degumming Acid */}
              <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-sky-500" />
                    <span>Asid Degumming</span>
                  </span>
                  <select
                    disabled={isLocked}
                    value={sheet.acid_type}
                    onChange={(e) => onUpdateHeader({ acid_type: e.target.value })}
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  >
                    <option value="Phosphoric Acid">Phosphoric</option>
                    <option value="Citric Acid">Citric</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Mm</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.acid_mm ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_mm: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Cm/Hr</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.acid_cm_hr ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_cm_hr: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="24.0"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">%</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isLocked}
                      value={sheet.acid_pct ?? ""}
                      onChange={(e) => onUpdateHeader({ acid_pct: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="0.06"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Bleaching Earth */}
              <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tanah Peluntur (BE)</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Setting</span>
                    <input
                      type="number"
                      step="0.05"
                      disabled={isLocked}
                      value={sheet.earth_setting ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_setting: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="1.25"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Min %</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isLocked}
                      value={sheet.earth_min_pct ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_min_pct: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="0.80"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Kgs/Day</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sheet.earth_kgs_day ?? ""}
                      onChange={(e) => onUpdateHeader({ earth_kgs_day: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white"
                      placeholder="9180"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Filter Aids */}
              <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Filter Aids</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Aid 1 (Jenis / Qty)</span>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={sheet.aid1_type}
                        onChange={(e) => onUpdateHeader({ aid1_type: e.target.value })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
                        placeholder="Jenis"
                      />
                      <input
                        type="number"
                        disabled={isLocked}
                        value={sheet.aid1_qty ?? ""}
                        onChange={(e) => onUpdateHeader({ aid1_qty: parseFloat(e.target.value) || null })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold"
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Aid 2 (Jenis / Qty)</span>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={sheet.aid2_type}
                        onChange={(e) => onUpdateHeader({ aid2_type: e.target.value })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
                        placeholder="Jenis"
                      />
                      <input
                        type="number"
                        disabled={isLocked}
                        value={sheet.aid2_qty ?? ""}
                        onChange={(e) => onUpdateHeader({ aid2_qty: parseFloat(e.target.value) || null })}
                        className="w-1/2 px-1.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold"
                        placeholder="Qty"
                      />
                    </div>
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
