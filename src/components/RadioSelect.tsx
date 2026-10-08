"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronDown, 
  Check, 
  Factory, 
  Droplets, 
  Database, 
  Beaker, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Shield, 
  Sliders, 
  FileText,
  User,
  FlaskConical,
  Flame,
  Layers,
  Sparkles,
  Search,
  Plus,
  X
} from "lucide-react";

export interface RadioOptionItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export type RadioOptionInput = RadioOptionItem | { id: string; name: string } | string;

export interface RadioSelectProps {
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: RadioOptionInput[];
  placeholder?: string;
  disabled?: boolean;
  className?: string; // Trigger button custom styles
  menuClassName?: string;
  menuWidth?: string;
  align?: "left" | "right";
  direction?: "down" | "up" | "auto";
  icon?: React.ReactNode;
  size?: "sm" | "md" | "xs";
  id?: string;
  name?: string;
  variant?: "dropdown" | "inline";
  searchable?: boolean;
  onAddCustom?: () => void;
  addCustomLabel?: string;
}

// Helper to provide contextual default icons matching the Option.html aesthetic
function getDefaultIcon(label: string, value: string): React.ReactNode {
  const text = `${label} ${value}`.toLowerCase();
  
  if (text.includes("plant") || text.includes("line 1") || text.includes("line 2") || text.includes("fractionation")) {
    return <Factory className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  if (text.includes("acid") || text.includes("phosphoric") || text.includes("citric")) {
    return <Beaker className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  }
  if (text.includes("feed") || text.includes("discharge") || text.includes("tank")) {
    return <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (text.includes("alert") || text.includes("critical")) {
    return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  }
  if (text.includes("warning") || text.includes("attention")) {
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (text.includes("success") || text.includes("in-spec")) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (text.includes("info")) {
    return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  if (text.includes("shift") || text.includes("today") || text.includes("days") || text.includes("month") || text.includes("24 hour")) {
    return <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (text.includes("admin") || text.includes("supervisor") || text.includes("qa") || text.includes("technician") || text.includes("chemist")) {
    return <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
  if (text.includes("log") || text.includes("operating") || text.includes("source")) {
    return <Sliders className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
  }
  
  // ALL refinery oil product types (DF 20, FARM COW, G9, CHOCOHI, etc.) and general options get the golden oil droplets icon!
  return <Droplets className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
}

export function RadioSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  menuClassName = "",
  menuWidth,
  align = "left",
  direction = "auto",
  icon,
  size = "md",
  id,
  name,
  variant = "dropdown",
  searchable = false,
  onAddCustom,
  addCustomLabel,
}: RadioSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options array
  const normalizedOptions: RadioOptionItem[] = options.map((opt) => {
    if (typeof opt === "string") {
      return {
        value: opt,
        label: opt,
        icon: getDefaultIcon(opt, opt),
      };
    }
    if ("id" in opt && "name" in opt) {
      return {
        value: opt.id,
        label: opt.name,
        icon: getDefaultIcon(opt.name, opt.id),
      };
    }
    return {
      ...opt,
      icon: opt.icon || getDefaultIcon(opt.label, opt.value),
    };
  });

  const stringValue = value !== undefined && value !== null ? String(value) : "";
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === stringValue);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  // Realtime positioning coordinates calculation
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setTriggerRect(rect);
        const spaceBelow = window.innerHeight - rect.bottom;
        if (direction === "auto") {
          setOpenUpward(spaceBelow < 250 && rect.top > 250);
        } else if (direction === "up") {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, direction]);

  // Close on outside click (supporting portal mounted in document.body)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === stringValue);
        const nextIndex = (currentIndex + 1) % normalizedOptions.length;
        onChange(normalizedOptions[nextIndex].value);
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === stringValue);
        const prevIndex = (currentIndex - 1 + normalizedOptions.length) % normalizedOptions.length;
        onChange(normalizedOptions[prevIndex].value);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchQuery("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // If rendered as inline radio group (e.g., in a dedicated settings card or side panel)
  if (variant === "inline") {
    return (
      <div 
        ref={containerRef}
        className={`radio-option-container w-full ${className}`}
        role="radiogroup"
        aria-labelledby={selectId}
      >
        {normalizedOptions.map((opt) => {
          const isSelected = String(opt.value) === stringValue;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(opt.value)}
              className={`radio-option-value group ${isSelected ? "is-active" : ""}`}
              role="radio"
              aria-checked={isSelected}
            >
              <span className="flex items-center gap-2 flex-1 min-w-0">
                <span className="transition-transform duration-200 group-hover:scale-110">
                  {opt.icon}
                </span>
                <span className="truncate">{opt.label}</span>
              </span>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-[#2F81F7] flex-shrink-0 animate-scale-in" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Size specific styling for trigger
  const sizeClasses = {
    xs: "px-2.5 py-1 text-xs rounded-lg",
    sm: "px-2.5 py-1.5 text-xs rounded-xl",
    md: "px-3 py-2 text-xs rounded-xl",
  }[size];

  const isSearchEnabled = searchable || normalizedOptions.length > 7;
  const filteredOptions = isSearchEnabled && searchQuery.trim()
    ? normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : normalizedOptions;

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block w-full text-left ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form submissions */}
      {name && <input type="hidden" name={name} value={stringValue} />}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 font-medium text-zinc-900 dark:text-zinc-100 transition-all duration-200 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer ${
          isOpen ? "ring-2 ring-[#2F81F7]/40 border-[#2F81F7] dark:border-[#2F81F7]" : ""
        } ${sizeClasses} ${className}`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {icon ? (
            <span className="flex-shrink-0">{icon}</span>
          ) : selectedOption?.icon ? (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          ) : null}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 text-[#2F81F7]" : ""
          }`} 
        />
      </button>

      {/* Dropdown Menu — Option.css Uiverse 3D Design portalled to document.body */}
      {isOpen && triggerRect && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          style={{
            position: "fixed",
            top: openUpward ? `${triggerRect.top - 6}px` : `${triggerRect.bottom + 6}px`,
            transform: openUpward ? "translateY(-100%)" : "none",
            left: align === "right" ? "auto" : `${triggerRect.left}px`,
            right: align === "right" ? `${window.innerWidth - triggerRect.right}px` : "auto",
            transformOrigin: openUpward ? "bottom" : "top",
            width: menuWidth || `${triggerRect.width}px`,
            zIndex: 99999,
          }}
          className={`radio-option-container max-h-72 flex flex-col overflow-hidden animate-scale-in shadow-2xl ${menuClassName}`}
        >
          {/* Quick Search Header */}
          {isSearchEnabled && (
            <div className="p-2 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/95 dark:bg-[#0A101D]/95 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 text-xs">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none text-xs"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Options List */}
          <div className="overflow-y-auto max-h-56 custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-400 text-center italic">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === stringValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`radio-option-value group ${isSelected ? "is-active font-semibold text-white" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                        {opt.icon}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </span>

                    {isSelected && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F81F7] shadow-[0_0_6px_#2F81F7]" />
                        <Check className="w-3.5 h-3.5 text-[#2F81F7]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Add Custom Product Action */}
          {onAddCustom && (
            <div className="p-2 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/95 dark:bg-[#0A101D]/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddCustom();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addCustomLabel || "+ Add New Product"}</span>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default RadioSelect;

