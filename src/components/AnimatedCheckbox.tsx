"use client";

import React from "react";

export interface AnimatedCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | number;
  color?: "amber" | "emerald" | "white";
  className?: string;
  label?: React.ReactNode;
  id?: string;
  name?: string;
  title?: string;
  tabIndex?: number;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  color = "amber",
  className = "",
  label,
  id,
  name,
  title,
  tabIndex,
}) => {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "xs"
      ? 15
      : size === "sm"
      ? 18
      : size === "lg"
      ? 24
      : 20;

  const colorClass =
    color === "emerald"
      ? "theme-emerald"
      : color === "white"
      ? "theme-white"
      : "theme-amber";

  return (
    <label
      title={title}
      className={`uiverse-checkbox-container ${colorClass} ${
        checked ? "is-checked" : ""
      } ${disabled ? "is-disabled" : ""} ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        tabIndex={tabIndex}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (!disabled && onChange) {
            onChange(e.target.checked);
          }
        }}
      />
      <svg
        viewBox="0 0 64 64"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        aria-hidden="true"
      >
        <path
          d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
          pathLength="575.0541381835938"
          className="uiverse-checkbox-path"
        />
      </svg>
      {label && <span className="ml-2 select-none">{label}</span>}
    </label>
  );
};

export default AnimatedCheckbox;
