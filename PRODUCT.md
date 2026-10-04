# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, Tailwind CSS, TypeScript) · InsForge (PostgreSQL, Row Level Security, Auth, Storage)

## Users

- **Plant Technicians**: Primary operational users working in 3 shifts (Shift 1: 0800–1500, Shift 2: 1600–2300, Shift 3: 2400–0700). Tasked with entering hourly bleaching process parameters and quality readings on plant tablets or terminals.
- **Shift Supervisors**: Reviewing submitted 24-hour log sheets, adding review remarks, approving or returning sheets for corrections, and locking completed runs.
- **QA & Refinery Managers**: Auditing historical batch logs, tracking out-of-spec incidents, and exporting certified PDF reports for compliance.
- **System Administrators**: Managing master data (plants, products, feed/discharge tanks, users, and shift assignments).

## Product Purpose

Digitize the official physical refinery bleaching process log (Form RF-FR-003, Rev 03) for the Refinery Department of Lam Soon Edible Oils Sdn Bhd. Replaces manual handwriting and paper filing to eliminate lost records, ensure immediate detection of out-of-spec operating parameters (temperature, vacuum, dosage), and streamline supervisor sign-offs with compliance-grade A4 PDF exports.

## Positioning

A 1:1 digital reflection of the statutory refinery bleaching log that operators already know, enhanced with instant boundary validation and automated audit logging. Unlike generic industrial dashboards, it preserves the exact structure and cadence of Form RF-FR-003 to require zero technician retraining.

## Operating Context

- **Environment**: Edible oil refinery processing plant floor with varying ambient lighting, industrial noise, and operators frequently using gloved or busy hands.
- **Device**: Primarily landscape tablets (and desktop terminals) with touch-first interaction.
- **Cadence**: 24-hour continuous tracking across 24 fixed hourly slots (0800 to 0700 spanning two calendar days). Each hourly entry must take under 60 seconds.

## Capabilities and Constraints

- **Form Identity**: Form RF-FR-003 / Rev 03.
- **24-Slot Time Structure**: 0800 to 2400, followed by 0100 to 0700 of the next calendar day.
- **Real-Time Validation Thresholds**:
  - Heat Exchanger Temperature: 70–115 °C.
  - Bleacher Vacuum: Minimum 600 mmHg.
  - Bleacher Level: L (Low) or H (High) toggle.
  - Critical Quality: FFA (%), Colour (R & Y).
- **Non-Blocking Fault Entry**: Out-of-spec readings are recorded and visually flagged (not blocked), with mandatory technician remarks to preserve authentic operational truth.
- **Supervisor Workflow**: Electronic review, contextual commenting, sheet rejection/approval, and audit-locked state.
- **Export & Printing**: Exact A4 landscape PDF generation matching the official regulatory paper sheet.

## Brand Commitments

- **Tone & Identity**: Utilitarian, reliable, high-precision industrial tooling.
- **Visual Discipline**: High-contrast, scannable data grids, crisp status badges, zero distracting ornamentation or playful clutter.

## Evidence on Hand

- `prd.md` and `PRD_ Digital Bleaching Process Log (RF-FR-003), English (1).md` (Approved requirements specification).
- `insforge_schema.sql` (PostgreSQL database schema & table definitions).
- Existing UI components: `src/components/HourlyTableGrid.tsx`, `src/components/SlotRail.tsx`, `src/components/SheetHeaderParameters.tsx`, `src/components/SupervisorReviewModal.tsx`, `src/components/PdfExportModal.tsx`.

## Product Principles

1. **Zero Operator Friction**: Keep layout and column order identical to physical Form RF-FR-003 so technicians require no relearning.
2. **60-Second Logging**: Fast, thumb-friendly numeric inputs and slot navigation designed for quick completion.
3. **Never Suppress Reality**: Physical deviations must be recorded cleanly and highlighted immediately, never blocked by validation gates.
4. **Plant-Floor Ergonomics**: High-contrast, anti-glare typography, clear visual hierarchy, and distinct status cues readable at a glance.

## Accessibility & Inclusion

- WCAG 2.1 AA compliant color contrast tailored for bright plant lighting and mobile tablet screens.
- Touch target sizes minimum 44–48px for gloved and rapid touch interaction.
- Full keyboard and keypad navigation support for desktop terminals.
