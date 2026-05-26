"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Estado, Origen } from "@/lib/types";

const ORIGENES: Origen[] = ["formulario", "referido", "linkedin", "whatsapp"];
const ESTADOS: Estado[] = [
  "nuevo",
  "conversacion",
  "propuesta",
  "cierre",
  "ganado",
];

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

export type CambiarEstadoInput = {
  leadId: string;
  from: string;
  to: string;
};

// Mueve un lead a un estado nuevo (drag & drop del kanban).
// Persiste el cambio en leads.estado + un registro en contactos con
// canal='cambio_estado' y metadata={ from, to } para tener historial.
export async function cambiarEstado(
  input: CambiarEstadoInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (!ESTADOS.includes(input.from as Estado)) {
    return { ok: false, error: `Estado origen inválido: ${input.from}` };
  }
  if (!ESTADOS.includes(input.to as Estado)) {
    return { ok: false, error: `Estado destino inválido: ${input.to}` };
  }
  if (input.from === input.to) {
    // No-op silencioso: el drag terminó en la misma columna.
    return { ok: true, data: undefined };
  }

  const supabase = await createClient();

  // 1) Update del estado.
  const { error: errLead } = await supabase
    .from("leads")
    .update({ estado: input.to })
    .eq("id", input.leadId);
  if (errLead) return { ok: false, error: errLead.message };

  // 2) Registro en el historial. Si falla, el cambio de estado ya quedó —
  //    aceptamos el riesgo en la demo (no hay transacciones cross-table en
  //    el SDK; si se vuelve crítico, lo movemos a una function PL/pgSQL).
  const { error: errContacto } = await supabase.from("contactos").insert({
    lead_id: input.leadId,
    fecha: new Date().toISOString(),
    canal: "cambio_estado",
    nota: `De ${input.from} a ${input.to}`,
    metadata: { from: input.from, to: input.to },
  });
  if (errContacto) {
    // No rollback — el estado nuevo ya está. Log y seguir.
    console.warn("[cambiarEstado] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath(`/lead/${input.leadId}`);

  return { ok: true, data: undefined };
}
