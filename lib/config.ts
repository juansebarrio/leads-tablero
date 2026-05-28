// Modo de la app — flags derivados de NEXT_PUBLIC_APP_MODE.
//
// Sprint 3: la variable existe pero el deploy de prod sigue siendo 'demo'.
// Sprint 9 levanta un segundo deploy con NEXT_PUBLIC_APP_MODE=production
// apuntado a crm.js80.studio.

export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || "demo") as
  | "demo"
  | "production";

export const isDemoMode = APP_MODE === "demo";
export const isProductionMode = APP_MODE === "production";

export const config = {
  enableDailyReset: isDemoMode,
  requireAuth: isProductionMode,
  showDemoBanner: isDemoMode,
  publicWrites: isDemoMode,
  appName: isDemoMode ? "Tablero de leads" : "CRM JS80",
};

// UUID de la org demo (sembrado en migration de Sprint 1).
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
