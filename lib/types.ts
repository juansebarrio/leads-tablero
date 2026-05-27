// Tipos compartidos del dominio. Reflejan el esquema SQL de
// supabase/migrations + los joins/cálculos de las vistas.
// Hasta que tengamos `pnpm db:types` corriendo, esta es la fuente de verdad.

export type Origen = "formulario" | "referido" | "linkedin" | "whatsapp";
export type Estado =
  | "nuevo"
  | "conversacion"
  | "propuesta"
  | "cierre"
  | "ganado"
  | "perdido";

export type MotivoPerdida =
  | "precio"
  | "timing"
  | "competencia"
  | "no_respondio"
  | "cambio_necesidad"
  | "otro";
export type TipoNegocio = "recurrente" | "proyecto";
export type Temperatura = "hot" | "warm" | "med" | "cool";
export type EstadoOportunidad =
  | "caliente"
  | "esperando_firma"
  | "por_reactivar"
  | "sin_asignar";
export type CanalContacto =
  | "mail"
  | "llamado"
  | "whatsapp"
  | "reunion"
  | "linkedin";

// Canales internos: no aparecen como "Registrar contacto" pero sí en la
// timeline de la ficha. Sirven para auditoría (quién cambió qué).
export type CanalInterno = "cambio_estado" | "reasignacion";
export type CanalContactoExtendido = CanalContacto | CanalInterno;
export type Modalidad = "meet" | "zoom" | "whatsapp" | "presencial";
export type AgendaTag =
  | "cierre_semana"
  | "referido"
  | "propuesta"
  | "definitiva";

export type Comercial = {
  id: string;
  nombre: string;
  iniciales: string;
  avatar_gradient: string;
  email: string;
  creado_en: string;
  meta_mensual: number;
};

// Devuelto por v_comerciales_metricas.
export type ComercialConMetricas = Comercial & {
  leads_activos: number;
  pipeline_valor: number;
  ganados_mes_cantidad: number;
  ganados_mes_valor: number;
  ratio_cierre: number; // 0-100
  leads_frios: number;
};

// Sumas globales del equipo (calculadas en JS desde los comerciales).
export type EquipoMetricas = {
  leads_activos: number;
  pipeline_valor: number;
  ganados_mes_cantidad: number;
  ganados_mes_valor: number;
  ratio_cierre: number;
};

export type Lead = {
  id: string;
  nombre: string;
  origen: Origen;
  origen_detalle: string | null;
  estado: Estado;
  valor_estimado: number;
  tipo_negocio: TipoNegocio;
  meses_compromiso: number | null;
  responsable_id: string | null;
  fecha_creacion: string;
  fecha_ultimo_contacto: string | null;
  proximo_paso: string | null;
  proximo_paso_fecha: string | null;
  temperatura: Temperatura;
  estado_oportunidad: EstadoOportunidad | null;
  motivo_perdida?: MotivoPerdida | null;
  detalle_perdida?: string | null;
  valor_final?: number | null;
  fecha_cierre?: string | null;
  comentario_cierre?: string | null;
};

// Devuelto por v_leds_frios y v_oportunidades_dia (lead + comercial flattened).
export type LeadConComercial = Lead & {
  comercial_nombre: string | null;
  comercial_iniciales: string | null;
  comercial_avatar: string | null;
};

export type LeadFrio = LeadConComercial & {
  dias_frio: number;
};

export type OportunidadDia = LeadConComercial;

export type EventoAgenda = {
  id: string;
  lead_id: string | null;
  fecha: string;
  duracion_min: number;
  titulo: string;
  modalidad: Modalidad;
  tag: AgendaTag | null;
};

export type Contacto = {
  id: string;
  lead_id: string;
  fecha: string;
  canal: CanalContacto;
  nota: string | null;
  metadata?: Record<string, unknown>;
};

// Devuelto por v_leads_kanban.
export type LeadKanban = LeadConComercial & {
  dias_en_estado: number;
};

// Devuelto por getLeadConDetalle.
export type LeadDetalle = Lead & {
  comerciales: Comercial | null;
  contactos: Contacto[];
  agendaRelacionada: EventoAgenda[];
};

export type PipelineEstado = {
  estado: Estado;
  cantidad: number;
  valor_total: number;
};

// ─── Patrones (pantalla /patrones) ───────────────────────────────────────────

export type PatronTipo =
  | "operativo"
  | "atasco"
  | "oportunidad"
  | "tendencia"
  | "sugerencia";

// Chart data opcional que va dentro de Patron.metadata.chart.
// Hoy solo lo usa el detector "mejor horario" (oportunidad).
export type ChartData = {
  // Tipo de visualización; permite que MiniChart elija el render.
  tipo: "mejor_horario";
  labels: string[]; // Eje X (ej: ['L','M','Mar','J','V'])
  datos: { label: string; valor: number; highlight?: boolean }[];
  promedio: number;
  unidad?: string; // "%" por default
};

export type Patron = {
  id: string;
  tipo: PatronTipo;
  clave_unica: string;
  titulo: string;             // HTML simple: solo <strong>
  explainer: string;          // HTML simple: solo <strong>
  detectado_en: string;
  resuelto_en: string | null;
  resuelto_por: string | null;
  resuelto_por_nombre?: string | null; // join opcional
  leads_afectados: string[];
  valor_en_juego: number;
  metadata: {
    chart?: ChartData;
    label_count?: string;
    [key: string]: unknown;
  };
  accion_label: string | null;
  accion_href: string | null;
};

// Resumen visible de un lead dentro de la lista "afectados" de un patrón.
export type LeadAfectado = {
  id: string;
  nombre: string;
  meta: string; // "Formulario · 6 días" / "Propuesta · 18 días sin tocar"
  valor: number;
  comercial: {
    iniciales: string;
    avatar_gradient: string;
  } | null;
};

// Stats agregados de la pantalla /patrones.
export type PatronesStats = {
  detectados_mes: number;
  resueltos_semana: number;
  valor_en_juego: number;
};

// Compat: el banner viejo (AIInsight) trabajaba con esta shape. Para no
// romper el componente, conservamos el tipo y lo derivamos del primer
// patrón disponible. Cuando reescribamos AIInsight para ser genérico,
// este tipo desaparece.
export type PatronIa = {
  patron: string;
  cantidad: number;
  lead_ids: string[];
  desde: string;
  hasta: string;
};

// /conversion

export type FunnelData = {
  nuevos_total: number;
  conversacion_acum: number;
  propuesta_acum: number;
  cierre_acum: number;
  ganados: number;
  valor_ganado: number;
};

export type TimingItem = {
  estado_from: string; // 'inicio' | 'nuevo' | 'conversacion' | 'propuesta' | 'cierre'
  estado_to: string; // 'conversacion' | 'propuesta' | 'cierre' | 'ganado'
  cantidad_transiciones: number;
  dias_promedio: number;
};

export type TrendPoint = {
  meses_atras: number;
  mes: string; // ISO date "2026-05-01T00:00:00..."
  creados: number;
  ganados: number;
};

export type PeriodoConversion = "mes_actual" | "mes_anterior" | "trimestre";

// ─── Cerrados (pantalla /cerrados) ───────────────────────────────────────────

export type GanadoMes = {
  id: string;
  nombre: string;
  origen: Origen;
  estado: Estado;
  valor_estimado: number;
  valor_final: number | null;
  valor_cerrado: number;     // coalesce(valor_final, valor_estimado)
  tipo_negocio: TipoNegocio;
  meses_compromiso: number | null;
  responsable_id: string | null;
  fecha_creacion: string;
  fecha_cierre_efectiva: string;
  comentario_cierre: string | null;
  responsable_nombre: string | null;
  responsable_iniciales: string | null;
  responsable_avatar: string | null;
  dias_cierre: number;
};

export type PerdidoMes = {
  id: string;
  nombre: string;
  origen: Origen;
  estado: Estado;
  valor_estimado: number;
  motivo_perdida: MotivoPerdida | null;
  detalle_perdida: string | null;
  responsable_id: string | null;
  fecha_creacion: string;
  fecha_cierre_efectiva: string;
  responsable_nombre: string | null;
  responsable_iniciales: string | null;
  responsable_avatar: string | null;
  estado_previo: string | null;
};

export type RankingComercial = {
  id: string;
  nombre: string;
  iniciales: string;
  avatar_gradient: string;
  leads_ganados: number;
  valor_total: number;
  ratio_cierre: number; // 0–100
};

export type MotivoPerdidaAgg = {
  motivo: MotivoPerdida;
  cantidad: number;
  valor_total: number;
  porcentaje: number; // 0–100
};

export type MetaMes = {
  valor: number;
  currency: "USD";
};

export type CerradosKpis = {
  ganados_cantidad: number;
  valor_cerrado: number;
  perdidos_cantidad: number;
  valor_perdido: number;
  ratio_cierre: number; // 0–100, ganados / (ganados + cierres + perdidos del mes)
  delta_ganados_pct: number | null; // vs mes anterior
  delta_valor_pct: number | null;
  pct_meta: number; // valor_cerrado / meta
};
