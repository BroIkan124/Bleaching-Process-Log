import { createClient } from "@insforge/sdk";

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || "";
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export const isInsForgeConfigured = Boolean(
  insforgeUrl && 
  insforgeAnonKey && 
  !insforgeUrl.includes("your-project")
);

// Initialize client if credentials exist, otherwise return null
export const insforge = isInsForgeConfigured
  ? createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey,
    })
  : null;
