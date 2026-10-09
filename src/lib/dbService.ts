import { insforge, isInsForgeConfigured } from "./insforge";
import { LogSheet, LogEntry, SampleReport, UserProfile, Product, Plant, Tank, SupervisorUpdateEvent } from "@/types";
import { createCleanSheet, MOCK_PRODUCTS, MOCK_PLANTS, MOCK_TANKS, INITIAL_SUPERVISOR_EVENTS } from "./mockData";

/**
 * InsForge Database Integration Service
 * Multi-Device Realtime Persistence & Cloud Synchronization Service
 * 
 * Tables:
 * - batch_processes (BP001) → Batch header parameters & plant operating status
 * - process_logs (PL001)    → 24-hour hourly slot recordings
 * - sample_reports (SR001)  → Quality Control laboratory tests & analysis
 * - qc_decisions (QC001)    → Chemist decisions & approval dispositions
 * - approval_records (AR001)→ Supervisor review notes & sign-offs
 * - audit_logs (AL001)      → Audit trail & high-fidelity state synchronization snapshots (SYSTEM_SYNC_STATE)
 * - users                   → Plant operators, chemists, supervisors, administrators
 */

// ----------------------------------------------------
// 0. State Snapshot Helpers for 100% Cross-Device Parity
// ----------------------------------------------------
export async function saveStateSnapshotToInsForge(
  entityId: "CURRENT_SHEET" | "QC_REPORTS" | "MASTER_CATALOG" | "SUPERVISOR_EVENTS",
  payload: any,
  currentUser: UserProfile | null
): Promise<boolean> {
  if (!isInsForgeConfigured || !insforge) return false;

  try {
    await insforge.database.from("audit_logs").insert([
      {
        user_id: currentUser?.id || "SYSTEM",
        user_name: currentUser?.name || "System Sync",
        user_role: currentUser?.role || "system",
        action: "SYNC_SNAPSHOT",
        entity_type: "SYSTEM_SYNC_STATE",
        entity_id: entityId,
        details: {
          data: payload,
          synced_at: new Date().toISOString(),
          synced_by: currentUser?.name || "System",
        },
        timestamp: new Date().toISOString(),
      },
    ]);
    return true;
  } catch (err) {
    console.warn(`Failed to save state snapshot [${entityId}]:`, err);
    return false;
  }
}

export async function fetchStateSnapshotFromInsForge<T>(
  entityId: "CURRENT_SHEET" | "QC_REPORTS" | "MASTER_CATALOG" | "SUPERVISOR_EVENTS"
): Promise<{ data: T; synced_at: string } | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    const { data, error } = await insforge.database
      .from("audit_logs")
      .select("details, timestamp")
      .eq("entity_type", "SYSTEM_SYNC_STATE")
      .eq("entity_id", entityId)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0 || !data[0]?.details?.data) {
      return null;
    }

    return {
      data: data[0].details.data as T,
      synced_at: data[0].details.synced_at || data[0].timestamp,
    };
  } catch (err) {
    console.warn(`Failed to fetch state snapshot [${entityId}]:`, err);
    return null;
  }
}

// ----------------------------------------------------
// 1. Audit Logging (AL001)
// ----------------------------------------------------
export async function logActivityToInsForge(
  user: UserProfile | { id: string; name: string; role: string } | null,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  if (!isInsForgeConfigured || !insforge) return;

  try {
    await insforge.database.from("audit_logs").insert([
      {
        user_id: user?.id || "ANONYMOUS",
        user_name: user?.name || "System/Anonymous",
        user_role: user?.role || "unknown",
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn("Audit log error:", err);
  }
}

// ----------------------------------------------------
// 2. Users Management & Session Sync
// ----------------------------------------------------
export async function fetchUsersFromInsForge(): Promise<UserProfile[] | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    const { data, error } = await insforge.database
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      password: u.password || "password123",
      department: u.department || "Refinery Operations",
      shift: u.shift as 1 | 2 | 3 | undefined,
      phone: u.phone,
      active: u.active ?? true,
      last_login: u.last_login ? new Date(u.last_login).toLocaleString() : undefined,
    }));
  } catch (err) {
    console.warn("Failed to fetch users from InsForge:", err);
    return null;
  }
}

export async function updateUserLastLogin(user: UserProfile): Promise<void> {
  if (!isInsForgeConfigured || !insforge) return;

  try {
    await insforge.database
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    await logActivityToInsForge(user, "USER_LOGIN", "USER_SESSION", user.id, {
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.warn("Failed to update last login:", err);
  }
}

export async function syncUserToInsForge(user: UserProfile): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const { error } = await insforge.database.from("users").upsert([
      {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password || "password123",
        role: user.role,
        department: user.department || "Refinery Operations",
        shift: user.shift || null,
        phone: user.phone || null,
        active: user.active ?? true,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync user to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 3. Batch Processes & Operating Parameters (BP001)
// ----------------------------------------------------
export async function syncBatchParamsToInsForge(
  sheet: LogSheet,
  currentUser: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const { error } = await insforge.database.from("batch_processes").upsert([
      {
        id: sheet.id || "BP001",
        batch_no: `BATCH-${sheet.sheet_date || "2026-10-08"}-001`,
        plant_id: sheet.plant_id || "plt-1",
        product_name: sheet.product_name || "RBD Palm Oil",
        feed_tank: sheet.feed_tank_id || "tnk-f1",
        target_bleaching_earth_pct: Number(sheet.earth_min_pct) || 1.25,
        target_temp_c: 105,
        target_vacuum_mmhg: 680,
        status: sheet.status,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    // Persist full state snapshot so every device has 100% identical sheet parameters
    await saveStateSnapshotToInsForge("CURRENT_SHEET", sheet, currentUser);

    await logActivityToInsForge(currentUser, "UPDATE_OPERATING_PARAMETERS", "BATCH_PROCESS", sheet.id || "BP001", {
      plant_id: sheet.plant_id,
      product: sheet.product_name,
      feed_tank: sheet.feed_tank_id,
      status: sheet.status,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync batch params:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 4. Process Logs (PL001) - 24-Hour Hourly Slots
// ----------------------------------------------------
export async function syncSlotToInsForge(
  entry: LogEntry,
  batchId: string = "BP001",
  currentUser: UserProfile | null,
  currentSheet?: LogSheet
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    // 1. Check if record already exists for this slot_index and batch_id to avoid duplication
    const { data: existingRows } = await insforge.database
      .from("process_logs")
      .select("id")
      .eq("batch_id", batchId)
      .eq("slot_index", entry.slot_index);

    const payload = {
      batch_id: batchId,
      slot_index: entry.slot_index,
      time_label: entry.time_label,
      shift: entry.shift,
      operator_id: currentUser?.id || entry.entered_by || "OPR001",
      flowrate_set: entry.flowrate_set ?? null,
      flowrate_actual: null,
      he_temp_c: entry.he_temp_c ?? null,
      vacuum_mmhg: entry.vacuum_mmhg ?? null,
      remarks: entry.remarks || null,
      is_saved: entry.is_saved ?? true,
      out_of_spec: Array.isArray(entry.out_of_spec)
        ? entry.out_of_spec.map((o) => (typeof o === "string" ? o : o.message || o.field))
        : [],
      updated_at: new Date().toISOString(),
    };

    if (existingRows && existingRows.length > 0) {
      // Update primary row
      await insforge.database
        .from("process_logs")
        .update(payload)
        .eq("id", existingRows[0].id);

      // Clean up any historic duplicate entries for this slot
      if (existingRows.length > 1) {
        for (let i = 1; i < existingRows.length; i++) {
          await insforge.database
            .from("process_logs")
            .delete()
            .eq("id", existingRows[i].id);
        }
      }
    } else {
      // Direct insert for new slot
      await insforge.database.from("process_logs").insert([payload]);
    }

    // 2. Audit Activity Logging
    await logActivityToInsForge(currentUser, "SAVE_HOURLY_SLOT", "PROCESS_LOG", `SLOT-${entry.time_label}`, {
      slot: entry.time_label,
      shift: entry.shift,
      vacuum_mmhg: entry.vacuum_mmhg,
      he_temp_c: entry.he_temp_c,
      flowrate_set: entry.flowrate_set,
      out_of_spec: entry.out_of_spec,
    });

    // 3. If the entire updated sheet is supplied, update cloud state snapshot
    if (currentSheet) {
      await saveStateSnapshotToInsForge("CURRENT_SHEET", currentSheet, currentUser);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync slot log to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 5. Fetch Full Live Sheet from InsForge (Cross-Device Read)
// ----------------------------------------------------
export async function fetchBatchSheetFromInsForge(): Promise<{ sheet: LogSheet; source: "cloud" | "fallback" } | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    // A. First check high-fidelity snapshot
    const snapshot = await fetchStateSnapshotFromInsForge<LogSheet>("CURRENT_SHEET");

    // B. Query live relational batch_processes
    const { data: bpData } = await insforge.database
      .from("batch_processes")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    const bp = bpData?.[0];
    const batchId = bp?.id || "BP001";

    // C. Query live process_logs for hourly slots
    const { data: plData } = await insforge.database
      .from("process_logs")
      .select("*")
      .eq("batch_id", batchId)
      .order("updated_at", { ascending: true });

    // Start with snapshot if available, otherwise initialize clean sheet
    let sheet: LogSheet = snapshot?.data ? { ...snapshot.data } : createCleanSheet();

    // Overlay relational batch_processes header
    if (bp) {
      sheet.id = bp.id || sheet.id;
      sheet.plant_id = bp.plant_id || sheet.plant_id;
      if (bp.product_name) sheet.product_name = bp.product_name;
      if (bp.feed_tank) sheet.feed_tank_id = bp.feed_tank;
      if (bp.target_bleaching_earth_pct) sheet.earth_min_pct = Number(bp.target_bleaching_earth_pct);
      if (bp.status) sheet.status = bp.status;
      if (bp.updated_at && (!sheet.updated_at || new Date(bp.updated_at) > new Date(sheet.updated_at))) {
        sheet.updated_at = bp.updated_at;
      }
    }

    // Overlay relational process_logs slots
    if (plData && plData.length > 0) {
      // Group by slot_index and keep latest
      const slotMap = new Map<number, any>();
      for (const row of plData) {
        if (typeof row.slot_index === "number" && row.slot_index >= 0 && row.slot_index < 24) {
          slotMap.set(row.slot_index, row);
        }
      }

      sheet.entries = sheet.entries.map((entry, idx) => {
        const row = slotMap.get(idx);
        if (!row) return entry;
        return {
          ...entry,
          flowrate_set: row.flowrate_set !== null && row.flowrate_set !== undefined ? Number(row.flowrate_set) : entry.flowrate_set,
          he_temp_c: row.he_temp_c !== null && row.he_temp_c !== undefined ? Number(row.he_temp_c) : entry.he_temp_c,
          vacuum_mmhg: row.vacuum_mmhg !== null && row.vacuum_mmhg !== undefined ? Number(row.vacuum_mmhg) : entry.vacuum_mmhg,
          remarks: row.remarks || entry.remarks || "",
          shift: (row.shift as 1 | 2 | 3) || entry.shift,
          time_label: row.time_label || entry.time_label,
          is_saved: row.is_saved ?? true,
          entered_by: row.operator_id || entry.entered_by,
          entered_at: row.updated_at || row.created_at || entry.entered_at,
          out_of_spec: Array.isArray(row.out_of_spec)
            ? row.out_of_spec.map((o: any) =>
                typeof o === "string" ? { field: o, value: null, rule: "", message: o } : o
              )
            : entry.out_of_spec || [],
        };
      });
    }

    return { sheet, source: "cloud" };
  } catch (err) {
    console.warn("Failed to fetch batch sheet from InsForge:", err);
    return null;
  }
}

// ----------------------------------------------------
// 6. Approval Records (AR001) - Supervisor Reviews
// ----------------------------------------------------
export async function syncApprovalToInsForge(
  moduleType: string,
  referenceId: string,
  currentUser: UserProfile,
  status: "Approved" | "Returned" | "Rejected",
  reviewNotes: string,
  updatedSheet?: LogSheet
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const { error } = await insforge.database.from("approval_records").insert([
      {
        module_type: moduleType,
        reference_id: referenceId,
        approved_by: currentUser.id,
        status,
        review_notes: reviewNotes,
        approved_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    // Update batch_processes status
    await insforge.database
      .from("batch_processes")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referenceId);

    // Save full snapshot if updatedSheet provided
    if (updatedSheet) {
      await saveStateSnapshotToInsForge("CURRENT_SHEET", updatedSheet, currentUser);
    }

    await logActivityToInsForge(currentUser, `SHEET_${status.toUpperCase()}`, "APPROVAL_RECORD", referenceId, {
      status,
      reviewer: currentUser.name,
      notes: reviewNotes,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync approval to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 7. QC Tests & Samples (SR001 & QC001) - Read & Write
// ----------------------------------------------------
export async function fetchQcReportsFromInsForge(): Promise<SampleReport[] | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    // 1. Fetch snapshot from audit_logs
    const snapshot = await fetchStateSnapshotFromInsForge<SampleReport[]>("QC_REPORTS");

    // 2. Query live relational sample_reports
    const { data: srData } = await insforge.database
      .from("sample_reports")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Query live relational qc_decisions
    const { data: qcData } = await insforge.database
      .from("qc_decisions")
      .select("*")
      .order("decided_at", { ascending: false });

    const qcMap = new Map<string, any>();
    if (qcData) {
      for (const q of qcData) {
        if (!qcMap.has(q.sample_report_id)) {
          qcMap.set(q.sample_report_id, q);
        }
      }
    }

    const reportsFromDb: SampleReport[] = (srData || []).map((sr: any) => {
      const qc = qcMap.get(sr.id);
      const isAccepted = sr.status === "Passed" || (qc && (qc.decision === "PASS" || qc.decision === "accept"));
      const isRejected = sr.status === "Rejected" || (qc && (qc.decision === "REJECT" || qc.decision === "reject"));

      return {
        id: sr.id,
        report_no: sr.sample_code && sr.sample_code.startsWith("SAR-") ? sr.sample_code : `SAR-2026-${sr.id}`,
        sample_date: sr.sample_time ? sr.sample_time.split("T")[0] : new Date().toISOString().split("T")[0],
        time_check: sr.sample_time ? new Date(sr.sample_time).toTimeString().slice(0, 5) : "08:00",
        lot_no: sr.sample_code || `LOT-${sr.id}`,
        product_name: sr.sample_type || "Bleached Palm Oil",
        sampling_point_name: sr.sampling_point || "Bleacher Outlet",
        submitted_by_name: sr.taken_by || "QC Staff",
        remarks: qc?.comments || null,
        status: isAccepted || isRejected ? "decided" : "awaiting_results",
        created_at: sr.created_at || sr.sample_time || new Date().toISOString(),
        results: [
          {
            id: `res-ffa-${sr.id}`,
            report_id: sr.id,
            parameter_code: "FFA",
            parameter_name: "Free Fatty Acid (% Palmitic)",
            unit: "%",
            value_numeric: sr.ffa_pct !== null && sr.ffa_pct !== undefined ? Number(sr.ffa_pct) : null,
            in_spec: sr.ffa_pct !== null && sr.ffa_pct !== undefined ? Number(sr.ffa_pct) <= 0.05 : null,
          },
          {
            id: `res-h2o-${sr.id}`,
            report_id: sr.id,
            parameter_code: "H2O",
            parameter_name: "Moisture & Impurities",
            unit: "%",
            value_numeric: sr.moisture_pct !== null && sr.moisture_pct !== undefined ? Number(sr.moisture_pct) : null,
            in_spec: sr.moisture_pct !== null && sr.moisture_pct !== undefined ? Number(sr.moisture_pct) <= 0.05 : null,
          },
          {
            id: `res-pv-${sr.id}`,
            report_id: sr.id,
            parameter_code: "PV",
            parameter_name: "Peroxide Value",
            unit: "meq/kg",
            value_numeric: sr.peroxide_value !== null && sr.peroxide_value !== undefined ? Number(sr.peroxide_value) : null,
            in_spec: sr.peroxide_value !== null && sr.peroxide_value !== undefined ? Number(sr.peroxide_value) <= 1.0 : null,
          },
          {
            id: `res-iv-${sr.id}`,
            report_id: sr.id,
            parameter_code: "IV",
            parameter_name: "Iodine Value (Wijs)",
            unit: "g I2/100g",
            value_numeric: sr.iv !== null && sr.iv !== undefined ? Number(sr.iv) : null,
            in_spec: true,
          },
          {
            id: `res-cr-${sr.id}`,
            report_id: sr.id,
            parameter_code: "COLOUR_R",
            parameter_name: 'Colour Lovibond Red (5¼" cell)',
            unit: "R",
            value_numeric: sr.color_red !== null && sr.color_red !== undefined ? Number(sr.color_red) : null,
            in_spec: sr.color_red !== null && sr.color_red !== undefined ? Number(sr.color_red) <= 2.5 : null,
          },
          {
            id: `res-cy-${sr.id}`,
            report_id: sr.id,
            parameter_code: "COLOUR_Y",
            parameter_name: "Colour Lovibond Yellow",
            unit: "Y",
            value_numeric: sr.color_yellow !== null && sr.color_yellow !== undefined ? Number(sr.color_yellow) : null,
            in_spec: sr.color_yellow !== null && sr.color_yellow !== undefined ? Number(sr.color_yellow) <= 25.0 : null,
          },
        ],
        decision: qc
          ? {
              id: qc.id,
              report_id: sr.id,
              decision:
                qc.decision === "PASS" || qc.decision === "accept"
                  ? "accept"
                  : qc.decision === "REJECT" || qc.decision === "reject"
                  ? "reject"
                  : "accept_concession",
              decided_by_name: qc.chemist_id || "QC Chemist",
              decided_at: qc.decided_at || new Date().toISOString(),
              reason_detail: qc.comments,
            }
          : undefined,
      };
    });

    if (snapshot && Array.isArray(snapshot.data) && snapshot.data.length > 0) {
      // Merge snapshot with DB rows: prefer snapshot for items present in both
      const map = new Map<string, SampleReport>();
      for (const r of reportsFromDb) {
        map.set(r.id, r);
        map.set(r.lot_no, r);
      }
      for (const s of snapshot.data) {
        map.set(s.id, s);
      }
      return Array.from(map.values());
    }

    return reportsFromDb;
  } catch (err) {
    console.warn("Failed to fetch QC reports from InsForge:", err);
    return null;
  }
}

export async function syncQcSampleToInsForge(
  sample: SampleReport | any,
  currentUser: UserProfile | null,
  allReports?: SampleReport[]
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const getResVal = (code: string): number | null => {
      if (Array.isArray(sample.results)) {
        const item = sample.results.find(
          (r: any) =>
            r.parameter_code === code ||
            (r.parameter_name && r.parameter_name.toLowerCase().includes(code.toLowerCase()))
        );
        if (item && item.value_numeric !== null && item.value_numeric !== undefined) {
          return Number(item.value_numeric);
        }
      }
      return null;
    };

    const ffa = getResVal("FFA") ?? (sample.ffa_pct ? Number(sample.ffa_pct) : null);
    const moisture = getResVal("H2O") ?? (sample.moisture_pct ? Number(sample.moisture_pct) : null);
    const pv = getResVal("PV") ?? (sample.peroxide_value ? Number(sample.peroxide_value) : null);
    const iv = getResVal("IV") ?? (sample.iv ? Number(sample.iv) : null);
    const colorRed = getResVal("COLOUR_R") ?? (sample.colour_r ? Number(sample.colour_r) : null);
    const colorYellow = getResVal("COLOUR_Y") ?? (sample.colour_y ? Number(sample.colour_y) : null);
    const dobi = getResVal("DOBI") ?? (sample.dobi ? Number(sample.dobi) : null);

    const decisionCode = sample.decision?.decision
      ? sample.decision.decision === "accept" || sample.decision.decision === "accept_concession"
        ? "PASS"
        : "REJECT"
      : sample.status === "Pass" || sample.status === "Passed"
      ? "PASS"
      : "PENDING";

    const { data: srData, error: srError } = await insforge.database
      .from("sample_reports")
      .insert([
        {
          sample_code: sample.lot_no || sample.report_no || `SMP-${Date.now().toString().slice(-6)}`,
          batch_id: "BP001",
          taken_by: currentUser?.id || "QCS001",
          sample_type: sample.product_name || "Bleached Palm Oil",
          sampling_point: sample.sampling_point_name || sample.sample_point || "Bleacher Bleached Oil Outlet",
          ffa_pct: ffa,
          color_red: colorRed,
          color_yellow: colorYellow,
          moisture_pct: moisture,
          peroxide_value: pv,
          iv: iv,
          dobi: dobi,
          status: decisionCode === "PASS" ? "Passed" : decisionCode === "REJECT" ? "Rejected" : "Pending",
        },
      ])
      .select();

    if (srError) throw srError;

    const insertedSrId = srData?.[0]?.id || "SR001";

    if (decisionCode !== "PENDING") {
      await insforge.database.from("qc_decisions").insert([
        {
          sample_report_id: insertedSrId,
          chemist_id: currentUser?.id || "QCS001",
          decision: decisionCode,
          parameters_verified: {
            ffa,
            color_red: colorRed,
            color_yellow: colorYellow,
            moisture,
            pv,
            dobi,
          },
          comments:
            sample.remarks ||
            sample.decision?.reason_detail ||
            "Verified and recorded via QC Laboratory Console.",
          decided_at: new Date().toISOString(),
        },
      ]);
    }

    // Persist full QC list snapshot if provided
    if (allReports && allReports.length > 0) {
      await saveStateSnapshotToInsForge("QC_REPORTS", allReports, currentUser);
    }

    await logActivityToInsForge(currentUser, "RECORD_QC_SAMPLE", "SAMPLE_REPORT", insertedSrId, {
      lot_no: sample.lot_no,
      report_no: sample.report_no,
      status: decisionCode,
      chemist: currentUser?.name,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync QC sample:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 8. Master Data Management (Products, Plants, Tanks)
// ----------------------------------------------------
export async function fetchMasterDataFromInsForge(): Promise<{
  products: Product[];
  plants: Plant[];
  tanks: Tank[];
} | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    const snapshot = await fetchStateSnapshotFromInsForge<{
      products: Product[];
      plants: Plant[];
      tanks: Tank[];
    }>("MASTER_CATALOG");

    if (snapshot && snapshot.data) {
      return snapshot.data;
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch master data from InsForge:", err);
    return null;
  }
}

export async function syncMasterDataToInsForge(
  products: Product[],
  plants: Plant[],
  tanks: Tank[],
  currentUser: UserProfile | null
): Promise<void> {
  await saveStateSnapshotToInsForge("MASTER_CATALOG", { products, plants, tanks }, currentUser);
  await logActivityToInsForge(currentUser, "SYNC_MASTER_CATALOG", "MASTER_DATA", undefined, {
    products_count: products.length,
    plants_count: plants.length,
    tanks_count: tanks.length,
  });
}

// ----------------------------------------------------
// 9. Supervisor Timeline & Events Synchronization
// ----------------------------------------------------
export async function fetchSupervisorEventsFromInsForge(): Promise<SupervisorUpdateEvent[] | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    const snapshot = await fetchStateSnapshotFromInsForge<SupervisorUpdateEvent[]>("SUPERVISOR_EVENTS");

    const { data: auditData } = await insforge.database
      .from("audit_logs")
      .select("*")
      .neq("entity_type", "SYSTEM_SYNC_STATE")
      .order("timestamp", { ascending: false })
      .limit(30);

    const eventsFromAudit: SupervisorUpdateEvent[] = (auditData || []).map((al: any) => {
      const isAlert =
        al.action.includes("ALERT") || al.action.includes("OUT_OF_SPEC") || al.action.includes("REJECT");
      const isSuccess =
        al.action.includes("APPROVED") || al.action.includes("PASS") || al.action.includes("SAVE");
      const severity = isAlert ? "alert" : isSuccess ? "success" : "info";

      let source: SupervisorUpdateEvent["source"] = "System";
      if (al.entity_type === "PROCESS_LOG") source = "Bleaching Log";
      else if (al.entity_type === "SAMPLE_REPORT") source = "QC Lab";
      else if (al.entity_type === "BATCH_PROCESS") source = "Operating Parameters";
      else if (al.entity_type === "APPROVAL_RECORD") source = "Supervisor Monitoring";

      let title = al.action.replace(/_/g, " ");
      if (al.details?.slot) title = `Slot ${al.details.slot} Hrs ${title}`;

      return {
        id: `evt-audit-${al.id}`,
        timestamp: al.timestamp,
        source,
        title,
        description: `${al.user_name || "User"}: ${al.action} on ${al.entity_type}${
          al.entity_id ? ` [${al.entity_id}]` : ""
        }`,
        severity,
        author_name: al.user_name || "System",
        author_role: (al.user_role as any) || "technician",
        shift: al.details?.shift,
        slot_time: al.details?.slot,
        acknowledged: true,
      };
    });

    if (snapshot && Array.isArray(snapshot.data) && snapshot.data.length > 0) {
      const map = new Map<string, SupervisorUpdateEvent>();
      for (const ev of eventsFromAudit) map.set(ev.id, ev);
      for (const ev of snapshot.data) map.set(ev.id, ev);
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return eventsFromAudit.length > 0 ? eventsFromAudit : null;
  } catch (err) {
    console.warn("Failed to fetch supervisor events from InsForge:", err);
    return null;
  }
}

export async function syncSupervisorEventsToInsForge(
  events: SupervisorUpdateEvent[],
  currentUser: UserProfile | null
): Promise<void> {
  await saveStateSnapshotToInsForge("SUPERVISOR_EVENTS", events, currentUser);
}

// ----------------------------------------------------
// 10. Lightweight Cloud Timestamp Check for Auto-Sync
// ----------------------------------------------------
export async function checkCloudUpdateTimestamp(): Promise<string | null> {
  if (!isInsForgeConfigured || !insforge) return null;

  try {
    const { data } = await insforge.database
      .from("audit_logs")
      .select("timestamp")
      .order("timestamp", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      return data[0].timestamp;
    }
    return null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// 11. Document Generation & Export Logging (DOC001)
// ----------------------------------------------------
export async function recordDocumentExport(
  docTitle: string,
  docNumber: string,
  category: string,
  currentUser: UserProfile | null,
  details?: Record<string, any>
): Promise<void> {
  if (!isInsForgeConfigured || !insforge) return;

  try {
    const docCode = `${docNumber}-${Date.now().toString().slice(-6)}`;
    await insforge.database.from("documents").insert([
      {
        title: docTitle,
        doc_number: docCode,
        category,
        current_revision: "Rev 03",
        status: "Active",
        created_by: currentUser?.id || "OPR001",
      },
    ]);

    await logActivityToInsForge(currentUser, "EXPORT_DOCUMENT", "DOCUMENT", docCode, {
      title: docTitle,
      category,
      ...details,
    });
  } catch (err) {
    console.warn("Failed to record document export in InsForge:", err);
  }
}

// ----------------------------------------------------
// 12. Performance Reports & Analytics Activity Logging
// ----------------------------------------------------
export async function recordReportExport(
  reportType: "CSV" | "PRINT" | "EXCEL",
  currentUser: UserProfile | null,
  details?: Record<string, any>
): Promise<void> {
  await logActivityToInsForge(currentUser, `EXPORT_REPORT_${reportType}`, "REPORTS", undefined, details);
}

// ----------------------------------------------------
// 13. Failed Authentication Logging
// ----------------------------------------------------
export async function recordFailedLogin(
  identifier: string,
  reason: string
): Promise<void> {
  await logActivityToInsForge(null, "LOGIN_FAILED", "USER_SESSION", undefined, {
    attempted_identifier: identifier,
    reason,
  });
}

// ----------------------------------------------------
// 14. Dashboard Tab Navigation Tracking
// ----------------------------------------------------
export async function recordNavigationEvent(
  fromTab: string,
  toTab: string,
  currentUser: UserProfile | null
): Promise<void> {
  await logActivityToInsForge(currentUser, "NAVIGATE_TAB", "DASHBOARD", toTab, {
    from: fromTab,
    to: toTab,
  });
}
