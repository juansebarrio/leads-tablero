/**
 * Abstracción del "usuario actual" del producto.
 *
 * Tiene dos modos según NEXT_PUBLIC_APP_MODE:
 *
 *  - demo (default, leads.js80.studio): devuelve siempre Mariana López.
 *    Lookup runtime por email contra `comerciales` — los IDs no son
 *    estables entre `db:reset` (gen_random_uuid), por eso no podemos
 *    hardcodearlos.
 *
 *  - production (futuro crm.js80.studio): lee la sesión real de
 *    Supabase Auth y joinea contra `usuarios_organizaciones`. Sprint 3
 *    deja el branch escrito pero no se activa todavía (no hay flujo
 *    de login ni middleware aún — eso es Sprint 4 / 5).
 *
 * Convención: ningún archivo de la app importa "Mariana" ni habla
 * directo con `comerciales` para el usuario actual — todo pasa por acá.
 */

import { cache } from "react";
import { DEMO_ORG_ID, isDemoMode } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Comercial } from "@/lib/types";

export type CurrentUser = {
  // En demo: id del comercial (igual que comercial_id).
  // En production: id de auth.users — distinto de comercial_id (puede ser null
  // hasta Sprint 8 que vincule auth.users ↔ comerciales).
  id: string;
  email: string;
  nombre: string;
  iniciales: string;
  avatar_gradient: string;
  organizacion_id: string;
  organizacion_slug: string;
  rol: "owner" | "admin" | "comercial" | "lector";
  comercial_id: string | null;
};

const DEMO_EMAIL = "mariana@js80.studio";

// Pool de gradients para usuarios production sin avatar asignado. Sprint 8
// va a hidratar el avatar real desde la membership; hasta entonces, se
// elige determinísticamente por hash del email.
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #8B6FFF, #5DC7E0)",
  "linear-gradient(135deg, #FF8AA0, #FFB088)",
  "linear-gradient(135deg, #6BCB77, #4D96FF)",
  "linear-gradient(135deg, #F9A826, #FFE066)",
];

function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "??";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function gradientPorEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}

// Envuelta en React.cache() para que el lookup por email (demo) o el
// getUser() + membership join (production) se haga UNA sola vez por
// request. Sin esto, cada page que llama getCurrentUser() + cada query
// que después llama getCurrentOrgId() multiplicaba los round-trips.
// Fuera de un render de Server Component (CLI puro, ej. scripts/seed.ts),
// React.cache es no-op — no rompe, simplemente no memoiza.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // ─── MODO DEMO: lookup runtime de Mariana (mismo comportamiento de Sprint 0) ───
  if (isDemoMode) {
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
      email: data.email,
      nombre: data.nombre,
      iniciales: data.iniciales,
      avatar_gradient: data.avatar_gradient,
      organizacion_id: DEMO_ORG_ID,
      organizacion_slug: "demo",
      rol: "comercial",
      comercial_id: data.id,
    };
  }

  // ─── MODO PRODUCTION: sesión real de Supabase Auth ───
  // OJO: Sprint 3 deja este branch escrito pero el flujo no está activo
  // todavía. /login, /auth/callback y el middleware llegan en Sprint 4 y 5.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("usuarios_organizaciones")
    .select(
      `
        rol,
        organizacion:organizaciones (id, slug, nombre)
      `,
    )
    .eq("usuario_id", user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    throw new Error("Usuario sin organización asignada");
  }

  // Cast a través de unknown para evitar el ruido del tipo inferido del join
  // de Supabase (el cliente no sabe si organizacion es objeto o array).
  const org = (membership as unknown as {
    rol: CurrentUser["rol"];
    organizacion: { id: string; slug: string; nombre: string };
  });

  const nombre =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email!.split("@")[0];

  // Sprint 8.4: hidratamos comercial_id buscando un comercial vinculado
  // por usuario_id. Si el auth user no tiene comercial linkeado todavía
  // (caso transitorio durante el onboarding manual de Sprint 8.2/8.3),
  // queda null — la app sigue funcionando, pero las acciones que escriben
  // FKs a comerciales (ej. patrones.resuelto_por) van a perder
  // trazabilidad hasta que se complete la vinculación.
  const { data: comercial } = await supabase
    .from("comerciales")
    .select("id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email!,
    nombre,
    iniciales: inicialesDe(nombre),
    avatar_gradient: gradientPorEmail(user.email!),
    organizacion_id: org.organizacion.id,
    organizacion_slug: org.organizacion.slug,
    rol: org.rol,
    comercial_id: comercial?.id ?? null,
  };
});

// Helper público — devuelve el org id del usuario actual. Apoya en
// getCurrentUser(), así que el cache aplica acá también: si una request
// llama getCurrentUser() y después getCurrentOrgId(), es un solo round-trip.
export async function getCurrentOrgId(): Promise<string> {
  const user = await getCurrentUser();
  return user.organizacion_id;
}
