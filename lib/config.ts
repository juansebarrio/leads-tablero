// Modo de la app — flags derivados de NEXT_PUBLIC_APP_MODE.
//
// Sprint 3: la variable existe pero el deploy de prod sigue siendo 'demo'.
// Sprint 9 levanta un segundo deploy con NEXT_PUBLIC_APP_MODE=production
// apuntado a crm.js80.studio.

// APP_MODE / isDemoMode / isProductionMode: tienen fallback a "demo" para
// que el dev local sin .env.local arranque sin romper. Útiles para branches
// puramente cosméticos (ej. nombre de la app, copy).
export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE || "demo") as
  | "demo"
  | "production";

export const isDemoMode = APP_MODE === "demo";
export const isProductionMode = APP_MODE === "production";

// Para los flags fail-closed (reset, banner) re-derivamos desde el env crudo,
// SIN fallback. Si el env está unset o tiene un valor raro ("prod", typo,
// etc.), tratamos como NO-demo y desactivamos el feature. Es lo opuesto a
// `isDemoMode` arriba — acá preferimos "se queda apagado" antes que "se
// prende por accidente en prod".
const isExplicitlyDemo = process.env.NEXT_PUBLIC_APP_MODE === "demo";

export const config = {
  enableDailyReset: isExplicitlyDemo, // fail-closed
  requireAuth: isProductionMode,
  showDemoBanner: isExplicitlyDemo, // fail-closed
  publicWrites: isDemoMode,
  appName: isDemoMode ? "Tablero de leads" : "CRM JS80",
};

// UUID de la org demo (sembrado en migration de Sprint 1).
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
