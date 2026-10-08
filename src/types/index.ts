// Domain Models & Types for Digital Bleaching Process Log (RF-FR-003, Rev 03)

export type UserRole = 'technician' | 'supervisor' | 'manager_qa' | 'admin' | 'chemist';
export type DashboardTab = 'bleaching' | 'qc' | 'reports' | 'supervisor' | 'users';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  shift?: 1 | 2 | 3 | 'ALL';
  active: boolean;
  phone?: string;
  password?: string;
  last_login?: string;
}

export interface SupervisorUpdateEvent {
  id: string;
  timestamp: string;
  source: 'Bleaching Log' | 'QC Lab' | 'Operating Parameters' | 'Supervisor Monitoring' | 'System';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
  author_name: string;
  author_role: UserRole;
  shift?: 1 | 2 | 3;
  slot_time?: string;
  lot_no?: string;
  requires_acknowledgment?: boolean;
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface Plant {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  code?: string;
  category?: string;
  sort_order?: number;
  active?: boolean;
}

export interface Tank {
  id: string;
  name: string;
  kind: 'feed' | 'discharge' | 'both';
  code?: string;
  active?: boolean;
}

export type SheetStatus = 'Draft' | 'InProgress' | 'Submitted' | 'Returned' | 'Approved';

export interface ParameterBlock {
  // Input Flowrate
  input_mt_hr: number | null;
  input_mt_day: number | null;
  
  // Citric / Phosphoric Acid
  acid_type: 'Citric Acid' | 'Phosphoric Acid' | string;
  acid_mm: number | null;
  acid_cm_hr: number | null;
  acid_pct: number | null;

  // Bleaching Earth
  earth_type: string;
  earth_setting: number | null;
  earth_min_pct: number | null;
  earth_kgs_day: number | null;

  // Filter Aids
  aid1_type: string;
  aid1_qty: number | null;
  aid2_type: string;
  aid2_qty: number | null;
}

export interface OutOfSpecFlag {
  field: 'he_temp_c' | 'vacuum_mmhg' | string;
  value: number | string | null;
  rule: string;
  message: string;
}

export interface LogEntry {
  id: string;
  sheet_id: string;
  slot_index: number; // 0 to 23
  time_label: string; // "0800", "0900", ..., "2400", "0100", ..., "0700"
  shift: 1 | 2 | 3;
  actual_timestamp: string; // ISO String calculated via sheet_date + 08:00 + slot_index * 1 hour

  flowrate_set: number | null;
  acid_dosage_ok: boolean;
  he_temp_c: number | null; // Spec: 70.0 - 115.0 °C
  earth_dosage_ok: boolean;
  bleacher_level: 'L' | 'H' | null;
  vacuum_mmhg: number | null; // Spec: >= 600.0 mmHg
  niagara_filter: 'N60-1' | 'N60-2' | 'N60-3' | 'N60-4' | null;
  filter_change_time: string | null; // HH:mm
  ffa_pct: number | null;
  colour_r: number | null;
  colour_y: number | null;
  remarks: string;

  out_of_spec: OutOfSpecFlag[];
  entered_by: string | null;
  entered_by_name?: string;
  entered_at: string | null;
  is_saved: boolean;
  is_overdue?: boolean;
}

export interface LogSheet extends ParameterBlock {
  id: string;
  form_no: string; // Fixed: "RF-FR-003"
  form_rev: string; // Fixed: "03"
  sheet_date: string; // YYYY-MM-DD
  plant_id: string;
  plant_name?: string;
  product_id: string;
  product_name?: string;
  feed_tank_id: string;
  feed_tank_name?: string;
  discharge_tank_id: string;
  discharge_tank_name?: string;

  // Technicians by shift
  tech_s1: string | null; // 1st Shift: 0800 - 1500
  tech_s1_name?: string;
  tech_s2: string | null; // 2nd Shift: 1600 - 2300
  tech_s2_name?: string;
  tech_s3: string | null; // 3rd Shift: 2400 - 0700
  tech_s3_name?: string;

  status: SheetStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_by_name?: string;
  reviewed_at: string | null;
  review_note: string | null;

  entries: LogEntry[];
  created_at: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  user_id: string;
  user_name: string;
  changed_at: string;
}

// ==============================================================================
// QC LAB & SAMPLE ANALYSIS REPORT (FORM RF-FR-001) TYPES
// ==============================================================================

export type QCDecisionType = 'accept' | 'accept_concession' | 'reject';
export type Disposition = 'rework' | 'reprocess' | 'downgrade' | 'hold' | 'scrap';
export type ReportStatus = 'draft' | 'awaiting_results' | 'results_entered' | 'decided' | 'voided';

export interface SampleResult {
  id: string;
  report_id: string;
  parameter_code: string;
  parameter_name: string;
  unit: string | null;
  value_numeric: number | null;
  in_spec: boolean | null;
  entered_by_name?: string | null;
  entered_at?: string | null;
}

export interface QCDecision {
  id: string;
  report_id: string;
  decision: QCDecisionType;
  reason_id?: string | null;
  reason_label?: string | null;
  reason_detail?: string | null;
  failed_parameters?: string[];
  disposition?: Disposition | null;
  decided_by_name: string;
  decided_at: string;
}

export interface SampleReport {
  id: string;
  report_no: string; // SAR-2026-XXXXXX
  sample_date: string;
  time_check: string;
  lot_no: string;
  product_id?: string | null;
  product_name?: string;
  feed_tank_code?: string;
  discharge_tank_code?: string;
  sampling_point_name?: string;
  submitted_by_name: string;
  remarks?: string | null;
  status: ReportStatus;
  created_at: string;
  results: SampleResult[];
  decision?: QCDecision | null;
}

