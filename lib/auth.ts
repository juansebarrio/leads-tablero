/**
 * Abstracción del "usuario actual" del producto.
 *
 * Hoy (demo pública sin login): devuelve siempre Mariana López, el comercial
 * que está sembrado por `lib/seed.ts`.
 *
 * Cuando migremos a producción real con Supabase Auth, esta función va a leer
 * la sesión del usuario logueado. La idea es que ningún archivo de la app
 * importe "Mariana" ni se conecte directo a la tabla de comerciales: todo
 * pasa por acá.
 */

import { createClient } from "@/lib/supabase/server";
import type { Comercial } from "@/lib/types";

export type CurrentUser = {
  id: string;
  nombre: string;
  iniciales: string;
  email: string;
  avatar_gradient: string;
  rol: "comercial" | "admin";
};

const DEMO_EMAIL = "mariana@js80.studio";

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comerciales")
    .select("*")
    .eq("email", DEMO_EMAIL)
    .single<Comercial>();

  if (error || !data) {
    throw new Error(
      `Comercial demo no encontrado en la base (email=${DEMO_EMAIL}). ¿Corriste el seed?`,
    );
  }

  return {
    id: data.id,
    nombre: data.nombre,
    iniciales: data.iniciales,
    email: data.email,
    avatar_gradient: data.avatar_gradient,
    rol: "comercial",
  };
}

// Placeholder. Cuando sumemos multi-tenant, esto se va a derivar del usuario
// actual (organización a la que pertenece).
export async function getCurrentOrgId(): Promise<string> {
  return "demo-org";
}
