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
    id: 'evt-init',
    timestamp: new Date().toISOString(),
    source: 'System',
    title: 'Plant Process Logging System Online',
    description: 'Bleaching Process Log RF-FR-003 initialized for real-time live production recording.',
    severity: 'info',
    author_name: 'Plant System',
    author_role: 'admin',
    shift: 1,
    requires_acknowledgment: false,
    acknowledged: true,
  }
];

export const DEFAULT_PRODUCT_SPECS = [
  {
    id: 'spec-prd-1',
    productId: 'prd-1',
    productName: 'RBD Palm Oil (Refined, Bleached & Deodorized)',
    ffaMax: 0.05,
    colourRedMax: 2.5,
    colourYellowMax: 25.0,
    moistureMax: 0.05,
    peroxideMax: 1.0,
    dobiMin: 2.8,
    standardReference: 'PORAM / MS 814:2018',
  },
  {
    id: 'spec-prd-2',
    productId: 'prd-2',
    productName: 'Bleached Palm Oil (BPO Feedstock)',
    ffaMax: 0.10,
    colourRedMax: 3.0,
    colourYellowMax: 30.0,
    moistureMax: 0.10,
    peroxideMax: 2.0,
    dobiMin: 2.5,
    standardReference: 'Internal Refinery Standard RS-BPO-01',
  },
  {
    id: 'spec-prd-3',
    productId: 'prd-3',
    productName: 'Refined Bleached Palm Olein (RBPO)',
    ffaMax: 0.05,
    colourRedMax: 2.5,
    colourYellowMax: 25.0,
    moistureMax: 0.05,
    peroxideMax: 1.0,
    dobiMin: 2.8,
    standardReference: 'PORAM Edible Grade',
  },
  {
    id: 'spec-prd-4',
    productId: 'prd-4',
    productName: 'Refined Bleached Palm Stearin (RBPS)',
    ffaMax: 0.15,
    colourRedMax: 3.5,
    colourYellowMax: 35.0,
    moistureMax: 0.15,
    peroxideMax: 2.0,
    dobiMin: 2.2,
    standardReference: 'PORAM Industrial Grade',
  },
];

export const DEFAULT_REJECTION_REASONS = [
  {
    id: 'QC-REAS-01',
    code: 'FFA_EXCEED',
    label: 'Free Fatty Acid (FFA) Exceeds Max Limit',
    category: 'Quality' as const,
    severity: 'Critical' as const,
    defaultDisposition: 'rework' as const,
    correctiveAction: 'Increase degumming acid dosage and bleacher vacuum dwell time',
  },
  {
    id: 'QC-REAS-02',
    code: 'COLOUR_RED_HIGH',
    label: 'Lovibond Colour Red Exceeds Specification',
    category: 'Quality' as const,
    severity: 'Major' as const,
    defaultDisposition: 'rework' as const,
    correctiveAction: 'Increase bleaching earth ratio to minimum 1.25% and verify contact temperature',
  },
  {
    id: 'QC-REAS-03',
    code: 'MOISTURE_EXCEED',
    label: 'Moisture & Volatile Impurities > 0.05%',
    category: 'Physical' as const,
    severity: 'Major' as const,
    defaultDisposition: 'reprocess' as const,
    correctiveAction: 'Inspect bleacher vacuum seal integrity and steam condensate drain line',
  },
  {
    id: 'QC-REAS-04',
    code: 'PEROXIDE_HIGH',
    label: 'Peroxide Value (PV) Exceeds Threshold',
    category: 'Quality' as const,
    severity: 'Critical' as const,
    defaultDisposition: 'hold' as const,
    correctiveAction: 'Verify crude oil incoming feed oxidation and nitrogen blanketing system',
  },
  {
    id: 'QC-REAS-05',
    code: 'DOBI_LOW',
    label: 'Low DOBI Bleachability Index (< 2.5)',
    category: 'Process' as const,
    severity: 'Minor' as const,
    defaultDisposition: 'downgrade' as const,
    correctiveAction: 'Segregate batch feed and blend with high-grade CPO feedstock',
  },
  {
    id: 'QC-REAS-06',
    code: 'BLEACHING_EARTH_ODOR',
    label: 'Suspended Bleaching Earth / Filter Bleed',
    category: 'Physical' as const,
    severity: 'Critical' as const,
    defaultDisposition: 'rework' as const,
    correctiveAction: 'Immediately switch and inspect Niagara leaf filter cloths for punctures',
  },
  {
    id: 'QC-REAS-07',
    code: 'CROSS_CONTAMINATION',
    label: 'Tank / Header Cross-Contamination',
    category: 'Contamination' as const,
    severity: 'Critical' as const,
    defaultDisposition: 'scrap' as const,
    correctiveAction: 'Flush transfer headers and lock discharge manifold valves',
  },
  {
    id: 'QC-REAS-08',
    code: 'TURBIDITY_HAZE',
    label: 'Turbidity & Particulate Haze Detected',
    category: 'Physical' as const,
    severity: 'Major' as const,
    defaultDisposition: 'rework' as const,
    correctiveAction: 'Inspect polishing filter cartridge bags and replace element',
  },
];

export const MOCK_PLANTS: Plant[] = [
  { id: 'plt-1', name: 'Refinery Plant 1 (Auto Bleaching Line 1)' },
  { id: 'plt-2', name: 'Refinery Plant 2 (Auto Bleaching Line 2)' },
  { id: 'plt-3', name: 'Fractionation Line A' },
];

export const INITIAL_PRODUCT_NAMES = [
  "CHOCOHI 357A NPHO",
  "CHOCOHI 369A",
  "DAISY SOFT PM180602 I2",
  "DF 20",
  "FARM COW R2",
  "G9",
  "HPO 58",
  "HPKO",
  "HPS 52",
  "HPS 58",
  "HYFAT L1",
  "HYFAT K1 (P)",
  "HYFAT K1 (B)",
  "PMF",
  "PR PMF",
  "IEPMF",
  "R. IEPMF",
  "PR IEPMF",
  "KRIMWELL IER",
  "NATUREL WOS",
  "NATUREL LITE",
  "NATUREL OLIVE",
  "PASTRIFET SK",
  "PL 56",
  "PL60",
  "PL65 MATSUYAMA",
  "PL65 WAYIDEAL",
  "PR PL65",
  "NBD PL65",
  "PALM FAT BLEND",
  "RPMO",
  "PR PMO",
  "RSTN",
  "RSTN (S)",
  "RSTN (H)",
  "PR STN",
  "PR STN (S)",
  "PR STN (H)",
  "RPKO",
  "RPKL",
  "SHORTENING",
  "SRIV60 (FMF SNAX)",
  "SPLASH OIL",
  "FLUSH OIL",
  "PFAD",
];

export const MOCK_PRODUCTS: Product[] = INITIAL_PRODUCT_NAMES.map((name, idx) => ({
  id: `prd-${idx + 1}`,
  name,
}));

export const MOCK_TANKS: Tank[] = [
  { id: 'tnk-f1', name: 'Feed Tank TK-101 (Crude Feed)', kind: 'feed' },
  { id: 'tnk-f2', name: 'Feed Tank TK-102 (Crude Feed)', kind: 'feed' },
  { id: 'tnk-f3', name: 'Feed Tank TK-103 (Intermediate Feed)', kind: 'feed' },
  { id: 'tnk-d1', name: 'Discharge Tank TK-201 (Bleached Oil)', kind: 'discharge' },
  { id: 'tnk-d2', name: 'Discharge Tank TK-202 (Bleached Oil)', kind: 'discharge' },
  { id: 'tnk-d3', name: 'Discharge Tank TK-203 (Bleached Oil)', kind: 'discharge' },
];

// Helper to construct clean live sheet with zero dummy entries
export function createCleanSheet(): LogSheet {
  const sheetDate = new Date().toISOString().split('T')[0];
  const entries = generateInitialEntries('sheet-live-01', sheetDate);

  return {
    id: 'sheet-live-01',
    form_no: 'RF-FR-003',
    form_rev: '03',
    sheet_date: sheetDate,
    plant_id: 'plt-1',
    plant_name: 'Refinery Plant 1 (Auto Bleaching Line 1)',
    product_id: 'prd-1',
    product_name: 'CHOCOHI 357A NPHO',
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
    
    // Clean initial parameters (ready for operator input)
    input_mt_hr: null,
    input_mt_day: null,
    acid_type: 'Phosphoric Acid',
    acid_mm: null,
    acid_cm_hr: null,
    acid_pct: null,
    earth_type: 'Taiko Classic Bleaching Earth',
    earth_setting: null,
    earth_min_pct: null,
    earth_kgs_day: null,
    aid1_type: 'Celite 545',
    aid1_qty: null,
    aid2_type: 'Hyflo Super-Cel',
    aid2_qty: null,

    status: 'InProgress',
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,

    entries,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Backward-compatibility alias
export const createMockSheet = createCleanSheet;

