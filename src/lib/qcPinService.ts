import { UserProfile } from "@/types";

export const DEFAULT_QC_PIN = "1234";

/**
 * Retrieve user's configured 4-digit QC sign-off PIN
 * Defaults to '1234' for all plant personnel if not yet customized
 */
export function getUserQcPin(userId: string): string {
  if (typeof window === "undefined") return DEFAULT_QC_PIN;
  try {
    const stored = localStorage.getItem(`nisshin_user_pin_${userId}`);
    return stored && /^\d{4}$/.test(stored) ? stored : DEFAULT_QC_PIN;
  } catch {
    return DEFAULT_QC_PIN;
  }
}

/**
 * Set and persist a new 4-digit QC sign-off PIN for a user
 */
export function setUserQcPin(userId: string, newPin: string): boolean {
  if (typeof window === "undefined") return false;
  if (!/^\d{4}$/.test(newPin)) return false;
  try {
    localStorage.setItem(`nisshin_user_pin_${userId}`, newPin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify whether an entered 4-digit PIN matches the user's stored PIN
 */
export function verifyUserQcPin(userId: string, inputPin: string): boolean {
  const activePin = getUserQcPin(userId);
  return inputPin.trim() === activePin;
}

/**
 * Fallback authentication: Verify account password
 */
export function verifyUserPassword(user: UserProfile, inputPassword: string): boolean {
  if (!inputPassword) return false;
  const input = inputPassword.trim();
  
  // Check localStorage password override first
  if (typeof window !== "undefined") {
    try {
      const storedPass = localStorage.getItem(`nisshin_auth_pass_${user.id}`);
      if (storedPass && input === storedPass) return true;
    } catch {}
  }

  // Fallback to the user's own profile password (or the default for accounts never given one).
  // No universal master passwords: they let any operator sign as any supervisor/QC.
  const expected = user.password || "password123";
  return input === expected;
}

