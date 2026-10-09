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
  const reportNo = `SAR-2026-${entry.time_label}`;
  const lotNo = `LOT-${(sheet.plant_name || sheet.plant_id || "REF1").toUpperCase().replace(/\s+/g, '')}-${entry.time_label}`;

  // Find if a report for this slot already exists
  const existingIndex = existingReports.findIndex(
    (r) => r.report_no === reportNo || r.time_check === formattedTimeCheck
  );

  let targetSample: SampleReport;

  if (existingIndex >= 0) {
    // Update existing report with fresh process telemetry references
    const existing = existingReports[existingIndex];
    targetSample = {
      ...existing,
      product_name: sheet.product_name || existing.product_name || "RBD Palm Oil",
      feed_tank_code: sheet.feed_tank_name || existing.feed_tank_code || "TK-101",
      discharge_tank_code: sheet.discharge_tank_name || existing.discharge_tank_code || "TK-201",
      remarks: `Synchronized from Bleaching Log Slot ${entry.time_label} Hrs (Flow: ${entry.flowrate_set ?? '-'} MT/HR, Vac: ${entry.vacuum_mmhg ?? '-'} mmHg, Temp: ${entry.he_temp_c ?? '-'}°C)`,
    };
  } else {
    // Generate new QC sample record
    targetSample = {
      id: `sample-sync-${sheet.id}-${entry.time_label}`,
      report_no: reportNo,
      sample_date: sheet.sheet_date || new Date().toISOString().split('T')[0],
      time_check: formattedTimeCheck,
      lot_no: lotNo,
      product_id: sheet.product_id,
      product_name: sheet.product_name || "RBD Palm Oil",
      feed_tank_code: sheet.feed_tank_name || "TK-101",
      discharge_tank_code: sheet.discharge_tank_name || "TK-201",
      sampling_point_name: "Deodorizer / Bleacher Outlet (SP-01)",
      submitted_by_name: currentUser.name,
      remarks: `Auto-generated sample from Bleaching Log Slot ${entry.time_label} Hrs (Operator: ${currentUser.name})`,
      status: 'awaiting_results',
      created_at: new Date().toISOString(),
      results: [
        {
          id: `res-color-${entry.time_label}`,
          report_id: `sample-sync-${sheet.id}-${entry.time_label}`,
          parameter_code: "COLOUR_R",
          parameter_name: "Lovibond Colour (Red)",
          unit: "R",
          value_numeric: entry.colour_r ?? null,
          in_spec: typeof entry.colour_r === 'number' ? entry.colour_r <= 2.5 : null,
          entered_by_name: null,
          entered_at: null,
        },
        {
          id: `res-ffa-${entry.time_label}`,
          report_id: `sample-sync-${sheet.id}-${entry.time_label}`,
          parameter_code: "FFA",
          parameter_name: "Free Fatty Acids (% FFA)",
          unit: "%",
          value_numeric: entry.ffa_pct ?? null,
          in_spec: typeof entry.ffa_pct === 'number' ? entry.ffa_pct <= 0.05 : null,
          entered_by_name: null,
          entered_at: null,
        },
        {
          id: `res-mi-${entry.time_label}`,
          report_id: `sample-sync-${sheet.id}-${entry.time_label}`,
          parameter_code: "H2O",
          parameter_name: "Moisture & Impurities (M&I)",
          unit: "%",
          value_numeric: null,
          in_spec: null,
          entered_by_name: null,
          entered_at: null,
        },
        {
          id: `res-dobi-${entry.time_label}`,
          report_id: `sample-sync-${sheet.id}-${entry.time_label}`,
          parameter_code: "DOBI",
          parameter_name: "Bleachability Index (DOBI)",
          unit: "",
          value_numeric: null,
          in_spec: null,
          entered_by_name: null,
          entered_at: null,
        },
      ],
      decision: null,
    };
  }

  const updatedReports = existingIndex >= 0
    ? existingReports.map((r, i) => (i === existingIndex ? targetSample : r))
    : [targetSample, ...existingReports];

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

  // Extract analytical values
  const colorRes = qcReport.results?.find((r) => r.parameter_code === "COLOUR_R" || r.parameter_name?.toLowerCase().includes("red"));
  const ffaRes = qcReport.results?.find((r) => r.parameter_code === "FFA" || r.parameter_name?.toLowerCase().includes("ffa"));

  const colorVal = colorRes?.value_numeric ?? null;
  const ffaVal = ffaRes?.value_numeric ?? null;

  const targetEntry = currentEntries[slotIndex];
  const updatedEntry: LogEntry = {
    ...targetEntry,
    colour_r: colorVal !== null ? colorVal : targetEntry.colour_r,
    ffa_pct: ffaVal !== null ? ffaVal : targetEntry.ffa_pct,
    remarks: targetEntry.remarks 
      ? targetEntry.remarks 
      : qcReport.decision 
        ? `QC ${qcReport.decision.decision.toUpperCase()}: ${qcReport.decision.decided_by_name}`
        : targetEntry.remarks,
  };

  const updatedEntries = currentEntries.map((e, idx) => (idx === slotIndex ? updatedEntry : e));

  const isReject = qcReport.decision?.decision === 'reject';
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

