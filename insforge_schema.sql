-- ========================================================
-- NISSHIN PROCESS LOG - REFINERY BLEACHING PLANT (RF-FR-003)
-- INSFORGE POSTGRESQL SCHEMA WITH STANDARDIZED PREFIXED IDS
-- ========================================================

-- --------------------------------------------------------
-- 1. SEQUENCES FOR AUTOMATIC FORMATTED ID GENERATION
-- --------------------------------------------------------

-- Core Module Sequences
CREATE SEQUENCE IF NOT EXISTS seq_sr START 1;   -- SR001 -> Sample Report
CREATE SEQUENCE IF NOT EXISTS seq_qc START 1;   -- QC001 -> QC Decision
CREATE SEQUENCE IF NOT EXISTS seq_iso START 1;  -- ISO001 -> ISO Certificate
CREATE SEQUENCE IF NOT EXISTS seq_bp START 1;   -- BP001 -> Batch Process
CREATE SEQUENCE IF NOT EXISTS seq_pr START 1;   -- PR001 -> Production Record
CREATE SEQUENCE IF NOT EXISTS seq_pl START 1;   -- PL001 -> Process Log
CREATE SEQUENCE IF NOT EXISTS seq_ar START 1;   -- AR001 -> Approval Record
CREATE SEQUENCE IF NOT EXISTS seq_al START 1;   -- AL001 -> Audit Log

-- User & Administration Sequences
CREATE SEQUENCE IF NOT EXISTS seq_usr START 1;  -- USR001 -> User
CREATE SEQUENCE IF NOT EXISTS seq_adm START 1;  -- ADM001 -> Administrator
CREATE SEQUENCE IF NOT EXISTS seq_opr START 1;  -- OPR001 -> Operator / Technician
CREATE SEQUENCE IF NOT EXISTS seq_qcs START 1;  -- QCS001 -> QC Staff / Chemist
CREATE SEQUENCE IF NOT EXISTS seq_sup START 1;  -- SUP001 -> Supervisor
CREATE SEQUENCE IF NOT EXISTS seq_mgr START 1;  -- MGR001 -> Manager

-- Document Management Sequences
CREATE SEQUENCE IF NOT EXISTS seq_doc START 1;  -- DOC001 -> Document
CREATE SEQUENCE IF NOT EXISTS seq_sop START 1;  -- SOP001 -> Standard Operating Procedure
CREATE SEQUENCE IF NOT EXISTS seq_wi START 1;   -- WI001 -> Work Instruction
CREATE SEQUENCE IF NOT EXISTS seq_crt START 1;  -- CRT001 -> Certificate
CREATE SEQUENCE IF NOT EXISTS seq_att START 1;  -- ATT001 -> Attachment
CREATE SEQUENCE IF NOT EXISTS seq_rev START 1;  -- REV001 -> Document Revision

-- Function to dynamically generate formatted User IDs based on role
CREATE OR REPLACE FUNCTION generate_user_id(p_role TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_role ILIKE '%admin%' THEN
    RETURN 'ADM' || LPAD(nextval('seq_adm')::TEXT, 3, '0');
  ELSIF p_role ILIKE '%operator%' OR p_role ILIKE '%technician%' THEN
    RETURN 'OPR' || LPAD(nextval('seq_opr')::TEXT, 3, '0');
  ELSIF p_role ILIKE '%chemist%' OR p_role ILIKE '%qc%' THEN
    RETURN 'QCS' || LPAD(nextval('seq_qcs')::TEXT, 3, '0');
  ELSIF p_role ILIKE '%supervisor%' THEN
    RETURN 'SUP' || LPAD(nextval('seq_sup')::TEXT, 3, '0');
  ELSIF p_role ILIKE '%manager%' THEN
    RETURN 'MGR' || LPAD(nextval('seq_mgr')::TEXT, 3, '0');
  ELSE
    RETURN 'USR' || LPAD(nextval('seq_usr')::TEXT, 3, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------
-- 2. USER & ADMINISTRATION TABLES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL,
    department TEXT DEFAULT 'Refinery Operations',
    shift INT,
    phone TEXT,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-generate user ID if not provided
CREATE OR REPLACE FUNCTION trg_users_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_user_id(NEW.role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_user_id ON users;
CREATE TRIGGER trg_set_user_id
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trg_users_id();

-- --------------------------------------------------------
-- 3. CORE PROCESS & REFINERY MODULE TABLES
-- --------------------------------------------------------

-- BP001 → Batch Process
CREATE TABLE IF NOT EXISTS batch_processes (
    id TEXT PRIMARY KEY DEFAULT ('BP' || LPAD(nextval('seq_bp')::TEXT, 3, '0')),
    batch_no TEXT NOT NULL UNIQUE,
    plant_id TEXT NOT NULL DEFAULT 'LSEO-NB-01',
    product_name TEXT NOT NULL DEFAULT 'RBD Palm Oil',
    feed_tank TEXT DEFAULT 'TK-101',
    target_bleaching_earth_pct NUMERIC DEFAULT 1.25,
    target_activated_carbon_pct NUMERIC DEFAULT 0.08,
    target_temp_c NUMERIC DEFAULT 105,
    target_vacuum_mmhg NUMERIC DEFAULT 680,
    status TEXT DEFAULT 'InProgress',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PL001 → Process Log
CREATE TABLE IF NOT EXISTS process_logs (
    id TEXT PRIMARY KEY DEFAULT ('PL' || LPAD(nextval('seq_pl')::TEXT, 3, '0')),
    batch_id TEXT REFERENCES batch_processes(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    time_label TEXT NOT NULL,
    shift INT NOT NULL,
    operator_id TEXT REFERENCES users(id),
    flowrate_set NUMERIC,
    flowrate_actual NUMERIC,
    steam_press_bar NUMERIC,
    be_feed_tonnage NUMERIC,
    he_temp_c NUMERIC,
    pre_bleacher_temp_c NUMERIC,
    main_bleacher_temp_c NUMERIC,
    vacuum_mmhg NUMERIC,
    agitator_status TEXT DEFAULT 'Running',
    feed_pump_status TEXT DEFAULT 'Running',
    discharge_pump_status TEXT DEFAULT 'Running',
    leaf_filter_1_press NUMERIC,
    leaf_filter_2_press NUMERIC,
    remarks TEXT,
    is_saved BOOLEAN DEFAULT FALSE,
    out_of_spec TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PR001 → Production Record
CREATE TABLE IF NOT EXISTS production_records (
    id TEXT PRIMARY KEY DEFAULT ('PR' || LPAD(nextval('seq_pr')::TEXT, 3, '0')),
    batch_id TEXT REFERENCES batch_processes(id) ON DELETE CASCADE,
    shift INT NOT NULL,
    operator_id TEXT REFERENCES users(id),
    supervisor_id TEXT REFERENCES users(id),
    total_tonnage NUMERIC DEFAULT 0,
    clay_consumption_kg NUMERIC DEFAULT 0,
    carbon_consumption_kg NUMERIC DEFAULT 0,
    remarks TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- SR001 → Sample Report
CREATE TABLE IF NOT EXISTS sample_reports (
    id TEXT PRIMARY KEY DEFAULT ('SR' || LPAD(nextval('seq_sr')::TEXT, 3, '0')),
    sample_code TEXT NOT NULL,
    batch_id TEXT REFERENCES batch_processes(id) ON DELETE CASCADE,
    process_log_id TEXT REFERENCES process_logs(id) ON DELETE SET NULL,
    sample_time TIMESTAMPTZ DEFAULT NOW(),
    taken_by TEXT REFERENCES users(id),
    sample_type TEXT DEFAULT 'Bleached Palm Oil',
    sampling_point TEXT DEFAULT 'Bleacher Bleached Oil Outlet',
    ffa_pct NUMERIC,
    moisture_pct NUMERIC,
    iv NUMERIC,
    color_red NUMERIC,
    color_yellow NUMERIC,
    dobi NUMERIC,
    peroxide_value NUMERIC,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC001 → QC Decision
CREATE TABLE IF NOT EXISTS qc_decisions (
    id TEXT PRIMARY KEY DEFAULT ('QC' || LPAD(nextval('seq_qc')::TEXT, 3, '0')),
    sample_report_id TEXT REFERENCES sample_reports(id) ON DELETE CASCADE,
    chemist_id TEXT REFERENCES users(id),
    decision TEXT NOT NULL, -- 'PASS', 'REJECT', 'HOLD', 'RETEST'
    parameters_verified JSONB,
    comments TEXT,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR001 → Approval Record
CREATE TABLE IF NOT EXISTS approval_records (
    id TEXT PRIMARY KEY DEFAULT ('AR' || LPAD(nextval('seq_ar')::TEXT, 3, '0')),
    module_type TEXT NOT NULL, -- 'Bleaching Log', 'QC Report', 'Production Record'
    reference_id TEXT NOT NULL,
    approved_by TEXT REFERENCES users(id),
    status TEXT NOT NULL, -- 'Approved', 'Returned', 'Rejected'
    review_notes TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- AL001 → Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('AL' || LPAD(nextval('seq_al')::TEXT, 3, '0')),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ISO001 → ISO Certificate
CREATE TABLE IF NOT EXISTS iso_certificates (
    id TEXT PRIMARY KEY DEFAULT ('ISO' || LPAD(nextval('seq_iso')::TEXT, 3, '0')),
    cert_number TEXT NOT NULL UNIQUE,
    standard TEXT NOT NULL, -- 'ISO 9001:2015', 'HACCP', 'Halal', 'RSPO'
    issuer TEXT NOT NULL,
    scope TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 4. DOCUMENT MANAGEMENT MODULE TABLES
-- --------------------------------------------------------

-- DOC001 → Document
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY DEFAULT ('DOC' || LPAD(nextval('seq_doc')::TEXT, 3, '0')),
    title TEXT NOT NULL,
    doc_number TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'SOP', 'WI', 'Certificate', 'Form', 'Manual'
    current_revision TEXT DEFAULT 'Rev 01',
    status TEXT DEFAULT 'Active',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP001 → Standard Operating Procedure
CREATE TABLE IF NOT EXISTS standard_operating_procedures (
    id TEXT PRIMARY KEY DEFAULT ('SOP' || LPAD(nextval('seq_sop')::TEXT, 3, '0')),
    doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    sop_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    plant_section TEXT NOT NULL,
    purpose TEXT,
    scope TEXT,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WI001 → Work Instruction
CREATE TABLE IF NOT EXISTS work_instructions (
    id TEXT PRIMARY KEY DEFAULT ('WI' || LPAD(nextval('seq_wi')::TEXT, 3, '0')),
    sop_id TEXT REFERENCES standard_operating_procedures(id) ON DELETE CASCADE,
    wi_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    steps JSONB,
    critical_control_points TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRT001 → Certificate
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY DEFAULT ('CRT' || LPAD(nextval('seq_crt')::TEXT, 3, '0')),
    doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    cert_name TEXT NOT NULL,
    cert_code TEXT NOT NULL UNIQUE,
    accreditation_body TEXT NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATT001 → Attachment
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY DEFAULT ('ATT' || LPAD(nextval('seq_att')::TEXT, 3, '0')),
    reference_table TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    uploaded_by TEXT REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- REV001 → Document Revision
CREATE TABLE IF NOT EXISTS document_revisions (
    id TEXT PRIMARY KEY DEFAULT ('REV' || LPAD(nextval('seq_rev')::TEXT, 3, '0')),
    doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    revision_number TEXT NOT NULL,
    change_summary TEXT NOT NULL,
    approved_by TEXT REFERENCES users(id),
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
