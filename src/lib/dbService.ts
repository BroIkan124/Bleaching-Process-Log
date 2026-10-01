import { insforge, isInsForgeConfigured } from "./insforge";
import { LogSheet, LogEntry, SampleReport, SupervisorUpdateEvent, UserProfile } from "@/types";

/**
 * Service to sync data between the Next.js app and the InsForge PostgreSQL backend.
 * Gracefully falls back to local state if InsForge credentials are not set.
 */

// 1. Log Sheets (RF-FR-003)
export async function syncSheetToInsForge(sheet: LogSheet): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) {
    return { success: true };
  }

  try {
    const { error } = await insforge.database
      .from("log_sheets")
      .upsert({
        id: sheet.id,
        form_no: sheet.form_no,
        form_rev: sheet.form_rev,
        sheet_date: sheet.sheet_date,
        plant_id: sheet.plant_id,
        plant_name: sheet.plant_name,
        product_id: sheet.product_id,
        product_name: sheet.product_name,
        feed_tank_id: sheet.feed_tank_id,
        discharge_tank_id: sheet.discharge_tank_id,
        input_mt_hr: sheet.input_mt_hr,
        input_mt_day: sheet.input_mt_day,
        acid_type: sheet.acid_type,
        acid_mm: sheet.acid_mm,
        acid_cm_hr: sheet.acid_cm_hr,
        acid_pct: sheet.acid_pct,
        earth_type: sheet.earth_type,
        earth_setting: sheet.earth_setting,
        earth_min_pct: sheet.earth_min_pct,
        earth_kgs_day: sheet.earth_kgs_day,
        aid1_type: sheet.aid1_type,
        aid1_qty: sheet.aid1_qty,
        aid2_type: sheet.aid2_type,
        aid2_qty: sheet.aid2_qty,
        tech_s1: sheet.tech_s1,
        tech_s1_name: sheet.tech_s1_name,
        tech_s2: sheet.tech_s2,
        tech_s2_name: sheet.tech_s2_name,
        tech_s3: sheet.tech_s3,
        tech_s3_name: sheet.tech_s3_name,
        status: sheet.status,
        submitted_at: sheet.submitted_at,
        reviewed_by: sheet.reviewed_by,
        reviewed_by_name: sheet.reviewed_by_name,
        reviewed_at: sheet.reviewed_at,
        review_note: sheet.review_note,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("InsForge sheet sync error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync sheet to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// 2. Hourly Entries
export async function syncEntryToInsForge(entry: LogEntry): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) {
    return { success: true };
  }

  try {
    const { error } = await insforge.database
      .from("hourly_entries")
      .upsert({
        id: entry.id,
        sheet_id: entry.sheet_id,
        slot_index: entry.slot_index,
        time_label: entry.time_label,
        shift: entry.shift,
        actual_timestamp: entry.actual_timestamp,
        flowrate_set: entry.flowrate_set,
        acid_dosage_ok: entry.acid_dosage_ok,
        he_temp_c: entry.he_temp_c,
        earth_dosage_ok: entry.earth_dosage_ok,
        bleacher_level: entry.bleacher_level,
        vacuum_mmhg: entry.vacuum_mmhg,
        niagara_filter: entry.niagara_filter,
        filter_change_time: entry.filter_change_time,
        ffa_pct: entry.ffa_pct,
        colour_r: entry.colour_r,
        colour_y: entry.colour_y,
        remarks: entry.remarks,
        out_of_spec: JSON.stringify(entry.out_of_spec || []),
        entered_by: entry.entered_by,
        entered_by_name: entry.entered_by_name,
        entered_at: entry.entered_at,
        is_saved: entry.is_saved,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("InsForge entry sync error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync entry to InsForge:", err);
    return { success: false, error: err.message };
  }
}

// 3. Supervisor Audit Events
export async function syncSupervisorEventToInsForge(event: SupervisorUpdateEvent): Promise<{ success: boolean; error?: string }> {
  if (!isInsForgeConfigured || !insforge) {
    return { success: true };
  }

  try {
    const { error } = await insforge.database
      .from("supervisor_events")
      .upsert({
        id: event.id,
        timestamp: event.timestamp,
        source: event.source,
        title: event.title,
        description: event.description,
        severity: event.severity,
        author_name: event.author_name,
        author_role: event.author_role,
        shift: event.shift,
        slot_time: event.slot_time,
        lot_no: event.lot_no,
        requires_acknowledgment: event.requires_acknowledgment,
        acknowledged: event.acknowledged,
        acknowledged_by: event.acknowledged_by,
        acknowledged_at: event.acknowledged_at,
      });

    if (error) {
      console.warn("InsForge event sync error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to sync event to InsForge:", err);
    return { success: false, error: err.message };
  }
}
