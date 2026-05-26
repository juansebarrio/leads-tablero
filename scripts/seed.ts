/**
 * CLI wrapper de lib/seed.ts.
 * Lee .env.local (fallback a .env) y delega a `resetAndSeed()`.
 *
 * Usar: `pnpm db:seed`
 */

import * as dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

// Import *después* de dotenv: lib/supabase/service.ts valida env vars cuando
// se llama la función, no al cargar el módulo, así que el orden no es crítico —
// pero lo dejamos explícito para que sea evidente.
import { resetAndSeed } from "../lib/seed";

async function main() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  console.log(`→ Conectando a ${url ?? "(sin URL)"}`);

  const result = await resetAndSeed();

  console.log("\n✓ Seed completo.");
  console.log(`  ${result.comerciales} comerciales`);
  console.log(`  ${result.leads} leads`);
  console.log(`  ${result.contactos} contactos`);
  console.log(`  ${result.agenda} eventos de agenda`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
