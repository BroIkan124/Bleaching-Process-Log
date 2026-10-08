import { SLOT_HOURS, SHIFTS } from "./constants";
import { getShiftForSlot } from "./utils";

/**
 * Converts a 24-hour clock hour (0 to 23) into the manufacturing slot index (0 to 23).
 * Manufacturing day starts at 0800 hrs:
 * - 08:00 -> Slot 0 (0800)
 * - 09:00 -> Slot 1 (0900)
 * - 15:00 -> Slot 7 (1500)
 * - 16:00 -> Slot 8 (1600)
 * - 23:00 -> Slot 15 (2300)
 * - 00:00 -> Slot 16 (2400)
 * - 07:00 -> Slot 23 (0700)
 */
export function getSlotIndexForHour(hour24: number): number {
  if (hour24 >= 8) {
    return hour24 - 8;
  } else {
    return hour24 + 16;
  }
}

/**
 * Converts a slot index (0 to 23) back into the 24-hour clock hour (0 to 23).
 */
export function getHourForSlotIndex(slotIndex: number): number {
  return (slotIndex + 8) % 24;
}

export type SlotAccessType = 'past_locked' | 'current_active' | 'future_locked';

export interface SlotAccessInfo {
  status: SlotAccessType;
  isEditable: boolean;
  canEdit: boolean;
  badgeText: string;
  badgeColor: string;
  reasonMessage: string;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export function getSlotTimeLabel(slotIndex: number): string {
  return SLOT_HOURS[slotIndex] || String(slotIndex);
}

/**
 * Evaluates whether an operator or user can access and edit a specific slot index.
 * Rule:
 * - When current hour is e.g. 0900 (slot 1):
 *   - Slot 0 (0800) is PAST_LOCKED (Window expired at 09:00, cannot be accessed/edited by operator).
 *   - Slot 1 (0900) is CURRENT_ACTIVE (Operator can key in parameters).
 *   - Slot 2..23 (1000..0700) is FUTURE_LOCKED (Cannot be accessed before the hour arrives).
 */
export function evaluateSlotAccess(
  slotIndex: number,
  activeCurrentSlotIndex: number,
  isSupervisorOverride: boolean = false,
  userRole?: string
): SlotAccessInfo {
  const isSuperUser = userRole === 'admin' || userRole === 'supervisor';

  // If supervisor has unlocked this slot or is authorized override
  if (isSupervisorOverride) {
    return {
      status: 'current_active',
      isEditable: true,
      canEdit: true,
      badgeText: 'SUPERVISOR OVERRIDE',
      badgeColor: 'emerald',
      reasonMessage: 'Akses dibuka kunci secara khas oleh kebenaran Penyelia (Supervisor Override).',
      isCurrent: slotIndex === activeCurrentSlotIndex,
      isPast: slotIndex < activeCurrentSlotIndex,
      isFuture: slotIndex > activeCurrentSlotIndex,
    };
  }

  // 1. Past Hour Slot (Expired)
  if (slotIndex < activeCurrentSlotIndex) {
    const slotHour = getHourForSlotIndex(slotIndex);
    const activeHour = getHourForSlotIndex(activeCurrentSlotIndex);
    const formattedSlot = `${String(slotHour).padStart(2, '0')}:00`;
    const formattedActive = `${String(activeHour).padStart(2, '0')}:00`;

    return {
      status: 'past_locked',
      isEditable: isSuperUser, // Supervisors can review or edit if needed
      canEdit: isSuperUser,
      badgeText: 'LOCKED (EXPIRED)',
      badgeColor: 'zinc',
      reasonMessage: `Tetingkap masa pengisian untuk slot ${formattedSlot} telah ditutup pada jam ${formattedActive}. Log ini kini dikunci bagi operator dan hanya boleh disemak (Read-Only).`,
      isCurrent: false,
      isPast: true,
      isFuture: false,
    };
  }

  // 2. Current Active Live Hour Slot
  if (slotIndex === activeCurrentSlotIndex) {
    const slotHour = getHourForSlotIndex(slotIndex);
    const formattedSlot = `${String(slotHour).padStart(2, '0')}:00`;

    return {
      status: 'current_active',
      isEditable: true,
      canEdit: true,
      badgeText: 'ACTIVE (OPEN)',
      badgeColor: 'amber',
      reasonMessage: `Slot jam ${formattedSlot} sedang aktif dalam tetingkap masa nyata. Operator dibenarkan untuk mengisi parameter proses sekarang.`,
      isCurrent: true,
      isPast: false,
      isFuture: false,
    };
  }

  // 3. Future Hour Slot (Upcoming)
  const slotHour = getHourForSlotIndex(slotIndex);
  const formattedSlot = `${String(slotHour).padStart(2, '0')}:00`;

  return {
    status: 'future_locked',
    isEditable: false,
    canEdit: false,
    badgeText: 'LOCKED (UPCOMING)',
    badgeColor: 'zinc',
    reasonMessage: `Slot jam ${formattedSlot} belum dibuka. Mengikut SOP kilang, parameter operasi masa hadapan tidak boleh dimasukkan sebelum waktu operasi tiba.`,
    isCurrent: false,
    isPast: false,
    isFuture: true,
  };
}

export interface RealtimeClockState {
  now: Date;
  hour24: number;
  minute: number;
  second: number;
  slotIndex: number;
  slotLabel: string;
  slotTimeLabel: string;
  shift: 1 | 2 | 3;
  shiftNumber: 1 | 2 | 3;
  shiftLabel: string;
  formattedTime: string;
  formattedDate: string;
  isSimulated: boolean;
}

/**
 * Returns complete real-time clock and slot calculations.
 * Supports simulating a specific hour for testing and live factory demonstrations.
 */
export function getRealtimeClockState(simulatedHour: number | null = null): RealtimeClockState {
  const now = new Date();
  const effectiveHour = simulatedHour !== null ? simulatedHour : now.getHours();
  const effectiveMinute = simulatedHour !== null ? 0 : now.getMinutes();
  const effectiveSecond = simulatedHour !== null ? 0 : now.getSeconds();

  const slotIndex = getSlotIndexForHour(effectiveHour);
  const slotLabel = SLOT_HOURS[slotIndex];
  const shift = getShiftForSlot(slotIndex);
  const shiftLabel = shift === 1 ? 'Shift 1 (0800-1500)' : shift === 2 ? 'Shift 2 (1600-2300)' : 'Shift 3 (2400-0700)';

  const displayHours = effectiveHour % 12 || 12;
  const ampm = effectiveHour >= 12 ? 'PM' : 'AM';
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(displayHours)}:${pad(effectiveMinute)}:${pad(effectiveSecond)} ${ampm}`;
  const formattedDate = now.toLocaleDateString('ms-MY', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    now,
    hour24: effectiveHour,
    minute: effectiveMinute,
    second: effectiveSecond,
    slotIndex,
    slotLabel,
    slotTimeLabel: slotLabel,
    shift,
    shiftNumber: shift,
    shiftLabel,
    formattedTime,
    formattedDate,
    isSimulated: simulatedHour !== null,
  };
}

