import { createClient } from "@insforge/sdk";

const insforgeUrl = 
  process.env.NEXT_PUBLIC_INSFORGE_URL || 
  "https://s9sdr5z9.ap-southeast.insforge.app";

const insforgeAnonKey = 
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 
  "anon_8a8266a62ddbca351ab90c7e19af966da6db83b089ea9b08be6bdad92bd14a1c";

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
