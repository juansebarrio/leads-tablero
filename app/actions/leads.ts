"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Estado, MotivoPerdida, Origen, TipoNegocio } from "@/lib/types";

// "No encontrado o sin acceso": el UPDATE matcheó 0 filas. Pasa cuando el
// lead no existe, ya está en otro estado, o pertenece a otra org. Devolvemos
// un error genérico para no leak info de cross-org.
const ERR_LEAD_NO_ACCESS = "Lead no encontrado o sin acceso";

const ORIGENES: Origen[] = ["formulario", "referido", "linkedin", "whatsapp"];
const ESTADOS: Estado[] = [
  "nuevo",
  "conversacion",
  "propuesta",
  "cierre",
  "ganado",
  "perdido",
];
const TIPOS_NEGOCIO: TipoNegocio[] = ["recurrente", "proyecto"];
const MOTIVOS_PERDIDA: MotivoPerdida[] = [
  "precio",
  "timing",
  "competencia",
  "no_respondio",
  "cambio_necesidad",
  "otro",
];

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function revalidateLead(leadId: string) {
  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/equipo");
  revalidatePath("/cerrados");
  revalidatePath(`/lead/${leadId}`);
}

// ────────────────────────────────────────────────────────────────
// crearLead
// ────────────────────────────────────────────────────────────────

export type CrearLeadInput = {
  nombre: string;
  origen: string;
};

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

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organizacion_id: user.organizacion_id,
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

// ────────────────────────────────────────────────────────────────
// cambiarEstado (drag & drop del kanban)
// ────────────────────────────────────────────────────────────────

export type CambiarEstadoInput = {
  leadId: string;
  from: string;
  to: string;
};

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
  if (input.from === input.to) return { ok: true, data: undefined };

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: leadUpdated, error: errLead } = await supabase
    .from("leads")
    .update({ estado: input.to })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");
  if (errLead) return { ok: false, error: errLead.message };
  if (!leadUpdated || leadUpdated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  const { error: errContacto } = await supabase.from("contactos").insert({
    organizacion_id: user.organizacion_id,
    lead_id: input.leadId,
    fecha: new Date().toISOString(),
    canal: "cambio_estado",
    nota: `De ${input.from} a ${input.to}`,
    metadata: { from: input.from, to: input.to },
  });
  if (errContacto) {
    console.warn("[cambiarEstado] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}

// ────────────────────────────────────────────────────────────────
// actualizarLead — drawer "Editar lead"
// ────────────────────────────────────────────────────────────────

export type ActualizarLeadInput = {
  leadId: string;
  nombre: string;
  origen: string;
  origen_detalle: string | null;
  valor_estimado: number;
  tipo_negocio: string;
  meses_compromiso: number | null;
  proximo_paso: string | null;
  proximo_paso_fecha: string | null;
};

export async function actualizarLead(
  input: ActualizarLeadInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  const nombre = input.nombre?.trim();
  if (!nombre) return { ok: false, error: "El nombre no puede estar vacío" };
  if (nombre.length > 200) return { ok: false, error: "El nombre es demasiado largo" };
  if (!ORIGENES.includes(input.origen as Origen)) {
    return { ok: false, error: "Origen no válido" };
  }
  if (!TIPOS_NEGOCIO.includes(input.tipo_negocio as TipoNegocio)) {
    return { ok: false, error: "Tipo de negocio no válido" };
  }
  if (!Number.isFinite(input.valor_estimado) || input.valor_estimado < 0) {
    return { ok: false, error: "El valor estimado debe ser un número ≥ 0" };
  }
  if (input.tipo_negocio === "recurrente") {
    if (
      input.meses_compromiso == null ||
      !Number.isFinite(input.meses_compromiso) ||
      input.meses_compromiso < 1
    ) {
      return { ok: false, error: "Indicá los meses de compromiso (≥1)" };
    }
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("leads")
    .update({
      nombre,
      origen: input.origen,
      origen_detalle: input.origen_detalle?.trim() || null,
      valor_estimado: input.valor_estimado,
      tipo_negocio: input.tipo_negocio,
      meses_compromiso:
        input.tipo_negocio === "recurrente" ? input.meses_compromiso : null,
      proximo_paso: input.proximo_paso?.trim() || null,
      proximo_paso_fecha: input.proximo_paso_fecha || null,
    })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}

// ────────────────────────────────────────────────────────────────
// reasignarLead — drawer "Reasignar"
// ────────────────────────────────────────────────────────────────

export type ReasignarLeadInput = {
  leadId: string;
  comercialId: string; // nuevo responsable
  comercialNombre: string; // para la nota del historial
  comercialAnteriorNombre: string | null;
  motivo?: string | null;
};

export async function reasignarLead(
  input: ReasignarLeadInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (!input.comercialId) return { ok: false, error: "Elegí un responsable" };

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: leadUpdated, error: errLead } = await supabase
    .from("leads")
    .update({ responsable_id: input.comercialId })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");
  if (errLead) return { ok: false, error: errLead.message };
  if (!leadUpdated || leadUpdated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  // Registro del cambio en el historial. Canal interno: no impacta
  // fecha_ultimo_contacto.
  const desde = input.comercialAnteriorNombre ?? "sin asignar";
  const nota = input.motivo?.trim()
    ? `Reasignado de ${desde} a ${input.comercialNombre}. ${input.motivo.trim()}`
    : `Reasignado de ${desde} a ${input.comercialNombre}`;
  const { error: errContacto } = await supabase.from("contactos").insert({
    organizacion_id: user.organizacion_id,
    lead_id: input.leadId,
    fecha: new Date().toISOString(),
    canal: "reasignacion",
    nota,
    metadata: {
      from_id: null,
      to_id: input.comercialId,
      from_nombre: input.comercialAnteriorNombre,
      to_nombre: input.comercialNombre,
    },
  });
  if (errContacto) {
    console.warn("[reasignarLead] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}

// ────────────────────────────────────────────────────────────────
// marcarPerdido — drawer "Marcar como perdido"
// ────────────────────────────────────────────────────────────────

export type MarcarPerdidoInput = {
  leadId: string;
  estadoActual: string;
  motivo: string;
  detalle: string | null;
};

export async function marcarPerdido(
  input: MarcarPerdidoInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (!MOTIVOS_PERDIDA.includes(input.motivo as MotivoPerdida)) {
    return { ok: false, error: "Elegí un motivo de pérdida" };
  }
  if (input.estadoActual === "perdido") {
    return { ok: false, error: "El lead ya está marcado como perdido" };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const fechaCierre = new Date().toISOString();

  const { data: leadUpdated, error: errLead } = await supabase
    .from("leads")
    .update({
      estado: "perdido",
      motivo_perdida: input.motivo,
      detalle_perdida: input.detalle?.trim() || null,
      fecha_cierre: fechaCierre,
      estado_oportunidad: null,
    })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");
  if (errLead) return { ok: false, error: errLead.message };
  if (!leadUpdated || leadUpdated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  const { error: errContacto } = await supabase.from("contactos").insert({
    organizacion_id: user.organizacion_id,
    lead_id: input.leadId,
    fecha: fechaCierre,
    canal: "cambio_estado",
    nota: `De ${input.estadoActual} a perdido (${input.motivo})`,
    metadata: {
      from: input.estadoActual,
      to: "perdido",
      motivo: input.motivo,
    },
  });
  if (errContacto) {
    console.warn("[marcarPerdido] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}

// ────────────────────────────────────────────────────────────────
// confirmarGanado — drawer "Confirmar ganado"
// ────────────────────────────────────────────────────────────────

export type ConfirmarGanadoInput = {
  leadId: string;
  estadoActual: string;
  valor_final: number;
  fecha_cierre: string; // ISO date YYYY-MM-DD del input
  comentario: string | null;
};

export async function confirmarGanado(
  input: ConfirmarGanadoInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (!Number.isFinite(input.valor_final) || input.valor_final <= 0) {
    return { ok: false, error: "Indicá el valor final del cierre (>0)" };
  }
  if (!input.fecha_cierre) {
    return { ok: false, error: "Falta la fecha de cierre" };
  }
  if (input.estadoActual === "ganado") {
    return { ok: false, error: "El lead ya está marcado como ganado" };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  // Tomamos la fecha del input + hora actual para tener un timestamptz estable
  // en ART (sino el ISO arranca a las 00:00 UTC y se ve como "ayer" en AR).
  const fechaIso = new Date(`${input.fecha_cierre}T12:00:00`).toISOString();

  const { data: leadUpdated, error: errLead } = await supabase
    .from("leads")
    .update({
      estado: "ganado",
      valor_final: input.valor_final,
      valor_estimado: input.valor_final, // sincronizamos para que el ranking real cuente con el cerrado
      fecha_cierre: fechaIso,
      comentario_cierre: input.comentario?.trim() || null,
      estado_oportunidad: null,
    })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");
  if (errLead) return { ok: false, error: errLead.message };
  if (!leadUpdated || leadUpdated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  const { error: errContacto } = await supabase.from("contactos").insert({
    organizacion_id: user.organizacion_id,
    lead_id: input.leadId,
    fecha: fechaIso,
    canal: "cambio_estado",
    nota: `De ${input.estadoActual} a ganado`,
    metadata: { from: input.estadoActual, to: "ganado" },
  });
  if (errContacto) {
    console.warn("[confirmarGanado] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}

// ────────────────────────────────────────────────────────────────
// reabrirLead — quitar estado terminal y volver al pipeline
// ────────────────────────────────────────────────────────────────

export type ReabrirLeadInput = {
  leadId: string;
  estadoActual: string;
};

export async function reabrirLead(
  input: ReabrirLeadInput,
): Promise<ActionResult> {
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (input.estadoActual !== "ganado" && input.estadoActual !== "perdido") {
    return { ok: false, error: "Solo se pueden reabrir leads ganados o perdidos" };
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  // Volvemos a "conversacion" — un lead reabierto necesita seguimiento real,
  // no arranca de cero ni vuelve directo a la etapa terminal previa.
  const { data: leadUpdated, error: errLead } = await supabase
    .from("leads")
    .update({
      estado: "conversacion",
      motivo_perdida: null,
      detalle_perdida: null,
      fecha_cierre: null,
      comentario_cierre: null,
      valor_final: null,
      estado_oportunidad: "por_reactivar",
    })
    .eq("organizacion_id", user.organizacion_id)
    .eq("id", input.leadId)
    .select("id");
  if (errLead) return { ok: false, error: errLead.message };
  if (!leadUpdated || leadUpdated.length === 0) {
    return { ok: false, error: ERR_LEAD_NO_ACCESS };
  }

  const { error: errContacto } = await supabase.from("contactos").insert({
    organizacion_id: user.organizacion_id,
    lead_id: input.leadId,
    fecha: new Date().toISOString(),
    canal: "cambio_estado",
    nota: `Reabierto desde ${input.estadoActual} a conversacion`,
    metadata: { from: input.estadoActual, to: "conversacion", reabierto: true },
  });
  if (errContacto) {
    console.warn("[reabrirLead] update OK pero insert contacto falló:", errContacto.message);
  }

  revalidateLead(input.leadId);
  return { ok: true, data: undefined };
}
