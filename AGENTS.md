---
description: Instructions building apps with MCP and End-to-End System Architecture Standards
globs: *
alwaysApply: true
---

# InsForge SDK Documentation - Overview

## What is InsForge?

Backend-as-a-service (BaaS) platform providing:

- **Database**: PostgreSQL with PostgREST API
- **Authentication**: Email/password + OAuth (Google, GitHub)
- **Storage**: File upload/download
- **AI**: OpenRouter key provisioning and model catalog for direct OpenAI-compatible integrations
- **Functions**: Serverless function deployment
- **Realtime**: WebSocket pub/sub (database + client events)

## Installation

The following is a step-by-step guide to installing and using the InsForge TypeScript SDK for Web applications. If you are building other types of applications, please refer to:
- [Swift SDK documentation](/sdks/swift/overview) for iOS, macOS, tvOS, and watchOS applications.
- [Kotlin SDK documentation](/sdks/kotlin/overview) for Android applications.
- [REST API documentation](/sdks/rest/overview) for direct HTTP API access.

### 🚨 CRITICAL: Follow these steps in order

### Step 1: Download Template

Use the `download-template` MCP tool to create a new project with your backend URL and anon key pre-configured.

### Step 2: Install SDK

```bash
npm install @insforge/sdk@latest
```

### Step 3: Create SDK Client

You must create a client instance using `createClient()` with your base URL and anon key:

```javascript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://your-app.region.insforge.app',  // Your InsForge backend URL
  anonKey: 'your-anon-key-here'       // Get this from backend metadata
});

```

**API BASE URL**: Your API base URL is `https://your-app.region.insforge.app`.

## Getting Detailed Documentation

### 🚨 CRITICAL: Always Fetch Documentation Before Writing Code

InsForge provides official SDKs and REST APIs, use them to interact with InsForge services from your application code.

- [TypeScript SDK](/sdks/typescript/overview) - JavaScript/TypeScript
- [Swift SDK](/sdks/swift/overview) - iOS, macOS, tvOS, and watchOS
- [Kotlin SDK](/sdks/kotlin/overview) - Android and Kotlin Multiplatform
- [REST API](/sdks/rest/overview) - Direct HTTP API access

Before writing or editing any InsForge integration code, you **MUST** call the `fetch-docs` or `fetch-sdk-docs` MCP tool to get the latest SDK documentation. This ensures you have accurate, up-to-date implementation patterns.

### Use the InsForge `fetch-docs` MCP tool to get specific SDK documentation:

Available documentation types:

- `"instructions"` - Essential backend setup (START HERE)
- `"real-time"` - Real-time pub/sub (database + client events) via WebSockets
- `"db-sdk-typescript"` - Database operations with TypeScript SDK
- **Authentication** - Choose based on implementation:
  - `"auth-sdk-typescript"` - TypeScript SDK methods for custom auth flows
  - `"auth-components-react"` - Pre-built auth UI for React+Vite (single-page app)
  - `"auth-components-react-router"` - Pre-built auth UI for React(Vite+React Router) (multi-page app)
  - `"auth-components-nextjs"` - Pre-built auth UI for Next.js (SSR app)
- `"storage-sdk"` - File storage operations
- `"functions-sdk"` - Serverless functions invocation
- `"ai-integration-sdk"` - AI integration with the provisioned OpenRouter key and OpenAI SDK
- `"deployment"` - Deploy frontend applications via MCP tool
- `"payments"` - Stripe Checkout, Billing Portal, webhook projections, and fulfillment patterns

These docs are mostly for the TypeScript SDK. For other languages, you can also use the `fetch-sdk-docs` MCP tool to get specific documentation.

### Use the InsForge `fetch-sdk-docs` MCP tool to get specific SDK documentation

You can fetch SDK documentation using the `fetch-sdk-docs` MCP tool with a specific feature type and language.

Available feature types:
- `db` - Database operations
- `storage` - File storage operations
- `functions` - Serverless functions invocation
- `auth` - User authentication
- `ai` - AI integration with the provisioned OpenRouter key and OpenAI SDK
- `realtime` - Real-time pub/sub (database + client events) via WebSockets
- `payments` - Stripe Checkout and Billing Portal with webhook-based fulfillment

Available languages:
- `typescript` - JavaScript/TypeScript SDK
- `swift` - Swift SDK (for iOS, macOS, tvOS, and watchOS)
- `kotlin` - Kotlin SDK (for Android and JVM applications)
- `rest-api` - REST API

Payments currently has TypeScript SDK docs only. Use the Payments API reference for non-TypeScript clients.

## When to Use SDK vs MCP Tools

### Always SDK for Application Logic:

- Authentication (register, login, logout, profiles)
- Database CRUD (select, insert, update, delete)
- Storage operations (upload, download files)
- AI integration via the provisioned OpenRouter key with the OpenAI SDK or OpenRouter HTTP API
- Serverless function invocation
- Payments checkout and customer portal session creation

### Use MCP Tools for Infrastructure:

- Project scaffolding (`download-template`) - Download starter templates with InsForge integration
- Backend setup and metadata (`get-backend-metadata`)
- Database schema management (`run-raw-sql`, `get-table-schema`)
- Storage bucket creation (`create-bucket`, `list-buckets`, `delete-bucket`)
- Serverless function deployment (`create-function`, `update-function`, `delete-function`)
- Frontend deployment (`create-deployment`) - Deploy frontend apps to InsForge hosting

## Important Notes

- For auth: use `auth-sdk` for custom UI, or framework-specific components for pre-built UI
- SDK returns `{data, error}` structure for all operations
- Database inserts require array format: `[{...}]`
- Serverless functions have one endpoint and do not support nested route paths
- Storage: Upload files to buckets, store URLs in database
- AI integrations should call OpenRouter directly with `baseURL: "https://openrouter.ai/api/v1"` and a server-side `OPENROUTER_API_KEY`
- **EXTRA IMPORTANT**: Use Tailwind CSS 3.4 (do not upgrade to v4). Lock these dependencies in `package.json`

---

# Mandatory Project Standards & Rules (Strict Enforcement)

## 1. 100% Fully English UI, Code, and Messages
- All UI labels, headers, descriptions, badges, tooltips, buttons, modal copy, toasts, error messages, and audit logs MUST be in **100% English**.
- No Malay text permitted in any component, template, helper, or user-facing view.
- All code comments, variable names, documentation, and type definitions must be in clean professional English.

## 2. Standard Legible Typography Standard (No Skinny / Tiny Fonts)
- **STRICTLY BAN** skinny, microscopic, or unreadable fonts:
  - Do NOT use `text-[9px]`, `text-[10px]`, or `text-[11px]`.
  - Do NOT use ultra-light font weights: eliminate `font-thin`, `font-extralight`, `font-light`.
- **Use standard, comfortable, legible font sizes**:
  - Compact badges / chips: minimum `text-xs` (12px) with `font-semibold` or `font-bold`.
  - Body copy, table data cells, subtitles: `text-sm` (14px) or `text-xs` (12px) with `font-normal`, `font-medium`, or `font-semibold`.
  - Headings, metrics, action buttons: `text-base` (16px), `text-lg` (18px), `text-xl` (20px)+.
  - Maintain robust, crisp industrial contrast and readability at all times.

## 3. Strict Pre-Completion Verification & Premium Layout Polish
- **NEVER declare a task completed prematurely**.
- Before declaring completion, you MUST:
  1. Thoroughly review and audit every view and component across the website.
  2. Double-check layout balance, spacing rhythm, clean alignment, and premium 3D industrial aesthetics.
  3. Verify that all features, interactive states, drawers, and modal workflows operate smoothly without glitches.
  4. Run `npm run build` or automated test verification to confirm 100% build success with ZERO errors.
  5. Commit and push to git so live deployments stay up to date.
  6. Only declare completion after rigorous double-checking.

---

# Cross-Module Dependency & Ripple-Effect Tracking Rules (Anti-Isolation Enforcement)

### 🚨 Core Principle: Zero Isolated Modifications ("Tidak Boleh Lurus Bendul")
Whenever a feature, field, calculation, parameter, button, or workflow is adjusted, **DO NOT modify just one file in isolation**. Every change in this refinery system inherently cascades across multiple modules, state stores, reports, and sync pipelines. The AI Agent MUST systematically trace, inspect, and update the entire downstream dependency chain.

---

## 4. System Architecture & Module Map

The application is structured into clearly defined functional modules orchestrated by `src/app/page.tsx`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR: src/app/page.tsx                        │
│   (Central State, Session, InsForge DB Sync, Clock, Date, Notifications)    │
└──────┬─────────────┬─────────────┬─────────────┬─────────────┬──────────────┘
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│ BLEACHING   ││ QC LAB      ││ MASTER DATA ││ REPORTS &   ││ SUPERVISOR  │
│ PROCESS LOG ││ MANAGEMENT  ││ & ANALYTICS ││ AUDIT LOG   ││ MONITORING  │
│ (RF-FR-003) ││ (RF-FR-001) ││ (TELEMETRY) ││ (ARCHIVE)   ││ & APPROVALS │
└─────────────┘└─────────────┘└─────────────┘└─────────────┘└─────────────┘
       │             │             │             │             │
       └─────────────┼─────────────┼─────────────┼─────────────┘
                     ▼             ▼             ▼
       ┌─────────────────────────────────────────────────────────┐
       │                   SHARED SERVICES & HUD                 │
       │  • HeaderNav.tsx (Plant Clock, Calendar Date, Role)     │
       │  • SidebarNav.tsx (Left Menu, Role Badges, Counts)      │
       │  • FloatingBottomDock.tsx (Responsive Mobile Dock)      │
       │  • PdfExportModal.tsx (Official Form RF-FR-003 Rev 03)  │
       │  • workflowPipeline.ts (Inter-Module Data Handover)     │
       │  • dbService.ts (InsForge PostgreSQL & Snapshots)       │
       │  • utils.ts & constants.ts (Specs, Formulas, Slots)     │
       └─────────────────────────────────────────────────────────┘
```

### Component Directory & Responsibilities:

| Path | Primary Responsibility | Consumers / Dependents |
| :--- | :--- | :--- |
| `src/app/page.tsx` | Main application orchestrator, state root, live clock, InsForge sync engine | All views and shared components |
| `src/types/index.ts` | Single source of truth for domain models (`LogSheet`, `LogEntry`, `SampleReport`, `UserProfile`) | Entire codebase |
| `src/lib/constants.ts` | Process control limits (HE Temp 70-115°C, Vacuum ≥600 mmHg), shift hours, Niagara filters | `utils.ts`, `SlotEntryDrawer`, `HourlyTableGrid` |
| `src/lib/utils.ts` | Calculation formulas, out-of-spec validation (`validateReadingSpecs`), deterministic timestamps | `page.tsx`, `SlotEntryDrawer`, `mockData.ts` |
| `src/lib/realtimeTimeline.ts` | Real-time plant clock ticking, shift resolution, slot locking policy & SOP rules | `page.tsx`, `HeaderNav`, `SlotEntryDrawer` |
| `src/lib/workflowPipeline.ts` | **Bleaching Log ↔ QC Lab handover engine**: creates sample tickets and syncs lab test results back to log | `page.tsx`, `SlotEntryDrawer`, `HourlyTableGrid` |
| `src/lib/dbService.ts` | InsForge PostgreSQL CRUD, cloud snapshot synchronization, audit trails, user last login | `page.tsx`, `QCManagementView`, `MasterDataView` |
| `src/components/HeaderNav.tsx` | Top bar: plant clock, calendar date selector, role indicator, theme toggle, PDF button | `page.tsx` |
| `src/components/SidebarNav.tsx` | Left navigation menu, live badges, role-based access control (RBAC) | `page.tsx` |
| `src/components/FloatingBottomDock.tsx` | Mobile viewport navigation dock capsule with 3D glassmorphism | `page.tsx` |
| `src/components/HourlyTableGrid.tsx` | 24-hour hourly slot grid, Shift 1/2/3 subtotals, 24-hr daily total, slot click handler | `page.tsx` |
| `src/components/SlotEntryDrawer.tsx` | Drawer for entering hourly readings, real-time out-of-spec alerts, Send to QC button | `page.tsx` |
| `src/components/QCManagementView.tsx` | QC Lab sample management, incoming dispatched queue, test editor, disposition decisions | `page.tsx` |
| `src/components/MasterDataView.tsx` | Product, Plant, Tank catalog management, SVG telemetry curves, Glider Radio Buttons | `page.tsx` |
| `src/components/ReportsView.tsx` | Historical reports, audit trail viewer, Excel/CSV export | `page.tsx` |
| `src/components/SupervisorMonitoringView.tsx` | Shift sign-offs, emergency time-lock override, supervisor review notes | `page.tsx` |
| `src/components/UserManagementView.tsx` | Plant personnel roster directory, role assignments, user status | `page.tsx` |
| `src/components/PdfExportModal.tsx` | **Official Form RF-FR-003 Rev 03 print layout**: syncs all 24 slots, subtotals, Niagara telemetry, QC test sync | `page.tsx`, `HeaderNav`, `SidebarNav` |
| `src/components/GliderRadioGroup.tsx` | Reusable iOS-style animated radio glider switch for filter tabs | `MasterDataView`, `QCManagementView`, `UserManagementView` |

---

## 5. End-to-End Cross-Module Data Flows

Whenever editing features, verify each of these critical interconnected flows:

### Flow 1: Operator Hourly Slot Entry → Out-of-Spec Alert → Supervisor Hub
1. Operator inputs parameter in `SlotEntryDrawer.tsx`.
2. `validateReadingSpecs()` in `src/lib/utils.ts` checks limits against `PROCESS_SPECS` in `src/lib/constants.ts`:
   - `he_temp_c`: 70.0°C – 115.0°C
   - `vacuum_mmhg`: ≥ 600.0 mmHg
3. If value violates specs, `out_of_spec` array is populated.
4. On save in `page.tsx` (`handleSaveSlot`):
   - Updates `sheet.entries[slotIndex]`.
   - Creates a `SupervisorUpdateEvent` with `severity: 'alert'` and `requires_acknowledgment: true`.
   - Increments badge count in `SidebarNav.tsx` and `FloatingBottomDock.tsx`.
   - Synchronizes entry to InsForge `process_logs` and audit trail in `dbService.ts`.
   - Persists state snapshot to InsForge `audit_logs` (`CURRENT_SHEET`).

### Flow 2: Bleaching Log Slot → "Send to QC" Sampling Handover → QC Lab → Bleaching Log Sync
1. Operator clicks "Send to QC" on an hourly slot (`HourlyTableGrid.tsx` or `SlotEntryDrawer.tsx`).
2. `handleDispatchToQc(slotIndex)` in `page.tsx` invokes `createOrUpdateQcSampleFromLogEntry` in `src/lib/workflowPipeline.ts`.
3. Creates a `SampleReport` with:
   - `status: 'awaiting_results'`
   - Auto-generated `report_no` (`SAR-YYYY-SLOT`)
   - Auto-generated `lot_no` (`LOT-PLANT-YYYYMMDD-SLOT`)
   - Pre-populated results placeholder (FFA, Colour Red, Colour Yellow, Moisture, DOBI).
4. Entry in Bleaching Log is marked `qc_sample_sent: true`.
5. In `QCManagementView.tsx`:
   - Sample appears under **"Dispatched Sampling Signals from Bleaching Plant"** incoming queue.
   - Shows time check, product, tank, operator name, and a prominent 1-click **"Analyze Sample & Input Results"** action.
6. Chemist inputs test values and selects decision (`accept` or `reject`).
7. `handleUpdateQcReport` in `page.tsx` triggers `syncQcResultToLogEntries`:
   - Synchronizes `colour_r`, `ffa_pct` back into the corresponding slot entry in `sheet.entries`.
   - Updates `PdfExportModal.tsx` so official RF-FR-003 print format reflects certified lab values.
   - Pushes updates to InsForge `sample_reports`, `qc_decisions`, and cloud state snapshots.

### Flow 3: Sheet Operating Parameters & Active Product Propagation
1. When product is selected/updated in `SheetHeaderParameters.tsx`:
   - Updates `sheet.product_id` and `sheet.product_name`.
   - Syncs to InsForge `batch_processes` (Batch BP001).
2. The updated `activeProductName` automatically propagates:
   - To `QCManagementView.tsx` banner ("Current Operating Oil") and default registered sample name.
   - To `PdfExportModal.tsx` header title block.
   - To `MasterDataView.tsx` product catalog.

### Flow 4: 24-Hour Process Grid Calculations & A4 Print Export (RF-FR-003 Rev 03)
1. Whenever any slot reading changes:
   - `Shift 1 Subtotal` (Slots 0800–1500), `Shift 2 Subtotal` (Slots 1600–2300), and `Shift 3 Subtotal` (Slots 2400–0700) must calculate identical averages/totals across:
     * `HourlyTableGrid.tsx` (Interactive web table)
     * `PdfExportModal.tsx` (Official A4 print preview)
     * `ReportsView.tsx` (Shift summary cards)
2. Niagara filter telemetry (`N60-1` to `N60-4`) and filter change times must remain in 100% parity across web grid and print modal.

### Flow 5: Real-time Live Plant Shift vs Historical Calendar Archive
1. `selectedDate === todayStr`:
   - System is in **Live Continuous Operation** mode.
   - Clock ticks dynamically every second (`clockState.formattedTime`).
   - Active slot is determined by plant clock (`clockState.slotIndex`).
   - Slot editing is governed by SOP realtime locking policy (`evaluateSlotAccess`).
2. `selectedDate !== todayStr`:
   - System is in **Historical Archive View** mode.
   - Displays yellow archive banner: *"HISTORICAL ARCHIVE MODE: You are viewing logs for [Date]"*.
   - Loads archived sheet from `localStorage` (`nisshin_archive_sheet_[date]`) or InsForge snapshot.
   - Header provides a 1-click **"Live"** button to immediately restore today's active operational log.

---

## 6. Mandatory Cascading Change Checklist

Before concluding any modification to the codebase, the AI Agent MUST run through this checklist:

- [ ] **1. Types & Data Contracts (`src/types/index.ts`)**: Are all modified properties added to relevant TypeScript interfaces? Does `tsc` pass without type errors?
- [ ] **2. Cloud & Local Persistence (`src/lib/dbService.ts`)**: Is the modified entity saved to LocalStorage and synced to InsForge PostgreSQL (`batch_processes`, `process_logs`, `sample_reports`, or `audit_logs`)?
- [ ] **3. Handover Pipelines (`src/lib/workflowPipeline.ts`)**: If a log entry or QC sample changed, does the pipeline correctly bridge data between Bleaching Log and QC Lab?
- [ ] **4. Shared HUDs & Navigation (`HeaderNav`, `SidebarNav`, `FloatingBottomDock`)**: Do badge counters, role indicators, and active tab states reflect the updated data?
- [ ] **5. Official Export Formats (`PdfExportModal.tsx`)**: Does the official A4 Landscape RF-FR-003 Rev 03 document reflect the change with correct subtotals, headings, and alignments?
- [ ] **6. Spec Validations (`src/lib/constants.ts` & `src/lib/utils.ts`)**: Are allowable min/max operating ranges enforced consistently in drawers and grids?
- [ ] **7. Role-Based Access Control (RBAC)**: Does the change respect role permissions (`technician`, `supervisor`, `manager_qa`, `admin`, `chemist`)?
- [ ] **8. Responsive Viewports**: Does the layout adapt cleanly on mobile (390×844) without horizontal clipping?
- [ ] **9. Build Verification**: Does the project compile cleanly with zero TypeScript or linting errors?