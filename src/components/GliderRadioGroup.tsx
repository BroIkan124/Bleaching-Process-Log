"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";

export interface GliderOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  notification?: string | number | null;
  notificationColor?: string;
  activeColor?: "amber" | "emerald" | "rose" | "indigo" | "sky" | "zinc";
  disabled?: boolean;
}

export interface GliderRadioGroupProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: GliderOption<T>[];
  size?: "xs" | "sm" | "md";
  variant?: "pill" | "rounded";
  themeColor?: "amber" | "emerald" | "rose" | "indigo" | "sky" | "zinc" | "dynamic";
  className?: string;
  tabClassName?: string;
  equalWidth?: boolean;
  disabled?: boolean;
  name?: string;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function GliderRadioGroup<T extends string = string>({
  value,
  onChange,
  options,
  size = "sm",
  variant = "pill",
  themeColor = "amber",
  className = "",
  tabClassName = "",
  equalWidth = false,
  disabled = false,
  name,
}: GliderRadioGroupProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [gliderStyle, setGliderStyle] = useState<{ left: number; width: number; height: number; ready: boolean }>({
    left: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const activeOption = options.find((opt) => opt.value === value) || options[0];

  // Measure and position the glider smoothly
  const updateGlider = () => {
    if (!containerRef.current || !activeOption) return;
    const activeBtn = tabRefs.current[activeOption.value];
    if (activeBtn) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;
      const height = btnRect.height;

      setGliderStyle({
        left,
        width,
        height,
        ready: true,
      });
    }
  };

  useIsomorphicLayoutEffect(() => {
    updateGlider();
  }, [value, options]);

  useEffect(() => {
    const handleResize = () => updateGlider();
    window.addEventListener("resize", handleResize);
    // Double check after fonts/styles are loaded
    const timer = setTimeout(updateGlider, 50);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const sizeClasses = {
    xs: "py-1 px-2.5 text-xs",
    sm: "py-1.5 px-3.5 text-xs",
    md: "py-2 px-4 text-xs sm:text-sm",
  }[size];

  const containerRounded = variant === "pill" ? "rounded-full" : "rounded-xl";
  const gliderRounded = variant === "pill" ? "rounded-full" : "rounded-lg";

  // Determine glider background color
  const activeTheme = themeColor === "dynamic" ? (activeOption?.activeColor || "amber") : themeColor;

  const gliderGradients: Record<string, string> = {
    amber: "bg-amber-500 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_2px_10px_rgba(245,158,11,0.35)]",
    emerald: "bg-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]",
    rose: "bg-rose-500 bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_2px_10px_rgba(239,68,68,0.35)]",
    indigo: "bg-indigo-500 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_2px_10px_rgba(99,102,241,0.35)]",
    sky: "bg-sky-500 bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-[0_2px_10px_rgba(14,165,233,0.35)]",
    zinc: "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-white/10",
  };

  const gliderClass = gliderGradients[activeTheme] || gliderGradients.amber;

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={`relative inline-flex items-center p-1 bg-zinc-100/90 dark:bg-black/35 border border-zinc-200/80 dark:border-white/10 select-none ${containerRounded} ${className}`}
    >
      {/* Hidden Radio for accessibility and form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Smooth Glider Pill (Uiverse RadioButton Animation) */}
      <span
        aria-hidden="true"
        style={{
          transform: `translateX(${gliderStyle.left}px)`,
          width: `${gliderStyle.width}px`,
          height: gliderStyle.height > 0 ? `${gliderStyle.height}px` : "calc(100% - 8px)",
          opacity: gliderStyle.ready ? 1 : 0,
        }}
        className={`absolute top-1 left-0 z-0 pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] transition-[width,transform,opacity] ${gliderRounded} ${gliderClass}`}
      />

      {/* Segmented Radio Options */}
      {options.map((option) => {
        const isSelected = option.value === value;
        const isBtnDisabled = disabled || option.disabled;
        return (
          <button
            key={option.value}
            ref={(el) => {
              tabRefs.current[option.value] = el;
            }}
            type="button"
            role="radio"
            disabled={isBtnDisabled}
            aria-checked={isSelected}
            onClick={() => !isBtnDisabled && onChange(option.value)}
            className={`relative z-10 font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isBtnDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${
              equalWidth ? "flex-1" : ""
            } ${
              isSelected
                ? activeTheme === "zinc"
                  ? "text-zinc-900 dark:text-white font-bold"
                  : "text-white font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            } ${sizeClasses} ${tabClassName}`}
          >
            {option.icon && (
              <span className={`shrink-0 transition-transform duration-200 ${isSelected ? "scale-105" : ""}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>

            {/* Notification Badge (from Uiverse Radio.html) */}
            {option.notification !== undefined && option.notification !== null && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold rounded-full transition-all duration-200 ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : option.notificationColor || "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {option.notification}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default GliderRadioGroup;
