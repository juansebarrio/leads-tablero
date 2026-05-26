import { createBrowserClient } from "@supabase/ssr";

// Cliente para Client Components (realtime, mutaciones desde el browser).
// Si querés tipar las queries: `createBrowserClient<Database>(...)` una vez
// generado el `database.types.ts` con `pnpm db:types`.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
