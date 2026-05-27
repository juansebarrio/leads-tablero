// Queries del tablero. Todas server-side: usan el cliente de
// @/lib/supabase/server y se ejecutan en Server Components o Route Handlers.

import { createClient } from "@/lib/supabase/server";
import type {
  Comercial,
  ComercialConMetricas,
  Contacto,
  EquipoMetricas,
  EventoAgenda,
  FunnelData,
  Lead,
  LeadAfectado,
  LeadDetalle,
  LeadFrio,
  LeadKanban,
  OportunidadDia,
  Patron,
  PatronesStats,
  PatronIa,
  PatronTipo,
  PipelineEstado,
  TimingItem,
  TrendPoint,
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
      // Cambios de estado y reasignaciones son eventos internos del sistema.
      // Se guardan para auditoría pero no se muestran en la timeline visible.
      .not("canal", "in", "(cambio_estado,reasignacion)")
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

// Todos los leads para el kanban: lead + comercial + dias_en_estado.
// Ordenamos por fecha_creacion desc para que las cards más nuevas queden arriba
// dentro de cada columna.
export async function getLeadsParaKanban(): Promise<LeadKanban[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_leads_kanban")
    .select("*")
    .order("fecha_creacion", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadKanban[];
}

// Lista completa de comerciales (para el filtro del kanban).
export async function getComerciales(): Promise<Comercial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comerciales")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comercial[];
}

// Comerciales con métricas agregadas para la pantalla /equipo.
export async function getComercialesConMetricas(): Promise<
  ComercialConMetricas[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_comerciales_metricas")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ComercialConMetricas[];
}

// Sumas del equipo. Las calculamos en JS reusando getComercialesConMetricas
// para evitar otra view dedicada (y mantener consistencia con los detalles).
// Defensivo contra valores null/undefined o string-numéricos de Supabase.
export async function getEquipoMetricas(): Promise<EquipoMetricas> {
  const comerciales = await getComercialesConMetricas();
  const sum = (k: keyof ComercialConMetricas) =>
    comerciales.reduce((acc, c) => {
      const v = Number(c[k]);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);

  // Ratio de cierre global: promedio simple. No es lo mismo que recalcularlo
  // a nivel agregado, pero alcanza para la card global del equipo.
  const ratioCierre =
    comerciales.length === 0
      ? 0
      : sum("ratio_cierre") / comerciales.length;

  return {
    leads_activos: sum("leads_activos"),
    pipeline_valor: sum("pipeline_valor"),
    ganados_mes_cantidad: sum("ganados_mes_cantidad"),
    ganados_mes_valor: sum("ganados_mes_valor"),
    ratio_cierre: ratioCierre,
  };
}

// Funnel del mes especificado (0 = mes actual, 1 = mes anterior, etc.).
export async function getFunnelData(mesesAtras: number): Promise<FunnelData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("funnel_para_mes", {
    p_meses_atras: mesesAtras,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    nuevos_total: Number(row?.nuevos_total) || 0,
    conversacion_acum: Number(row?.conversacion_acum) || 0,
    propuesta_acum: Number(row?.propuesta_acum) || 0,
    cierre_acum: Number(row?.cierre_acum) || 0,
    ganados: Number(row?.ganados) || 0,
    valor_ganado: Number(row?.valor_ganado) || 0,
  };
}

// Tiempo promedio por transición de estado. Devuelve 1 fila por transición.
export async function getTimingData(): Promise<TimingItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_tiempo_por_etapa")
    .select("*");
  if (error) throw error;
  return (data ?? []) as TimingItem[];
}

// Tendencia mensual: leads creados y ganados por mes. Devuelve los últimos
// N meses (default 3) en orden cronológico ascendente.
export async function getTrendData(meses = 3): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_trend_mensual")
    .select("*")
    .lte("meses_atras", meses - 1)
    .order("mes", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrendPoint[];
}

// Compat con AIInsight (banner del tablero): busca el primer patrón
// operativo activo de tipo "leads_sin_asignar" y lo mapea a la shape
// vieja PatronIa. Si no existe, el banner no se muestra.
export async function getPrimerPatronIa(): Promise<PatronIa | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patrones")
    .select("metadata, detectado_en, leads_afectados")
    .like("clave_unica", "operativo:leads_sin_asignar:%")
    .is("resuelto_en", null)
    .order("detectado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const meta = (data.metadata ?? {}) as {
    desde?: string;
    hasta?: string;
  };
  const ids = (data.leads_afectados ?? []) as string[];
  return {
    patron: "asignacion_pendiente",
    cantidad: ids.length,
    lead_ids: ids,
    desde: meta.desde ?? (data.detectado_en as string),
    hasta: meta.hasta ?? (data.detectado_en as string),
  };
}

// Pantalla /patrones · listado completo, activos primero (recientes arriba),
// resueltos al final.
export async function getPatrones(): Promise<Patron[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patrones")
    .select("*, comerciales:resuelto_por(nombre)")
    .order("resuelto_en", { ascending: true, nullsFirst: true })
    .order("detectado_en", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { comerciales, ...rest } = row as Patron & {
      comerciales: { nombre: string } | null;
    };
    return {
      ...rest,
      resuelto_por_nombre: comerciales?.nombre ?? null,
    };
  });
}

// Stats agregados del header de /patrones.
export async function getPatronesStats(): Promise<PatronesStats> {
  const supabase = await createClient();
  // Detectados este mes (no resueltos), resueltos en últimos 7 días,
  // valor_en_juego sumado entre activos.
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);

  const [activosRes, resueltosRes] = await Promise.all([
    supabase
      .from("patrones")
      .select("valor_en_juego")
      .is("resuelto_en", null)
      .gte("detectado_en", inicioMes.toISOString()),
    supabase
      .from("patrones")
      .select("id", { count: "exact", head: true })
      .gte("resuelto_en", hace7.toISOString()),
  ]);

  if (activosRes.error) throw activosRes.error;
  if (resueltosRes.error) throw resueltosRes.error;

  const detectados = activosRes.data?.length ?? 0;
  const valor = (activosRes.data ?? []).reduce(
    (acc, p) => acc + (Number((p as { valor_en_juego: number }).valor_en_juego) || 0),
    0,
  );

  return {
    detectados_mes: detectados,
    resueltos_semana: resueltosRes.count ?? 0,
    valor_en_juego: valor,
  };
}

// Sidebar count: patrones no resueltos.
export async function getPatronesActivosCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("patrones")
    .select("id", { count: "exact", head: true })
    .is("resuelto_en", null);
  if (error) throw error;
  return count ?? 0;
}

// Para cada patrón, mostramos las cards de leads afectados. Levanta los
// datos necesarios en una sola query con join a comerciales.
export async function getLeadsAfectados(
  ids: string[],
): Promise<LeadAfectado[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, nombre, valor_estimado, origen, estado, fecha_creacion, fecha_ultimo_contacto, comerciales:responsable_id(iniciales, avatar_gradient)",
    )
    .in("id", ids);
  if (error) throw error;
  type Row = {
    id: string;
    nombre: string;
    valor_estimado: number;
    origen: string;
    estado: string;
    fecha_creacion: string;
    fecha_ultimo_contacto: string | null;
    // Supabase puede devolver el join como objeto o como array de 0/1
    // elementos según cómo infiera la relación. Normalizamos abajo.
    comerciales:
      | { iniciales: string; avatar_gradient: string }
      | { iniciales: string; avatar_gradient: string }[]
      | null;
  };
  return ((data ?? []) as unknown as Row[]).map((row) => {
    const com = Array.isArray(row.comerciales)
      ? (row.comerciales[0] ?? null)
      : row.comerciales;
    const diasUlt = row.fecha_ultimo_contacto
      ? Math.floor(
          (Date.now() - new Date(row.fecha_ultimo_contacto).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : Math.floor(
          (Date.now() - new Date(row.fecha_creacion).getTime()) /
            (1000 * 60 * 60 * 24),
        );
    const meta = capitalize(row.estado) + " · " + diasUlt + " días sin tocar";
    return {
      id: row.id,
      nombre: row.nombre,
      meta,
      valor: row.valor_estimado,
      comercial: com
        ? {
            iniciales: com.iniciales,
            avatar_gradient: com.avatar_gradient,
          }
        : null,
    };
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Re-export el tipo PatronTipo para evitar imports cruzados en el caller.
export type { PatronTipo };
