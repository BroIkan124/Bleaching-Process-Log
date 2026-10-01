export const FORM_META = {
  form_no: 'RF-FR-003',
  form_rev: '03',
  title: 'FS/WS Auto Bleaching Process Log Sheet',
  department: 'Refinery Department',
  company: 'Lam Soon Edible Oils Sdn Bhd',
};

// Process Control Limits (P0 Real-time Validation)
export const PROCESS_SPECS = {
  he_temp: {
    min: 70.0,
    max: 115.0,
    unit: '°C',
    label: 'HE Temp',
    error_message: 'HE Temp must be between 70.0°C and 115.0°C',
  },
  vacuum: {
    min: 600.0,
    unit: 'mmHg',
    label: 'Bleacher Vacuum',
    error_message: 'Bleacher Vacuum must be at least 600.0 mmHg',
  },
};

// 24 Hour Slots: 0800 to 0700 next day
export const SLOT_HOURS = [
  '0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500', // Shift 1 (slots 0-7)
  '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', // Shift 2 (slots 8-15)
  '2400', '0100', '0200', '0300', '0400', '0500', '0600', '0700', // Shift 3 (slots 16-23)
] as const;

export const NIAGARA_FILTERS = ['N60-1', 'N60-2', 'N60-3', 'N60-4'] as const;

export const BLEACHER_LEVELS = ['L', 'H'] as const;

export const SHIFTS = [
  { id: 1, name: '1st Shift', hours: '0800 - 1500', slots: [0, 1, 2, 3, 4, 5, 6, 7], tech_field: 'tech_s1' },
  { id: 2, name: '2nd Shift', hours: '1600 - 2300', slots: [8, 9, 10, 11, 12, 13, 14, 15], tech_field: 'tech_s2' },
  { id: 3, name: '3rd Shift', hours: '2400 - 0700', slots: [16, 17, 18, 19, 20, 21, 22, 23], tech_field: 'tech_s3' },
] as const;
