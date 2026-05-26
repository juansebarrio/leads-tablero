// Queries del tablero. Todas server-side: usan el cliente de
// @/lib/supabase/server y se ejecutan en Server Components o Route Handlers.

import { createClient } from "@/lib/supabase/server";
import type {
  Contacto,
  EventoAgenda,
  Lead,
  LeadDetalle,
  LeadFrio,
  OportunidadDia,
  PatronIa,
  PipelineEstado,
} from "@/lib/types";

export async function getPipelineResumen(): Promise<PipelineEstado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_pipeline_resumen")
    .select("*");
  if (error) throw error;
  return (data ?? []) as PipelineEstado[];
}

export async function getLeadsFrios(): Promise<LeadFrio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_leads_frios")
    .select("*");
  if (error) throw error;
  return (data ?? []) as LeadFrio[];
}

export async function getOportunidadesDia(): Promise<OportunidadDia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_oportunidades_dia")
    .select("*");
  if (error) throw error;
  return (data ?? []) as OportunidadDia[];
}

// Eventos de agenda del día corriente, ordenados por hora.
export async function getAgendaDia(): Promise<EventoAgenda[]> {
  const supabase = await createClient();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const { data, error } = await supabase
    .from("agenda")
    .select("*")
    .gte("fecha", hoy.toISOString())
    .lt("fecha", manana.toISOString())
    .order("fecha", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoAgenda[];
}

// Ficha de un lead con su comercial, historial de contactos y agenda asociada.
// Las 3 consultas corren en paralelo.
export async function getLeadConDetalle(
  id: string,
): Promise<LeadDetalle | null> {
  const supabase = await createClient();
  const [leadRes, contactosRes, agendaRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*, comerciales(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("contactos")
      .select("*")
      .eq("lead_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("agenda")
      .select("*")
      .eq("lead_id", id)
      .order("fecha", { ascending: true }),
  ]);

  if (leadRes.error) throw leadRes.error;
  if (!leadRes.data) return null;

  const { comerciales, ...lead } = leadRes.data as Lead & {
    comerciales: LeadDetalle["comerciales"];
  };
  return {
    ...lead,
    comerciales: comerciales ?? null,
    contactos: (contactosRes.data ?? []) as Contacto[],
    agendaRelacionada: (agendaRes.data ?? []) as EventoAgenda[],
  };
}

// El primer patrón detectado (la vista devuelve 0 o 1 fila gracias al HAVING).
export async function getPrimerPatronIa(): Promise<PatronIa | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_patrones_ia")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PatronIa | null;
}
