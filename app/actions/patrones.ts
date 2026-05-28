"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function marcarPatronResuelto(
  patronId: string,
): Promise<ActionResult> {
  if (!patronId) return { ok: false, error: "Falta el patrón" };
  const user = await getCurrentUser();
  const supabase = await createClient();
  // Sprint 8.5: resuelto_por es FK a comerciales(id). En demo,
  // user.comercial_id es igual al user.id (mismo registro). En production,
  // si el auth user no tiene comercial vinculado, comercial_id queda null
  // — el marcador real de "resuelto" es resuelto_en, así que null acá solo
  // pierde trazabilidad pero no rompe la semántica del patrón.
  const { error } = await supabase
    .from("patrones")
    .update({
      resuelto_en: new Date().toISOString(),
      resuelto_por: user.comercial_id,
    })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", patronId)
    .is("resuelto_en", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/patrones");
  return { ok: true };
}

export async function reabrirPatron(patronId: string): Promise<ActionResult> {
  if (!patronId) return { ok: false, error: "Falta el patrón" };
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("patrones")
    .update({ resuelto_en: null, resuelto_por: null })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", patronId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/patrones");
  return { ok: true };
}
