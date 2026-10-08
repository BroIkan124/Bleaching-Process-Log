"use client";

import React, { useState, useRef, useEffect, useId } from "react";
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
  Sparkles
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
}

// Helper to provide contextual default icons matching the Option.html aesthetic
function getDefaultIcon(label: string, value: string): React.ReactNode {
  const text = `${label} ${value}`.toLowerCase();
  
  if (text.includes("plant") || text.includes("line 1") || text.includes("line 2") || text.includes("fractionation")) {
    return <Factory className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (text.includes("acid") || text.includes("phosphoric") || text.includes("citric")) {
    return <Beaker className="w-3.5 h-3.5 text-sky-400" />;
  }
  if (text.includes("feed") || text.includes("discharge") || text.includes("tank")) {
    return <Database className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (text.includes("oil") || text.includes("rbd") || text.includes("chocohi") || text.includes("daisy") || text.includes("palm")) {
    return <Droplets className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (text.includes("alert") || text.includes("critical")) {
    return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
  }
  if (text.includes("warning") || text.includes("attention")) {
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (text.includes("success") || text.includes("in-spec")) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (text.includes("info")) {
    return <Info className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (text.includes("shift") || text.includes("today") || text.includes("days") || text.includes("month") || text.includes("24 hour")) {
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (text.includes("admin") || text.includes("supervisor") || text.includes("qa") || text.includes("technician") || text.includes("chemist")) {
    return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
  }
  if (text.includes("log") || text.includes("operating") || text.includes("source")) {
    return <Sliders className="w-3.5 h-3.5 text-violet-400" />;
  }
  
  // Default clean radio dot icon
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" fill="currentColor">
      <circle cx="8" cy="8" r="4" opacity="0.7" />
    </svg>
  );
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
}: RadioSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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

  // Check collision for upward opening
  useEffect(() => {
    if (isOpen && direction === "auto" && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below is less than 220px and space above is greater, open upward
      if (spaceBelow < 220 && rect.top > 220) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    } else if (direction === "up") {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [isOpen, direction]);

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
    xs: "px-2 py-1 text-[11px] rounded-lg",
    sm: "px-2.5 py-1.5 text-xs rounded-xl",
    md: "px-3 py-2 text-xs rounded-xl",
  }[size];

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

      {/* Dropdown Menu — Option.css Uiverse 3D Design */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          style={{ width: menuWidth || "100%" }}
          className={`radio-option-container absolute z-[120] max-h-60 overflow-y-auto custom-scrollbar animate-scale-in ${
            openUpward ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
          } ${align === "right" ? "right-0" : "left-0"} ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-400 italic">No options available</div>
          ) : (
            normalizedOptions.map((opt) => {
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
      )}
    </div>
  );
}

export default RadioSelect;

