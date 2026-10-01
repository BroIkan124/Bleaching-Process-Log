-- ==============================================================================
-- NISSHIN PROCESS MANAGEMENT SYSTEM - REFINERY BLEACHING LOG (RF-FR-003)
-- InsForge / PostgreSQL Database Schema
-- ==============================================================================

-- 1. Users / Personnel Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('technician', 'supervisor', 'manager_qa', 'admin', 'chemist')),
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  shift TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Master Log Sheets (Form RF-FR-003 Rev 03)
CREATE TABLE IF NOT EXISTS log_sheets (
  id TEXT PRIMARY KEY,
  form_no TEXT NOT NULL DEFAULT 'RF-FR-003',
  form_rev TEXT NOT NULL DEFAULT '03',
  sheet_date DATE NOT NULL,
  plant_id TEXT NOT NULL,
  plant_name TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  feed_tank_id TEXT,
  discharge_tank_id TEXT,
  
  -- Operating Parameters
  input_mt_hr NUMERIC(6,2),
  input_mt_day NUMERIC(8,2),
  acid_type TEXT,
  acid_mm NUMERIC(5,2),
  acid_cm_hr NUMERIC(5,2),
  acid_pct NUMERIC(5,4),
  earth_type TEXT,
  earth_setting NUMERIC(5,2),
  earth_min_pct NUMERIC(5,4),
  earth_kgs_day NUMERIC(8,2),
  aid1_type TEXT,
  aid1_qty NUMERIC(6,2),
  aid2_type TEXT,
  aid2_qty NUMERIC(6,2),
  
  -- Assigned Technicians by shift
  tech_s1 TEXT,
  tech_s1_name TEXT,
  tech_s2 TEXT,
  tech_s2_name TEXT,
  tech_s3 TEXT,
  tech_s3_name TEXT,
  
  -- Lifecycle Status
  status TEXT NOT NULL CHECK (status IN ('Draft', 'InProgress', 'Submitted', 'Returned', 'Approved')) DEFAULT 'Draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Hourly Process Log Entries (24 slots per day)
CREATE TABLE IF NOT EXISTS hourly_entries (
  id TEXT PRIMARY KEY,
  sheet_id TEXT NOT NULL REFERENCES log_sheets(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 0 AND 23),
  time_label TEXT NOT NULL,
  shift INT NOT NULL CHECK (shift IN (1, 2, 3)),
  actual_timestamp TIMESTAMPTZ NOT NULL,
  
  flowrate_set NUMERIC(6,2),
  acid_dosage_ok BOOLEAN DEFAULT false,
  he_temp_c NUMERIC(5,2),  -- Spec: 70.0 - 115.0 °C
  earth_dosage_ok BOOLEAN DEFAULT false,
  bleacher_level TEXT CHECK (bleacher_level IN ('L', 'H')),
  vacuum_mmhg NUMERIC(6,2), -- Spec: >= 600.0 mmHg
  niagara_filter TEXT,
  filter_change_time TEXT,
  ffa_pct NUMERIC(5,4),
  colour_r NUMERIC(4,2),
  colour_y NUMERIC(4,2),
  remarks TEXT,
  
  out_of_spec JSONB DEFAULT '[]'::jsonb,
  entered_by TEXT,
  entered_by_name TEXT,
  entered_at TIMESTAMPTZ,
  is_saved BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_sheet_slot UNIQUE (sheet_id, slot_index)
);

-- 4. QC Laboratory Samples (Form RF-FR-001)
CREATE TABLE IF NOT EXISTS qc_samples (
  id TEXT PRIMARY KEY,
  sample_code TEXT UNIQUE NOT NULL,
  batch_lot TEXT NOT NULL,
  sampling_point TEXT NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL,
  tested_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'InAnalysis', 'Approved', 'Rejected')),
  
  ffa_pct NUMERIC(5,4),
  colour_r NUMERIC(4,2),
  colour_y NUMERIC(4,2),
  moisture_pct NUMERIC(5,4),
  peroxide_value NUMERIC(5,2),
  dobi NUMERIC(4,2),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Live Supervisor Audit Events Feed
CREATE TABLE IF NOT EXISTS supervisor_events (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'alert', 'success')),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  shift INT,
  slot_time TEXT,
  lot_no TEXT,
  requires_acknowledgment BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hourly_entries_sheet ON hourly_entries(sheet_id);
CREATE INDEX IF NOT EXISTS idx_log_sheets_date ON log_sheets(sheet_date);
CREATE INDEX IF NOT EXISTS idx_supervisor_events_time ON supervisor_events(timestamp DESC);
