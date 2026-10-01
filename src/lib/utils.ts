import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PROCESS_SPECS, SLOT_HOURS } from "./constants";
import { LogEntry, OutOfSpecFlag } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * PRD v0.3 Deterministic No-Branching Timestamp Derivation:
 * timestamp = sheet_date + 08:00 + (slot_index * 1 hour)
 */
export function calculateSlotTimestamp(sheetDateStr: string, slotIndex: number): string {
  // Parse sheet date (YYYY-MM-DD)
  const [year, month, day] = sheetDateStr.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0)); // 08:00 UTC
  const slotDate = new Date(baseDate.getTime() + slotIndex * 60 * 60 * 1000);
  return slotDate.toISOString();
}

/**
 * Returns shift (1, 2, or 3) for a given slot_index (0..23)
 */
export function getShiftForSlot(slotIndex: number): 1 | 2 | 3 {
  if (slotIndex >= 0 && slotIndex <= 7) return 1;
  if (slotIndex >= 8 && slotIndex <= 15) return 2;
  return 3;
}

/**
 * Validates hourly reading values against PRD process specifications.
 * Failing values are NOT rejected, but flagged in out_of_spec.
 */
export function validateReadingSpecs(entry: Partial<LogEntry>): OutOfSpecFlag[] {
  const flags: OutOfSpecFlag[] = [];

  // Check HE Temp (70.0 to 115.0 °C)
  if (entry.he_temp_c !== null && entry.he_temp_c !== undefined && entry.he_temp_c !== ('' as any)) {
    const temp = Number(entry.he_temp_c);
    if (!isNaN(temp)) {
      if (temp < PROCESS_SPECS.he_temp.min || temp > PROCESS_SPECS.he_temp.max) {
        flags.push({
          field: 'he_temp_c',
          value: temp,
          rule: `70.0 - 115.0 °C`,
          message: `HE Temp ${temp}°C is out of allowable limit (70.0–115.0°C)`,
        });
      }
    }
  }

  // Check Vacuum (>= 600.0 mmHg)
  if (entry.vacuum_mmhg !== null && entry.vacuum_mmhg !== undefined && entry.vacuum_mmhg !== ('' as any)) {
    const vac = Number(entry.vacuum_mmhg);
    if (!isNaN(vac)) {
      if (vac < PROCESS_SPECS.vacuum.min) {
        flags.push({
          field: 'vacuum_mmhg',
          value: vac,
          rule: `≥ 600.0 mmHg`,
          message: `Vacuum ${vac} mmHg is below minimum threshold (≥600.0 mmHg)`,
        });
      }
    }
  }

  return flags;
}

/**
 * Creates 24 empty log entry slots for a new sheet
 */
export function generateInitialEntries(sheetId: string, sheetDate: string): LogEntry[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `entry-${sheetId}-${index}`,
    sheet_id: sheetId,
    slot_index: index,
    time_label: SLOT_HOURS[index],
    shift: getShiftForSlot(index),
    actual_timestamp: calculateSlotTimestamp(sheetDate, index),
    flowrate_set: null,
    acid_dosage_ok: false,
    he_temp_c: null,
    earth_dosage_ok: false,
    bleacher_level: null,
    vacuum_mmhg: null,
    niagara_filter: null,
    filter_change_time: null,
    ffa_pct: null,
    colour_r: null,
    colour_y: null,
    remarks: '',
    out_of_spec: [],
    entered_by: null,
    entered_at: null,
    is_saved: false,
  }));
}
