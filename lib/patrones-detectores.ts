// Detectores de patrones del producto. Cada función analiza los datos
// actuales y registra (o actualiza) un patrón en la tabla `patrones`.
//
// Diseño:
//  - Idempotente: misma clave_unica por (detector, ventana de tiempo).
//    Si ya existe un patrón con esa clave NO resuelto, se actualiza.
//    Si ya está resuelto, no se recrea (respeta la decisión manual).
//  - On-demand: la pantalla /patrones llama detectarPatrones() antes de
//    leer. También se corre al final del reset diario.

import { createClient } from "@/lib/supabase/server";
import type { PatronTipo } from "@/lib/types";

const TZ_LABEL_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Semana ISO 8601 — clave estable para detectores semanales.
function semanaISO(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function mesISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diasEntre(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", TZ_LABEL_OPTS);
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type UpsertParams = {
  clave_unica: string;
  tipo: PatronTipo;
  titulo: string;
  explainer: string;
  leads_afectados: string[];
  valor_en_juego: number;
  metadata?: Record<string, unknown>;
  accion_label?: string | null;
  accion_href?: string | null;
};

// Upsert con regla: si el patrón está resuelto, no se recrea ni actualiza.
async function upsertPatron(supabase: SupabaseClient, p: UpsertParams) {
  const { data: existing, error: errSel } = await supabase
    .from("patrones")
    .select("id, resuelto_en")
    .eq("clave_unica", p.clave_unica)
    .maybeSingle();
  if (errSel) {
    console.warn(`[insights] select ${p.clave_unica}:`, errSel.message);
    return;
  }
  if (existing) {
    if (existing.resuelto_en) return; // respetar marca manual
    const { error } = await supabase
      .from("patrones")
      .update({
        titulo: p.titulo,
        explainer: p.explainer,
        leads_afectados: p.leads_afectados,
        valor_en_juego: p.valor_en_juego,
        metadata: p.metadata ?? {},
        accion_label: p.accion_label ?? null,
        accion_href: p.accion_href ?? null,
      })
      .eq("id", existing.id);
    if (error) console.warn(`[insights] update ${p.clave_unica}:`, error.message);
    return;
  }
  const { error } = await supabase.from("patrones").insert({
    clave_unica: p.clave_unica,
    tipo: p.tipo,
    titulo: p.titulo,
    explainer: p.explainer,
    leads_afectados: p.leads_afectados,
    valor_en_juego: p.valor_en_juego,
    metadata: p.metadata ?? {},
    accion_label: p.accion_label ?? null,
    accion_href: p.accion_href ?? null,
  });
  if (error) console.warn(`[insights] insert ${p.clave_unica}:`, error.message);
}

// Si el detector ya no aplica (la condición se "auto-resolvió" sin
// intervención), borramos el patrón abierto para mantener la pantalla
// limpia. Los resueltos manualmente se respetan.
async function dropSiSinSentido(
  supabase: SupabaseClient,
  clave_unica: string,
) {
  await supabase
    .from("patrones")
    .delete()
    .eq("clave_unica", clave_unica)
    .is("resuelto_en", null);
}

// ─── Detectores ──────────────────────────────────────────────────────────────

// 1) OPERATIVO · leads del formulario web sin responsable hace +3 días.
async function detectarLeadsSinAsignar(supabase: SupabaseClient) {
  const clave = `operativo:leads_sin_asignar:${semanaISO()}`;
  const hace3 = new Date();
  hace3.setDate(hace3.getDate() - 3);

  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, valor_estimado, fecha_creacion")
    .eq("origen", "formulario")
    .is("responsable_id", null)
    .not("estado", "in", "(ganado,perdido)")
    .lte("fecha_creacion", hace3.toISOString())
    .order("fecha_creacion", { ascending: true });
  if (error) {
    console.warn("[insights] leads_sin_asignar:", error.message);
    return;
  }
  if (!data || data.length < 3) {
    await dropSiSinSentido(supabase, clave);
    return;
  }
  const ids = data.map((l) => l.id as string);
  const valor = data.reduce(
    (a, l) => a + Number((l as { valor_estimado: number }).valor_estimado),
    0,
  );
  const fechas = data.map((l) => l.fecha_creacion as string);
  const desde = fechas[0];
  const hasta = fechas[fechas.length - 1];

  await upsertPatron(supabase, {
    clave_unica: clave,
    tipo: "operativo",
    titulo: `${data.length} leads del formulario web siguen <strong>sin asignar comercial</strong>`,
    explainer: `Entraron entre el <strong>${fmtFecha(desde)}</strong> y el <strong>${fmtFecha(hasta)}</strong>. El cuello no es de seguimiento, es de <strong>asignación automática</strong>. Si tuvieran responsable hoy, ya estarían en conversación.`,
    leads_afectados: ids,
    valor_en_juego: valor,
    metadata: {
      desde,
      hasta,
      label_count: `Leads afectados · USD ${valor.toLocaleString("es-AR")}`,
    },
    accion_label: "Revisar reglas de asignación",
    accion_href: "/equipo",
  });
}

// 2) ATASCO · leads atascados +14 días en una etapa concreta.
async function detectarAtascosEnEtapa(supabase: SupabaseClient) {
  const etapas: { estado: string; label: string; promedio: number }[] = [
    { estado: "propuesta", label: "Propuesta", promedio: 6 },
    { estado: "cierre", label: "Cierre", promedio: 5 },
  ];

  for (const { estado, label, promedio } of etapas) {
    const clave = `atasco:${estado}:${semanaISO()}`;
    const { data, error } = await supabase
      .from("v_leads_kanban")
      .select("id, nombre, valor_estimado, dias_en_estado")
      .eq("estado", estado)
      .gte("dias_en_estado", 14)
      .order("dias_en_estado", { ascending: false });
    if (error) {
      console.warn(`[insights] atascos ${estado}:`, error.message);
      continue;
    }
    if (!data || data.length < 3) {
      await dropSiSinSentido(supabase, clave);
      continue;
    }
    const ids = data.map((l) => l.id as string);
    const valor = data.reduce(
      (a, l) => a + Number((l as { valor_estimado: number }).valor_estimado),
      0,
    );

    await upsertPatron(supabase, {
      clave_unica: clave,
      tipo: "atasco",
      titulo: `${data.length} leads atascados hace <strong>+14 días en ${label}</strong>`,
      explainer: `Cotización enviada pero sin movimiento. <strong>Promedio normal en esta etapa: ${promedio} días.</strong> Vale un seguimiento con valor agregado (caso de éxito, descuento, FAQ).`,
      leads_afectados: ids,
      valor_en_juego: valor,
      metadata: {
        etapa: estado,
        label_count: `Leads atascados · USD ${valor.toLocaleString("es-AR")}`,
      },
      accion_label: "Ver en pipeline",
      accion_href: `/pipeline?estado=${estado}`,
    });
  }
}

// 3) OPORTUNIDAD · mejor día de la semana para cerrar (basado en leads
// ganados con fecha_cierre conocida).
async function detectarMejorHorarioCierre(supabase: SupabaseClient) {
  const clave = `oportunidad:mejor_dia_cierre:${mesISO()}`;
  const hace90 = new Date();
  hace90.setDate(hace90.getDate() - 90);

  const { data, error } = await supabase
    .from("leads")
    .select("id, fecha_cierre, fecha_creacion, estado")
    .eq("estado", "ganado")
    .gte("fecha_creacion", hace90.toISOString());
  if (error) {
    console.warn("[insights] mejor_dia:", error.message);
    return;
  }
  if (!data || data.length < 5) {
    await dropSiSinSentido(supabase, clave);
    return;
  }

  // Distribución por día de semana (0=Dom, 1=Lun, ..., 6=Sáb).
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const cuentas = new Array(7).fill(0) as number[];
  for (const lead of data) {
    const fecha = (lead.fecha_cierre as string) || (lead.fecha_creacion as string);
    const d = new Date(fecha);
    cuentas[d.getDay()]++;
  }
  const total = cuentas.reduce((a, c) => a + c, 0);
  if (total < 5) {
    await dropSiSinSentido(supabase, clave);
    return;
  }
  // Mejor día = el con más ganados.
  let mejorIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (cuentas[i] > cuentas[mejorIdx]) mejorIdx = i;
  }
  const mejorCount = cuentas[mejorIdx];
  const ratioMejor = mejorCount / total;
  const ratioPromedio = 1 / 7;

  // Umbral: el mejor día concentra al menos 30% de los cierres.
  if (ratioMejor < 0.3) {
    await dropSiSinSentido(supabase, clave);
    return;
  }

  const labelMejor = labels[mejorIdx];
  const pctMejor = Math.round(ratioMejor * 100);
  const pctPromedio = Math.round(ratioPromedio * 100);

  await upsertPatron(supabase, {
    clave_unica: clave,
    tipo: "oportunidad",
    titulo: `Tu mejor día para cerrar es el <strong>${labelMejor.toLowerCase()}</strong>`,
    explainer: `En los últimos 90 días, <strong>${mejorCount} de ${total} cierres</strong> (${pctMejor}%) ocurrieron un ${labelMejor.toLowerCase()}. Es casi <strong>${(ratioMejor / ratioPromedio).toFixed(1)}× el promedio</strong>. Considerá reservar esa franja para tus reuniones decisivas.`,
    leads_afectados: [],
    valor_en_juego: 0,
    metadata: {
      chart: {
        tipo: "mejor_horario",
        labels: labels.map((l, i) => (i === mejorIdx ? l : l[0])),
        datos: labels.map((l, i) => ({
          label: l,
          valor: total === 0 ? 0 : Math.round((cuentas[i] / total) * 100),
          highlight: i === mejorIdx,
        })),
        promedio: pctPromedio,
        unidad: "%",
      },
    },
    accion_label: "Ver detalle",
    accion_href: "/conversion",
  });
}

// 4) TENDENCIA · creaste más leads pero el ratio no se movió.
async function detectarCambioRatio(supabase: SupabaseClient) {
  const clave = `tendencia:cambio_ratio:${mesISO()}`;

  const [actualRes, anteriorRes] = await Promise.all([
    supabase.rpc("funnel_para_mes", { p_meses_atras: 0 }),
    supabase.rpc("funnel_para_mes", { p_meses_atras: 1 }),
  ]);
  if (actualRes.error || anteriorRes.error) {
    console.warn(
      "[insights] cambio_ratio rpc:",
      actualRes.error?.message ?? anteriorRes.error?.message,
    );
    return;
  }
  const actual = Array.isArray(actualRes.data) ? actualRes.data[0] : actualRes.data;
  const anterior = Array.isArray(anteriorRes.data) ? anteriorRes.data[0] : anteriorRes.data;
  const creadosA = Number(actual?.nuevos_total) || 0;
  const creadosB = Number(anterior?.nuevos_total) || 0;
  const ganadosA = Number(actual?.ganados) || 0;
  const ganadosB = Number(anterior?.ganados) || 0;

  if (creadosB === 0 || creadosA === 0) {
    await dropSiSinSentido(supabase, clave);
    return;
  }
  const ratioA = (ganadosA / creadosA) * 100;
  const ratioB = (ganadosB / creadosB) * 100;
  const cambioCreados = ((creadosA - creadosB) / creadosB) * 100;
  const cambioRatio = ratioA - ratioB;

  // Patrón: leads creados subió +10% pero ratio quedó plano o bajó.
  if (cambioCreados < 10 || cambioRatio > 1) {
    await dropSiSinSentido(supabase, clave);
    return;
  }

  await upsertPatron(supabase, {
    clave_unica: clave,
    tipo: "tendencia",
    titulo: `Creaste <strong>+${Math.round(cambioCreados)}% leads</strong> este mes pero <strong>el ratio de cierre no acompañó</strong>`,
    explainer: `${creadosA} leads creados vs ${creadosB} el mes pasado, pero el ratio quedó en ${ratioA.toFixed(1)}% (${cambioRatio >= 0 ? "+" : ""}${cambioRatio.toFixed(1)} pp). El cuello está después de la propuesta — revisá qué te está frenando para cerrar.`,
    leads_afectados: [],
    valor_en_juego: 0,
    metadata: {
      ratio_actual: ratioA,
      ratio_anterior: ratioB,
      creados_actual: creadosA,
      creados_anterior: creadosB,
    },
    accion_label: "Ver conversión",
    accion_href: "/conversion",
  });
}

// 5) SUGERENCIA · un comercial está sobrecargado y otro tiene capacidad
// con mejor ratio.
async function detectarDesbalanceEquipo(supabase: SupabaseClient) {
  const clave = `sugerencia:desbalance_equipo:${semanaISO()}`;

  const { data, error } = await supabase
    .from("v_comerciales_metricas")
    .select("id, nombre, leads_activos, ratio_cierre");
  if (error) {
    console.warn("[insights] desbalance:", error.message);
    return;
  }
  if (!data || data.length < 2) {
    await dropSiSinSentido(supabase, clave);
    return;
  }
  const comerciales = (data as {
    id: string;
    nombre: string;
    leads_activos: number;
    ratio_cierre: number;
  }[])
    .map((c) => ({
      ...c,
      leads_activos: Number(c.leads_activos) || 0,
      ratio_cierre: Number(c.ratio_cierre) || 0,
    }));

  const masCargado = [...comerciales].sort((a, b) => b.leads_activos - a.leads_activos)[0];
  const menosCargado = [...comerciales].sort((a, b) => a.leads_activos - b.leads_activos)[0];

  // Si el más cargado tiene >=2× el menos, y el menos tiene mejor ratio,
  // creamos sugerencia.
  if (
    menosCargado.leads_activos === 0 ||
    masCargado.leads_activos < menosCargado.leads_activos * 2 ||
    menosCargado.ratio_cierre <= masCargado.ratio_cierre
  ) {
    await dropSiSinSentido(supabase, clave);
    return;
  }

  const nombreMenos = menosCargado.nombre.split(" ")[0];
  const nombreMas = masCargado.nombre.split(" ")[0];

  await upsertPatron(supabase, {
    clave_unica: clave,
    tipo: "sugerencia",
    titulo: `<strong>${nombreMenos} tiene capacidad</strong> y mejor ratio del mes. Considerá reasignarle 2–3 leads`,
    explainer: `${nombreMenos} lleva ${menosCargado.leads_activos} leads activos (vs ${nombreMas} con ${masCargado.leads_activos}) y tiene <strong>${menosCargado.ratio_cierre.toFixed(0)}% de ratio de cierre</strong> contra el ${masCargado.ratio_cierre.toFixed(0)}% del más cargado.`,
    leads_afectados: [],
    valor_en_juego: 0,
    metadata: {
      mas_cargado_nombre: masCargado.nombre,
      mas_cargado_activos: masCargado.leads_activos,
      menos_cargado_nombre: menosCargado.nombre,
      menos_cargado_activos: menosCargado.leads_activos,
    },
    accion_label: "Ver equipo",
    accion_href: "/equipo",
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function detectarPatrones() {
  const supabase = await createClient();
  await Promise.all([
    detectarLeadsSinAsignar(supabase),
    detectarAtascosEnEtapa(supabase),
    detectarMejorHorarioCierre(supabase),
    detectarCambioRatio(supabase),
    detectarDesbalanceEquipo(supabase),
  ]);
}
