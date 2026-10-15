import { createClient } from "@insforge/sdk";

/**
 * MASTER SWITCH: Local Database vs Cloud BaaS
 * - Set to false to run 100% On-Premise Local Database (Air-Gapped / Isolated).
 * - When false, ZERO network requests are made to any cloud backend.
 * - All log sheets, QC reports, user management, and audit logs are persisted 100% locally.
 */
export const ENABLE_CLOUD_SYNC = false;

const insforgeUrl = 
  process.env.NEXT_PUBLIC_INSFORGE_URL || ""; // no hardcoded fallback: configure via env only

const insforgeAnonKey = 
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export const isInsForgeConfigured = Boolean(
  ENABLE_CLOUD_SYNC &&
  insforgeUrl && 
  insforgeAnonKey && 
  !insforgeUrl.includes("your-project")
);

// Initialize client if credentials exist and cloud sync is enabled, otherwise return null
export const insforge = isInsForgeConfigured
  ? createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey,
    })
  : null;
