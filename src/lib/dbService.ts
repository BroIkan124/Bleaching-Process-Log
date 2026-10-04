import { insforge, isInsForgeConfigured } from "./insforge";
import { LogSheet, LogEntry, SampleReport, UserProfile } from "@/types";

/**
 * InsForge Database Integration Service
 * Manages live real-time persistence with custom-prefixed tables:
 * - BP001 → batch_processes
 * - PL001 → process_logs
 * - SR001 → sample_reports
 * - QC001 → qc_decisions
 * - PR001 → production_records
 * - AR001 → approval_records
 * - AL001 → audit_logs
 * - USR / ADM / OPR / QCS / SUP / MGR → users
 */

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
// 3. Batch Processes (BP001) & Operating Parameters
// ----------------------------------------------------
export async function syncBatchParamsToInsForge(
  sheet: LogSheet,
  currentUser: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const { error } = await insforge.database.from("batch_processes").upsert([
      {
        id: "BP001",
        batch_no: `BATCH-${sheet.sheet_date || "2026-10-02"}-001`,
        plant_id: sheet.plant_id || "LSEO-NB-01",
        product_name: sheet.product_name || "RBD Palm Oil",
        feed_tank: sheet.feed_tank_id || "TK-101",
        target_bleaching_earth_pct: Number(sheet.earth_min_pct) || 1.25,
        target_temp_c: 105,
        target_vacuum_mmhg: 680,
        status: sheet.status,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    await logActivityToInsForge(currentUser, "UPDATE_OPERATING_PARAMETERS", "BATCH_PROCESS", "BP001", {
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
  currentUser: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    const { error } = await insforge.database.from("process_logs").upsert(
      [
        {
          batch_id: batchId,
          slot_index: entry.slot_index,
          time_label: entry.time_label,
          shift: entry.shift,
          operator_id: currentUser?.id || entry.entered_by || "OPR001",
          flowrate_set: entry.flowrate_set ?? null,
          he_temp_c: entry.he_temp_c ?? null,
          vacuum_mmhg: entry.vacuum_mmhg ?? null,
          remarks: entry.remarks || null,
          is_saved: entry.is_saved ?? true,
          out_of_spec: Array.isArray(entry.out_of_spec) ? entry.out_of_spec.map(o => typeof o === 'string' ? o : o.message || o.field) : [],
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "batch_id,slot_index" }
    );

    if (error) {
      // If composite key conflict error, try direct insert
      await insforge.database.from("process_logs").insert([
        {
          batch_id: batchId,
          slot_index: entry.slot_index,
          time_label: entry.time_label,
          shift: entry.shift,
          operator_id: currentUser?.id || entry.entered_by || "OPR001",
          flowrate_set: entry.flowrate_set ?? null,
          he_temp_c: entry.he_temp_c ?? null,
          vacuum_mmhg: entry.vacuum_mmhg ?? null,
          remarks: entry.remarks || null,
          is_saved: true,
          out_of_spec: Array.isArray(entry.out_of_spec) ? entry.out_of_spec.map(o => typeof o === 'string' ? o : o.message || o.field) : [],
        },
      ]);
    }

    await logActivityToInsForge(currentUser, "SAVE_HOURLY_SLOT", "PROCESS_LOG", `SLOT-${entry.time_label}`, {
      slot: entry.time_label,
      shift: entry.shift,
      vacuum_mmhg: entry.vacuum_mmhg,
      he_temp_c: entry.he_temp_c,
      flowrate_set: entry.flowrate_set,
      out_of_spec: entry.out_of_spec,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync slot log to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 5. Approval Records (AR001) - Supervisor Reviews
// ----------------------------------------------------
export async function syncApprovalToInsForge(
  moduleType: string,
  referenceId: string,
  currentUser: UserProfile,
  status: "Approved" | "Returned" | "Rejected",
  reviewNotes: string
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

    // Also update batch_processes status
    await insforge.database
      .from("batch_processes")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", referenceId);

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
// 6. QC Tests & Samples (SR001 & QC001)
// ----------------------------------------------------
export async function syncQcSampleToInsForge(
  sample: SampleReport | any,
  currentUser: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) return { success: true };

  try {
    // Extract parameters from results array if present, otherwise direct fields
    const getResVal = (code: string): number | null => {
      if (Array.isArray(sample.results)) {
        const item = sample.results.find((r: any) => 
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
      ? (sample.decision.decision === "accept" || sample.decision.decision === "accept_concession" ? "PASS" : "REJECT")
      : (sample.status === "Pass" || sample.status === "Passed" ? "PASS" : "PENDING");

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
          status: decisionCode === "PASS" ? "Passed" : (decisionCode === "REJECT" ? "Rejected" : "Pending"),
        },
      ])
      .select();

    if (srError) throw srError;

    const insertedSrId = srData?.[0]?.id || "SR001";

    // Insert corresponding QC Decision
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
          comments: sample.remarks || sample.decision?.reason_detail || "Verified and recorded via QC Laboratory Console.",
          decided_at: new Date().toISOString(),
        },
      ]);
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
// 7. Document Generation & Export Logging (DOC001)
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
// 8. Performance Reports & Analytics Activity Logging
// ----------------------------------------------------
export async function recordReportExport(
  reportType: "CSV" | "PRINT" | "EXCEL",
  currentUser: UserProfile | null,
  details?: Record<string, any>
): Promise<void> {
  await logActivityToInsForge(currentUser, `EXPORT_REPORT_${reportType}`, "REPORTS", undefined, details);
}

// ----------------------------------------------------
// 9. Failed Authentication Logging
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
// 10. Dashboard Tab Navigation Tracking
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

