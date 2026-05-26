"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Origen } from "@/lib/types";

const ORIGENES: Origen[] = ["formulario", "referido", "linkedin", "whatsapp"];

export type CrearLeadInput = {
  nombre: string;
  origen: string;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function crearLead(
  input: CrearLeadInput,
): Promise<ActionResult<{ id: string }>> {
  const nombre = input.nombre?.trim();
  if (!nombre) return { ok: false, error: "Falta el nombre del lead" };
  if (nombre.length > 200) {
    return { ok: false, error: "El nombre es demasiado largo" };
  }
  if (!ORIGENES.includes(input.origen as Origen)) {
    return { ok: false, error: "Origen no válido" };
  }

  const supabase = await createClient();

  // Lead nuevo: sin responsable, sin valor — esos se completan después
  // desde la ficha. Schema obliga a valor_estimado y tipo_negocio, así que
  // arrancamos con defaults sensatos que el comercial ajusta.
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre,
      origen: input.origen,
      estado: "nuevo",
      valor_estimado: 0,
      tipo_negocio: "proyecto",
      temperatura: "cool",
      estado_oportunidad: "sin_asignar",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo crear el lead" };
  }

  revalidatePath("/");

  return { ok: true, data: { id: data.id as string } };
}
