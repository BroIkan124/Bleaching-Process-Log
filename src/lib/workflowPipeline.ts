import { LogEntry, LogSheet, UserProfile, SupervisorUpdateEvent, SampleReport, SampleResult } from "@/types";

/**
 * Creates or updates a linked QC Lab Sample whenever a Bleaching Log entry is saved.
 * Implements: Bleaching Log -> QC Lab automatic workflow handover.
 */
export function createOrUpdateQcSampleFromLogEntry(
  entry: LogEntry,
  sheet: LogSheet,
  currentUser: UserProfile,
  existingReports: SampleReport[]
): { updatedReports: SampleReport[]; newEvent: SupervisorUpdateEvent; createdSample: SampleReport } {
  // Normalize time label to HH:00 format (e.g. "0900" -> "09:00")
  const hourPart = entry.time_label.slice(0, 2);
  const formattedTimeCheck = `${hourPart}:00`;
  const sheetDate = sheet.sheet_date || new Date().toISOString().split('T')[0];
  const reportNo = `SAR-${sheetDate.slice(0, 4)}-${entry.time_label}`;
  const plantCleanCode = (sheet.plant_name || sheet.plant_id || "REF1").toUpperCase().replace(/[^A-Z0-9]/g, '');
  const lotNo = `LOT-${plantCleanCode}-${sheetDate.replace(/-/g, '')}-${entry.time_label}`;
  const sampleId = `sample-${sheetDate}-${entry.time_label}`;

  // Find if a report for this slot on this specific sheet date already exists (match by ID, report_no, or lot_no)
  const existingIndex = existingReports.findIndex(
    (r) =>
      r.id === sampleId ||
      (r.report_no === reportNo && r.sample_date === sheetDate) ||
      (r.lot_no && r.lot_no === lotNo) ||
      (r.sample_date === sheetDate && (r.time_check === formattedTimeCheck || r.report_no?.endsWith(entry.time_label)))
  );

  const sampleResults: SampleResult[] = [
    {
      id: `res-color-r-${sampleId}`,
      report_id: sampleId,
      parameter_code: "COLOUR_R",
      parameter_name: "Lovibond Colour (Red)",
      unit: "R",
      value_numeric: entry.colour_r ?? null,
      in_spec: typeof entry.colour_r === 'number' ? entry.colour_r <= 2.5 : null,
      is_tested: true,
      entered_by_name: currentUser.name,
      entered_at: new Date().toISOString(),
    },
    {
      id: `res-color-y-${sampleId}`,
      report_id: sampleId,
      parameter_code: "COLOUR_Y",
      parameter_name: "Lovibond Colour (Yellow)",
      unit: "Y",
      value_numeric: entry.colour_y ?? null,
      in_spec: typeof entry.colour_y === 'number' ? entry.colour_y <= 25.0 : null,
      is_tested: true,
      entered_by_name: currentUser.name,
      entered_at: new Date().toISOString(),
    },
    {
      id: `res-ffa-${sampleId}`,
      report_id: sampleId,
      parameter_code: "FFA",
      parameter_name: "Free Fatty Acids (% FFA)",
      unit: "%",
      value_numeric: entry.ffa_pct ?? null,
      in_spec: typeof entry.ffa_pct === 'number' ? entry.ffa_pct <= 0.05 : null,
      is_tested: entry.ffa_pct !== null && entry.ffa_pct !== undefined,
      entered_by_name: currentUser.name,
      entered_at: new Date().toISOString(),
    },
    {
      id: `res-mi-${sampleId}`,
      report_id: sampleId,
      parameter_code: "H2O",
      parameter_name: "Moisture & Impurities (M&I)",
      unit: "%",
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-pv-${sampleId}`,
      report_id: sampleId,
      parameter_code: "PV",
      parameter_name: "Peroxide Value (PV)",
      unit: "meq/kg",
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-iv-${sampleId}`,
      report_id: sampleId,
      parameter_code: "IV",
      parameter_name: "Iodine Value (Wijs)",
      unit: "g I2/100g",
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-dobi-${sampleId}`,
      report_id: sampleId,
      parameter_code: "DOBI",
      parameter_name: "Bleachability Index (DOBI)",
      unit: "",
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
  ];

  let targetSample: SampleReport;

  if (existingIndex >= 0) {
    // Update existing report with fresh process telemetry references
    const existing = existingReports[existingIndex];
    targetSample = {
      ...existing,
      id: sampleId,
      report_no: reportNo,
      lot_no: lotNo,
      sample_date: sheetDate,
      time_check: formattedTimeCheck,
      product_name: sheet.product_name || existing.product_name || "RBD Palm Oil",
      feed_tank_code: sheet.feed_tank_name || existing.feed_tank_code || "TK-101",
      discharge_tank_code: sheet.discharge_tank_name || existing.discharge_tank_code || "TK-201",
      submitted_by_name: currentUser.name,
      remarks: `Synchronized from Bleaching Log Slot ${entry.time_label} Hrs (Flow: ${entry.flowrate_set ?? '-'} MT/HR, Vac: ${entry.vacuum_mmhg ?? '-'} mmHg, Temp: ${entry.he_temp_c ?? '-'}°C)`,
      status: existing.decision ? existing.status : 'awaiting_results',
      results: sampleResults,
      updated_at: new Date().toISOString(),
    };
  } else {
    // Generate new QC sample record
    targetSample = {
      id: sampleId,
      report_no: reportNo,
      sample_date: sheetDate,
      time_check: formattedTimeCheck,
      lot_no: lotNo,
      product_id: sheet.product_id,
      product_name: sheet.product_name || "RBD Palm Oil",
      feed_tank_code: sheet.feed_tank_name || "TK-101",
      discharge_tank_code: sheet.discharge_tank_name || "TK-201",
      sampling_point_name: "Deodorizer / Bleacher Outlet (SP-01)",
      submitted_by_name: currentUser.name,
      remarks: `Sample from Bleaching Log Slot ${entry.time_label} Hrs (Operator: ${currentUser.name})`,
      status: 'awaiting_results',
      created_at: new Date().toISOString(),
      results: sampleResults,
      decision: null,
    };
  }

  // Put targetSample at the VERY TOP of the reports list (filter out any duplicates of the same slot/lot)
  const remaining = existingReports.filter(
    (r) =>
      r.id !== sampleId &&
      r.report_no !== reportNo &&
      r.lot_no !== lotNo &&
      !(r.sample_date === sheetDate && (r.time_check === formattedTimeCheck || r.report_no?.endsWith(entry.time_label)))
  );
  const updatedReports = [targetSample, ...remaining];

  // Audit event for Supervisor Monitoring
  const hasAlert = entry.out_of_spec && entry.out_of_spec.length > 0;
  const newEvent: SupervisorUpdateEvent = {
    id: `evt-pipeline-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'Bleaching Log',
    title: hasAlert
      ? `ALERT: Slot ${entry.time_label} Hrs Logged (QC Attention Required)`
      : `Bleaching Log Slot ${entry.time_label} Hrs Logged -> Dispatched to QC Lab`,
    description: `${currentUser.name} recorded operating parameters for ${entry.time_label} Hrs. Sample ${reportNo} was automatically created and dispatched to QC Lab for chemical analysis.`,
    severity: hasAlert ? 'alert' : 'info',
    author_name: currentUser.name,
    author_role: currentUser.role,
    shift: entry.shift,
    slot_time: entry.time_label,
    lot_no: lotNo,
    requires_acknowledgment: hasAlert,
    acknowledged: false,
  };

  return { updatedReports, newEvent, createdSample: targetSample };
}

/**
 * Synchronizes QC Lab test results back into Bleaching Log and Reports.
 * Implements: QC Lab -> Bleaching Log & Reports handover.
 */
export function syncQcResultToLogEntries(
  qcReport: SampleReport,
  currentEntries: LogEntry[],
  currentUser: UserProfile
): { updatedEntries: LogEntry[]; newEvent: SupervisorUpdateEvent | null } {
  // Extract time label from time_check e.g. "09:00" -> "0900" or report_no "SAR-2026-0900"
  let timeLabel = "";
  if (qcReport.time_check) {
    const raw = qcReport.time_check.replace(":", "").trim();
    if (raw.length === 2) timeLabel = `${raw}00`;
    else if (raw.length === 4) timeLabel = raw;
  }
  if (!timeLabel && qcReport.report_no) {
    const match = qcReport.report_no.match(/\d{4}$/);
    if (match) timeLabel = match[0];
  }

  const slotIndex = currentEntries.findIndex((e) => e.time_label === timeLabel);
  if (slotIndex < 0) {
    return { updatedEntries: currentEntries, newEvent: null };
  }

  // Extract analytical values (only if parameter was selected/tested)
  const colorRes = qcReport.results?.find((r) => (r.parameter_code === "COLOUR_R" || r.parameter_name?.toLowerCase().includes("red")) && r.is_tested !== false);
  const colorYRes = qcReport.results?.find((r) => (r.parameter_code === "COLOUR_Y" || r.parameter_name?.toLowerCase().includes("yellow")) && r.is_tested !== false);
  const ffaRes = qcReport.results?.find((r) => (r.parameter_code === "FFA" || r.parameter_name?.toLowerCase().includes("ffa")) && r.is_tested !== false);

  const colorVal = colorRes?.value_numeric ?? null;
  const colorYVal = colorYRes?.value_numeric ?? null;
  const ffaVal = ffaRes?.value_numeric ?? null;

  const isReject = qcReport.decision?.decision === 'reject';
  const isAccept = qcReport.decision?.decision === 'accept' || qcReport.decision?.decision === 'accept_concession';

  const targetEntry = currentEntries[slotIndex];
  const updatedEntry: LogEntry = {
    ...targetEntry,
    colour_r: colorVal !== null ? colorVal : targetEntry.colour_r,
    colour_y: colorYVal !== null ? colorYVal : targetEntry.colour_y,
    ffa_pct: ffaVal !== null ? ffaVal : targetEntry.ffa_pct,
    qc_status: isReject ? 'rejected' : isAccept ? 'passed' : targetEntry.qc_status,
    qc_last_decision: qcReport.decision ? qcReport.decision.decision : targetEntry.qc_last_decision,
    qc_last_rejection_reason: isReject
      ? (qcReport.decision?.reason_label || qcReport.decision?.reason_detail || 'Off-spec laboratory parameters')
      : targetEntry.qc_last_rejection_reason,
    remarks: targetEntry.remarks 
      ? targetEntry.remarks 
      : qcReport.decision 
        ? `QC ${qcReport.decision.decision.toUpperCase()}: ${qcReport.decision.decided_by_name}`
        : targetEntry.remarks,
  };

  const updatedEntries = currentEntries.map((e, idx) => (idx === slotIndex ? updatedEntry : e));

  const newEvent: SupervisorUpdateEvent = {
    id: `evt-qc-sync-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'QC Lab',
    title: isReject
      ? `CRITICAL: QC Sample Slot ${timeLabel} Hrs REJECTED (Hold/Disposition)`
      : `QC Lab Approved Sample Slot ${timeLabel} Hrs (In-Spec)`,
    description: `Chemist ${currentUser.name} verified laboratory analysis for ${qcReport.report_no}: Lovibond Colour ${colorVal ?? '-'}R, FFA ${ffaVal ?? '-'}%. Decision: ${qcReport.decision?.decision.toUpperCase() || 'ANALYZED'}. Telemetry synchronized to Bleaching Log & Reports.`,
    severity: isReject ? 'alert' : 'success',
    author_name: currentUser.name,
    author_role: currentUser.role,
    slot_time: timeLabel,
    lot_no: qcReport.lot_no,
    requires_acknowledgment: isReject,
    acknowledged: false,
  };

  return { updatedEntries, newEvent };
}

/**
 * Creates a dedicated Retest Sample ticket following a QC Rejection.
 * Implements: QC Retest & Resampling Workflow (Stage 4 / Refined Quality SOP)
 */
export function createRetestSampleFromLogEntry(
  entry: LogEntry,
  sheet: LogSheet,
  currentUser: UserProfile,
  existingReports: SampleReport[],
  retestReason?: string
): { updatedReports: SampleReport[]; newEvent: SupervisorUpdateEvent; createdSample: SampleReport } {
  const currentYear = sheet.sheet_date ? sheet.sheet_date.split("-")[0] : "2026";
  const retestSeq = (entry.qc_retest_count || 0) + 1;

  // Find parent report if previously dispatched
  const parentReport = existingReports.find(
    r => r.time_check?.replace(":", "") === entry.time_label || r.report_no.includes(entry.time_label)
  );

  const baseReportNo = parentReport ? parentReport.report_no.replace(/-R\d+$/, "") : `SAR-${currentYear}-${entry.time_label}`;
  const reportNo = `${baseReportNo}-R${retestSeq}`;

  const baseLot = parentReport ? parentReport.lot_no.replace(/-R\d+$/, "") : `LOT-${sheet.plant_id || "REFINERY"}-${(sheet.sheet_date || "20261012").replace(/-/g, "")}-${entry.time_label}`;
  const lotNo = `${baseLot}-R${retestSeq}`;

  const sampleId = `sample-retest-${Date.now()}`;

  const defaultResults: SampleResult[] = [
    {
      id: `res-${sampleId}-ffa`,
      report_id: sampleId,
      parameter_code: "FFA",
      parameter_name: "Free Fatty Acid (% Palmitic)",
      unit: "%",
      value_numeric: null,
      in_spec: null,
      is_tested: true,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-${sampleId}-color-r`,
      report_id: sampleId,
      parameter_code: "COLOUR_R",
      parameter_name: 'Colour Lovibond Red (5¼" cell)',
      unit: "R",
      value_numeric: null,
      in_spec: null,
      is_tested: true,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-${sampleId}-color-y`,
      report_id: sampleId,
      parameter_code: "COLOUR_Y",
      parameter_name: "Colour Lovibond Yellow",
      unit: "Y",
      value_numeric: null,
      in_spec: null,
      is_tested: true,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-${sampleId}-mi`,
      report_id: sampleId,
      parameter_code: "MOISTURE",
      parameter_name: "Moisture & Impurities",
      unit: "%",
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
    {
      id: `res-${sampleId}-dobi`,
      report_id: sampleId,
      parameter_code: "DOBI",
      parameter_name: "Deterioration of Bleachability Index",
      unit: null,
      value_numeric: null,
      in_spec: null,
      is_tested: false,
      entered_by_name: null,
      entered_at: null,
    },
  ];

  const createdSample: SampleReport = {
    id: sampleId,
    report_no: reportNo,
    sample_date: sheet.sheet_date,
    time_check: `${entry.time_label.slice(0, 2)}:${entry.time_label.slice(2)}`,
    lot_no: lotNo,
    product_id: sheet.product_id,
    product_name: sheet.product_name || "RBD Palm Oil",
    feed_tank_code: sheet.feed_tank_name || "TK-101",
    discharge_tank_code: sheet.discharge_tank_name || "TK-201",
    sampling_point_name: "Deodorizer / Bleacher Outlet (SP-01)",
    submitted_by_name: currentUser.name,
    remarks: `PRIORITY RETEST (Sequence: R${retestSeq}) following rejection. Reason: ${retestReason || entry.qc_last_rejection_reason || "Off-spec parameters"}.`,
    status: 'awaiting_results',
    created_at: new Date().toISOString(),
    results: defaultResults,
    decision: null,
    is_retest: true,
    parent_report_no: parentReport?.report_no,
    retest_sequence: retestSeq,
  };

  const updatedReports = [createdSample, ...existingReports];

  const newEvent: SupervisorUpdateEvent = {
    id: `evt-retest-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'Bleaching Log',
    title: `RETEST DISPATCHED: Slot ${entry.time_label} Hrs (Sequence: R${retestSeq})`,
    description: `Operator ${currentUser.name} dispatched retest sample ${reportNo} to QC Lab for chemical re-analysis following previous batch rejection (${entry.qc_last_rejection_reason || 'Off-spec parameters'}).`,
    severity: 'warning',
    author_name: currentUser.name,
    author_role: currentUser.role,
    shift: entry.shift,
    slot_time: entry.time_label,
    lot_no: lotNo,
    requires_acknowledgment: true,
    acknowledged: false,
  };

  return { updatedReports, newEvent, createdSample };
}

export interface PipelineProgressMetrics {
  totalSlots: number;
  savedSlotsCount: number;
  qcTotalSamples: number;
  qcDecidedSamples: number;
  qcPendingSamples: number;
  reportsReadyCount: number;
  supervisorSigned: boolean;
  completionRatePercent: number;
}

export function calculatePipelineMetrics(sheet: LogSheet, qcReports: SampleReport[]): PipelineProgressMetrics {
  const totalSlots = 24;
  const savedSlotsCount = sheet.entries.filter((e) => e.is_saved).length;
  const qcTotalSamples = qcReports.length;
  const qcDecidedSamples = qcReports.filter((r) => r.status === 'decided' || r.decision !== null).length;
  const qcPendingSamples = qcReports.filter((r) => r.status === 'awaiting_results' || !r.decision).length;
  const reportsReadyCount = sheet.entries.filter((e) => e.is_saved && (e.colour_r !== null || e.ffa_pct !== null)).length;
  const supervisorSigned = sheet.status === 'Approved';

  // Overall pipeline completion metric
  const weightSaved = (savedSlotsCount / totalSlots) * 35; // 35%
  const weightQc = (qcDecidedSamples / Math.max(1, savedSlotsCount || 1)) * 35; // 35%
  const weightReports = (savedSlotsCount > 0 ? 15 : 0); // 15%
  const weightSign = supervisorSigned ? 15 : (sheet.status === 'Submitted' ? 8 : 0); // 15%

  const completionRatePercent = Math.min(100, Math.round(weightSaved + weightQc + weightReports + weightSign));

  return {
    totalSlots,
    savedSlotsCount,
    qcTotalSamples,
    qcDecidedSamples,
    qcPendingSamples,
    reportsReadyCount,
    supervisorSigned,
    completionRatePercent,
  };
}

/**
 * Option 3: Smart Hybrid Shift Duty Technician Resolution
 * Resolves duty technician dynamically from active logging or manual roster overrides,
 * preventing hardcoded placeholder names and accurately showing pending check-in states.
 */
export interface ShiftDutyTechnicianInfo {
  shift: 1 | 2 | 3;
  name: string | null;
  id: string | null;
  source: 'auto' | 'manual' | 'pending';
  displayText: string;
  badgeLabel: string;
  isPending: boolean;
  loggedSlotsCount: number;
}

export function getShiftDutyTechnician(
  sheet: LogSheet | undefined | null,
  shiftNum: 1 | 2 | 3
): ShiftDutyTechnicianInfo {
  if (!sheet) {
    return {
      shift: shiftNum,
      name: null,
      id: null,
      source: 'pending',
      displayText: 'Awaiting Check-in',
      badgeLabel: 'Pending Check-in',
      isPending: true,
      loggedSlotsCount: 0,
    };
  }

  const entries = sheet.entries || [];
  const shiftEntries = entries.filter((e) => e.shift === shiftNum && e.is_saved);
  const loggedSlotsCount = shiftEntries.length;

  const isManual = Boolean(
    shiftNum === 1 ? sheet.tech_s1_manual : shiftNum === 2 ? sheet.tech_s2_manual : sheet.tech_s3_manual
  );
  const sheetTechName = (
    shiftNum === 1 ? sheet.tech_s1_name : shiftNum === 2 ? sheet.tech_s2_name : sheet.tech_s3_name
  )?.trim() || null;
  const sheetTechId = (
    shiftNum === 1 ? sheet.tech_s1 : shiftNum === 2 ? sheet.tech_s2 : sheet.tech_s3
  )?.trim() || null;

  // 1. Explicit manual roster assignment takes priority ONLY if flagged manual
  if (isManual && sheetTechName) {
    return {
      shift: shiftNum,
      name: sheetTechName,
      id: sheetTechId,
      source: 'manual',
      displayText: sheetTechName,
      badgeLabel: 'Assigned Roster',
      isPending: false,
      loggedSlotsCount,
    };
  }

  // 2. Auto-detection from saved slots in this shift
  const entriesWithTechnician = shiftEntries.filter((e) => e.entered_by_name && e.entered_by_name.trim().length > 0);
  if (entriesWithTechnician.length > 0) {
    const latestSaved = entriesWithTechnician[entriesWithTechnician.length - 1];
    const detectedName = latestSaved.entered_by_name!.trim();
    const detectedId = latestSaved.entered_by || null;
    return {
      shift: shiftNum,
      name: detectedName,
      id: detectedId,
      source: 'auto',
      displayText: detectedName,
      badgeLabel: 'Auto-Detected',
      isPending: false,
      loggedSlotsCount,
    };
  }

  // 3. Untouched / awaiting check-in shift (when in auto mode and no entries saved yet)
  return {
    shift: shiftNum,
    name: null,
    id: null,
    source: 'pending',
    displayText: 'Awaiting Check-in',
    badgeLabel: 'Pending Check-in',
    isPending: true,
    loggedSlotsCount: 0,
  };
}

