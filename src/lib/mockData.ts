import { Plant, Product, Tank, UserProfile, LogSheet, SupervisorUpdateEvent } from "@/types";
import { generateInitialEntries, validateReadingSpecs } from "./utils";

export const MOCK_USERS: UserProfile[] = [
  { 
    id: 'usr-1', 
    name: 'Ahmad Razif', 
    role: 'technician', 
    email: 'ahmad.razif@lamsoon.com.my',
    department: 'Refinery Operations',
    shift: 1, 
    active: true,
    phone: '+60 12-384 9102',
    password: 'password123',
    last_login: '2026-10-01 07:55 AM'
  },
  { 
    id: 'usr-2', 
    name: 'Mohd Danial', 
    role: 'technician', 
    email: 'mohd.danial@lamsoon.com.my',
    department: 'Refinery Operations',
    shift: 2, 
    active: true,
    phone: '+60 17-621 4489',
    password: 'password123',
    last_login: '2026-09-30 15:45 PM'
  },
  { 
    id: 'usr-3', 
    name: 'K. Subramaniam', 
    role: 'technician', 
    email: 'subramaniam.k@lamsoon.com.my',
    department: 'Refinery Operations',
    shift: 3, 
    active: true,
    phone: '+60 19-402 1198',
    password: 'password123',
    last_login: '2026-09-30 23:50 PM'
  },
  { 
    id: 'usr-4', 
    name: 'Ir. Roslan Zakaria', 
    role: 'supervisor', 
    email: 'roslan.zakaria@lamsoon.com.my',
    department: 'Operations Supervision',
    shift: 'ALL', 
    active: true,
    phone: '+60 13-902 3311',
    password: 'password123',
    last_login: '2026-10-01 08:15 AM'
  },
  { 
    id: 'usr-5', 
    name: 'Puan Siti Farah', 
    role: 'manager_qa', 
    email: 'siti.farah@lamsoon.com.my',
    department: 'Quality Assurance',
    shift: 'ALL', 
    active: true,
    phone: '+60 11-2309 8812',
    password: 'password123',
    last_login: '2026-10-01 09:00 AM'
  },
  { 
    id: 'usr-6', 
    name: 'Ammar Wafiy', 
    role: 'chemist', 
    email: 'ammar.wafiy@lamsoon.com.my',
    department: 'QC Laboratory',
    shift: 'ALL', 
    active: true,
    phone: '+60 14-883 2019',
    password: 'password123',
    last_login: '2026-10-01 08:30 AM'
  },
  { 
    id: 'usr-7', 
    name: 'Haris Iskandar (Admin)', 
    role: 'admin', 
    email: 'admin@lamsoon.com.my',
    department: 'Plant Management & IT',
    shift: 'ALL', 
    active: true,
    phone: '+60 12-998 0011',
    password: 'password123',
    last_login: '2026-10-01 07:30 AM'
  },
];

export const INITIAL_SUPERVISOR_EVENTS: SupervisorUpdateEvent[] = [
  {
    id: 'evt-01',
    timestamp: '2026-10-01T12:05:00+08:00',
    source: 'Bleaching Log',
    title: 'Slot 1200 Hrs Successfully Saved',
    description: 'Ahmad Razif recorded operational parameters for Slot 1200 (Flow 45.5 MT/HR, Vac 642 mmHg, HE Temp 106.0°C).',
    severity: 'success',
    author_name: 'Ahmad Razif',
    author_role: 'technician',
    shift: 1,
    slot_time: '1200',
    requires_acknowledgment: false,
    acknowledged: true,
  },
  {
    id: 'evt-02',
    timestamp: '2026-10-01T11:12:00+08:00',
    source: 'Bleaching Log',
    title: 'ALERT: Vacuum Below 600 mmHg Threshold',
    description: 'Slot 1100 Hrs recorded Vacuum at 585.0 mmHg (Minimum required: 600.0 mmHg). Note: Vacuum dropped momentarily during filter switch.',
    severity: 'alert',
    author_name: 'Ahmad Razif',
    author_role: 'technician',
    shift: 1,
    slot_time: '1100',
    requires_acknowledgment: true,
    acknowledged: false,
  },
  {
    id: 'evt-03',
    timestamp: '2026-10-01T10:45:00+08:00',
    source: 'QC Lab',
    title: 'Lab Test Report Released (SAR-2026-000045)',
    description: 'Ammar Wafiy approved sample Lot No LOT-202609-045 (RBD Palm Oil). Results: FFA 0.043%, Moisture 0.02%, In-Spec APPROVED.',
    severity: 'success',
    author_name: 'Ammar Wafiy',
    author_role: 'chemist',
    lot_no: 'LOT-202609-045',
    requires_acknowledgment: false,
    acknowledged: true,
  },
  {
    id: 'evt-04',
    timestamp: '2026-10-01T10:08:00+08:00',
    source: 'Bleaching Log',
    title: 'WARNING: HE Temp Exceeded Limit (116.5 °C)',
    description: 'Slot 1000 Hrs recorded HE Temp at 116.5°C (Target limit: 70.0 - 115.0°C). Note: Steam valve adjusted due to high temp.',
    severity: 'warning',
    author_name: 'Ahmad Razif',
    author_role: 'technician',
    shift: 1,
    slot_time: '1000',
    requires_acknowledgment: true,
    acknowledged: true,
    acknowledged_by: 'Ir. Roslan Zakaria',
    acknowledged_at: '2026-10-01T10:20:00+08:00',
  },
  {
    id: 'evt-05',
    timestamp: '2026-10-01T08:30:00+08:00',
    source: 'Operating Parameters',
    title: 'Plant Operating Parameters Configured',
    description: 'Ir. Roslan Zakaria verified Citric Acid dosage (12.5 Mm / 0.06%) and Taiko Earth 1.25 setting (9,180 Kgs/Day).',
    severity: 'info',
    author_name: 'Ir. Roslan Zakaria',
    author_role: 'supervisor',
    shift: 1,
    requires_acknowledgment: false,
    acknowledged: true,
  },
  {
    id: 'evt-06',
    timestamp: '2026-10-01T08:00:00+08:00',
    source: 'System',
    title: 'Shift 1 Commenced (0800 - 1500 Hrs)',
    description: 'Bleaching Process Log Sheet RF-FR-003 Rev 03 opened for Line 1 by Ahmad Razif.',
    severity: 'info',
    author_name: 'Plant System',
    author_role: 'admin',
    shift: 1,
    requires_acknowledgment: false,
    acknowledged: true,
  }
];

export const MOCK_PLANTS: Plant[] = [
  { id: 'plt-1', name: 'Refinery Plant 1 (Auto Bleaching Line 1)' },
  { id: 'plt-2', name: 'Refinery Plant 2 (Auto Bleaching Line 2)' },
  { id: 'plt-3', name: 'Fractionation Line A' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'prd-1', name: 'RBD Palm Oil (Refined, Bleached & Deodorized)' },
  { id: 'prd-2', name: 'Bleached Palm Oil (BPO Feedstock)' },
  { id: 'prd-3', name: 'Refined Bleached Palm Olein (RBPO)' },
  { id: 'prd-4', name: 'Refined Bleached Palm Stearin (RBPS)' },
];

export const MOCK_TANKS: Tank[] = [
  { id: 'tnk-f1', name: 'Feed Tank TK-101 (Crude Feed)', kind: 'feed' },
  { id: 'tnk-f2', name: 'Feed Tank TK-102 (Crude Feed)', kind: 'feed' },
  { id: 'tnk-f3', name: 'Feed Tank TK-103 (Intermediate Feed)', kind: 'feed' },
  { id: 'tnk-d1', name: 'Discharge Tank TK-201 (Bleached Oil)', kind: 'discharge' },
  { id: 'tnk-d2', name: 'Discharge Tank TK-202 (Bleached Oil)', kind: 'discharge' },
  { id: 'tnk-d3', name: 'Discharge Tank TK-203 (Bleached Oil)', kind: 'discharge' },
];

// Helper to construct sample sheet
export function createMockSheet(): LogSheet {
  const sheetDate = new Date().toISOString().split('T')[0];
  const entries = generateInitialEntries('sheet-live-01', sheetDate);

  // Fill in some realistic entries for Shift 1 (slots 0 to 4)
  const sampleData = [
    { flow: 45.5, acid: true, temp: 104.2, earth: true, level: 'H' as const, vac: 645, filter: 'N60-1' as const, ffa: 0.045, cr: 2.1, cy: 18.0, rem: 'Normal startup operation' },
    { flow: 46.0, acid: true, temp: 105.0, earth: true, level: 'H' as const, vac: 640, filter: 'N60-1' as const, ffa: 0.043, cr: 2.0, cy: 17.5, rem: '' },
    { flow: 46.2, acid: true, temp: 116.5, earth: true, level: 'H' as const, vac: 635, filter: 'N60-1' as const, ffa: 0.048, cr: 2.3, cy: 19.0, rem: 'Steam valve adjusted due to high temp' }, // Out of spec temp
    { flow: 45.8, acid: true, temp: 108.2, earth: true, level: 'H' as const, vac: 585, filter: 'N60-2' as const, ffa: 0.046, cr: 2.2, cy: 18.5, rem: 'Vacuum dropped momentarily during filter switch' }, // Out of spec vac
    { flow: 45.5, acid: true, temp: 106.0, earth: true, level: 'H' as const, vac: 642, filter: 'N60-2' as const, ffa: 0.044, cr: 2.1, cy: 18.0, rem: '' },
  ];

  sampleData.forEach((d, idx) => {
    const entry = entries[idx];
    entry.flowrate_set = d.flow;
    entry.acid_dosage_ok = d.acid;
    entry.he_temp_c = d.temp;
    entry.earth_dosage_ok = d.earth;
    entry.bleacher_level = d.level;
    entry.vacuum_mmhg = d.vac;
    entry.niagara_filter = d.filter;
    entry.ffa_pct = d.ffa;
    entry.colour_r = d.cr;
    entry.colour_y = d.cy;
    entry.remarks = d.rem;
    entry.entered_by = 'usr-1';
    entry.entered_by_name = 'Ahmad Razif';
    entry.entered_at = new Date(Date.now() - (5 - idx) * 3600000).toISOString();
    entry.is_saved = true;
    entry.out_of_spec = validateReadingSpecs(entry);
  });

  return {
    id: 'sheet-live-01',
    form_no: 'RF-FR-003',
    form_rev: '03',
    sheet_date: sheetDate,
    plant_id: 'plt-1',
    plant_name: 'Refinery Plant 1 (Auto Bleaching Line 1)',
    product_id: 'prd-1',
    product_name: 'RBD Palm Oil (Refined, Bleached & Deodorized)',
    feed_tank_id: 'tnk-f1',
    feed_tank_name: 'Feed Tank TK-101 (Crude Feed)',
    discharge_tank_id: 'tnk-d1',
    discharge_tank_name: 'Discharge Tank TK-201 (Bleached Oil)',
    tech_s1: 'usr-1',
    tech_s1_name: 'Ahmad Razif',
    tech_s2: 'usr-2',
    tech_s2_name: 'Mohd Danial',
    tech_s3: 'usr-3',
    tech_s3_name: 'K. Subramaniam',
    
    // Parameters
    input_mt_hr: 45.0,
    input_mt_day: 1080.0,
    acid_type: 'Phosphoric Acid',
    acid_mm: 12.5,
    acid_cm_hr: 24.0,
    acid_pct: 0.06,
    earth_type: 'Taiko Classic Bleaching Earth',
    earth_setting: 1.25,
    earth_min_pct: 0.85,
    earth_kgs_day: 9180.0,
    aid1_type: 'Celite 545',
    aid1_qty: 25.0,
    aid2_type: 'Hyflo Super-Cel',
    aid2_qty: 15.0,

    status: 'InProgress',
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,

    entries,
    created_at: new Date(Date.now() - 20000000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}
