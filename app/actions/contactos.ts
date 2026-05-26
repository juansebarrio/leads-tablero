"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CanalContacto } from "@/lib/types";

const CANALES: CanalContacto[] = [
  "mail",
  "llamado",
  "whatsapp",
  "reunion",
  "linkedin",
];

export type RegistrarContactoInput = {
  leadId: string;
  canal: string;
  fecha: string; // ISO string
  nota: string;
  proximoPaso?: string | null;
  proximoPasoFecha?: string | null; // ISO string
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function registrarContacto(
  input: RegistrarContactoInput,
): Promise<ActionResult> {
  // Validación.
  if (!input.leadId) return { ok: false, error: "Falta el lead" };
  if (!CANALES.includes(input.canal as CanalContacto)) {
    return { ok: false, error: "Canal no válido" };
  }
  const nota = input.nota?.trim();
  if (!nota) return { ok: false, error: "Contame qué pasó en la nota" };
  if (nota.length > 2000) {
    return { ok: false, error: "La nota es demasiado larga" };
  }
  if (Number.isNaN(new Date(input.fecha).getTime())) {
    return { ok: false, error: "Fecha de contacto inválida" };
  }

  const supabase = await createClient();

  // 1) Insert del contacto. El trigger de DB actualiza fecha_ultimo_contacto.
  const { error: errContacto } = await supabase.from("contactos").insert({
    lead_id: input.leadId,
    fecha: input.fecha,
    canal: input.canal,
    nota,
  });
  if (errContacto) return { ok: false, error: errContacto.message };

  // 2) Si vino próximo paso, actualizamos el lead.
  const paso = input.proximoPaso?.trim();
  const pasoFecha = input.proximoPasoFecha?.trim();
  if (paso || pasoFecha) {
    const { error: errLead } = await supabase
      .from("leads")
      .update({
        proximo_paso: paso || null,
        proximo_paso_fecha: pasoFecha || null,
      })
      .eq("id", input.leadId);
    if (errLead) return { ok: false, error: errLead.message };
  }

  // Re-render del tablero y de la ficha del lead.
  revalidatePath("/");
  revalidatePath(`/lead/${input.leadId}`);

  return { ok: true, data: undefined };
}
