import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industry-specific design tokens from PRD RF-FR-003 Rev 03
        oil: {
          50: "#FDF9EE",
          100: "#FBF3DC",
          200: "#F6E4B4",
          300: "#EED184",
          400: "#D4A32D",
          500: "#B8860B", // Primary Oil Gold
          600: "#996515",
          700: "#754C11",
          800: "#553610",
          900: "#36220B",
        },
        ink: {
          DEFAULT: "#1B2A2E",
          muted: "#5E6E73",
          light: "#F5F6F4",
          dark: "#0F172A",
        },
        inspec: {
          DEFAULT: "#2F7D52",
          bg: "#EBF5F0",
          border: "#A3D9BD",
        },
        outofspec: {
          DEFAULT: "#C0392B",
          bg: "#FDEDEC",
          border: "#F5B7B1",
        },
        overdue: {
          DEFAULT: "#D97706",
          bg: "#FEF3C7",
          border: "#FCD34D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
